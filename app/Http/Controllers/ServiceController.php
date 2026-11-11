<?php

namespace App\Http\Controllers;

use App\Enums\BeneficiaryType;
use App\Models\Branch;
use App\Models\Client;
use App\Models\Deceased;
use App\Models\InventoryItem;
use App\Models\Service;
use App\Models\ServiceType;
use App\Models\Vehicle;
use App\Services\AvailabilityService;
use App\Services\ServiceAssignmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $status = $request->input('status', '');

        $services = Service::query()
            ->with(['client:id,name,rut', 'deceased:id,full_name', 'serviceType:id,name'])
            // Sumamos los pagos de forma eficiente (Eager Loading con withSum)
            ->withSum('payments', 'amount')
            ->when($search, fn ($q) => $q->search($search))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->orderByDesc('scheduled_at')
            ->paginate(15)
            ->withQueryString()
            ->through(function ($service) {
                // Agregamos atributos calculados al objeto que va al frontend
                $totalPaid = (float) ($service->payments_sum_amount ?? 0);
                $totalPrice = (float) $service->total_price;
                $balance = $totalPrice - $totalPaid;

                $service->total_paid = $totalPaid;
                $service->balance = $balance;
                $service->is_fully_paid = $balance <= 0.01;
                $service->payment_percentage = $totalPrice > 0 ? min(100, round(($totalPaid / $totalPrice) * 100, 1)) : 0;

                // Asegurar que los accessors vayan en el JSON que recibe el frontend
                $service->append(['status_label', 'beneficiary_label']);

                return $service;
            });

        return Inertia::render('Services/Index', [
            'services' => $services,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Muestra el formulario de creación de un nuevo servicio funerario.
     *
     * Este método prepara todos los datos necesarios para el formulario React:
     * - clients: listado de clientes activos (para el select)
     * - deceased: listado de fallecidos registrados (para el select)
     * - serviceTypes: tipos de servicio con precio base y duración
     * - branches: sucursales de la funeraria (2 actualmente)
     * - beneficiaryTypes: enum de tipos de beneficiario (AFP, municipal, etc.)
     *
     * ¿Por qué cargar todo esto desde el backend?
     * - Evita múltiples requests desde el frontend
     * - Los selects se populan con datos reales
     * - El usuario puede elegir sin esperar más llamadas
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        return Inertia::render('Services/Create', [
            // Clientes activos: solo los que no están eliminados
            'clients' => Client::active()
                ->orderBy('name')
                ->get(['id', 'name', 'rut']),

            // Fallecidos: todos, ordenados alfabéticamente
            'deceased' => Deceased::orderBy('full_name')
                ->get(['id', 'full_name', 'rut']),

            // Tipos de servicio: con precio base y duración predefinida
            'serviceTypes' => ServiceType::active()
                ->orderBy('sort_order')
                ->get(['id', 'name', 'base_price', 'duration_hours']),

            // Sucursales: ahora son 2 (calle Blanco 1 y 2)
            'branches' => Branch::active()
                ->orderBy('name')
                ->get(['id', 'name', 'code']),

            // Tipos de beneficiario: convertimos el enum de PHP a array
            // para enviarlo al frontend
            'beneficiaryTypes' => collect(BeneficiaryType::cases())->map(fn ($type) => [
                'value' => $type->value,
                'label' => $type->label(),
            ]),
        ]);
    }

    /**
     * Guarda un nuevo servicio funerario en la base de datos.
     *
     * Flujo del método:
     * 1. Valida todos los campos del formulario
     * 2. Castea tipos (strings a int/float) — los datos HTTP vienen como string
     * 3. Calcula automáticamente:
     *    - afp_amount: según el tipo de beneficiario
     *    - family_amount: lo que paga la familia (total - AFP - municipal)
     *    - total_price: suma de base + cargos - descuentos
     *    - ends_at: fecha de término (scheduled_at + duration_hours)
     * 4. Guarda el servicio con status "pending"
     * 5. Redirige con mensaje de éxito
     *
     * IMPORTANTE: Los montos de AFP se aplican según el tipo de beneficiario:
     * - AFP → $600.000 cubiertos por la AFP (el resto lo paga la familia)
     * - AdultoMayor → $1.070.000 de asignación (sin AFP)
     * - Municipal → se factura a la municipalidad (~3 meses de demora)
     * - Particular → la familia paga el 100%
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        // ──────────────────────────────────────────────────────────────
        // PASO 1: Validar todos los campos
        // ──────────────────────────────────────────────────────────────
        $validated = $request->validate([
            // Relaciones obligatorias
            'client_id' => 'required|exists:clients,id',
            'deceased_id' => 'required|exists:deceased,id',
            'service_type_id' => 'required|exists:service_types,id',
            'branch_id' => 'required|exists:branches,id',  // ← NUEVO

            // Tipo de beneficiario (AFP, municipal, etc.)
            'beneficiary_type' => 'required|string|in:afp,ips,dipreca,capredena,municipal,particular',  // ← NUEVO

            // Programación
            'scheduled_at' => 'required|date|after:now',
            'duration_hours' => 'required|integer|min:1',

            // Montos
            'base_price' => 'required|numeric|min:0',
            'additional_charges' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',

            // Monto municipal (solo si aplica)
            'municipal_amount' => 'nullable|numeric|min:0',  // ← NUEVO

            // Notas
            'client_notes' => 'nullable|string|max:1000',
            'internal_notes' => 'nullable|string|max:1000',
        ]);

        // ──────────────────────────────────────────────────────────────
        // PASO 2: Castear tipos (crítico para evitar errores con Carbon)
        // Los datos del request HTTP siempre llegan como STRING.
        // Carbon y las funciones de cálculo necesitan int/float.
        // ──────────────────────────────────────────────────────────────
        $validated['duration_hours'] = (int) $validated['duration_hours'];
        $validated['base_price'] = (float) $validated['base_price'];
        $validated['additional_charges'] = (float) ($validated['additional_charges'] ?? 0);
        $validated['discount'] = (float) ($validated['discount'] ?? 0);
        $validated['municipal_amount'] = (float) ($validated['municipal_amount'] ?? 0);

        // ──────────────────────────────────────────────────────────────
        // PASO 3: Calcular montos según el tipo de beneficiario
        // ──────────────────────────────────────────────────────────────

        // Convertir el string a Enum para acceder a sus métodos
        $beneficiaryType = BeneficiaryType::from($validated['beneficiary_type']);

        // Monto cubierto por la AFP (solo aplica al tipo AFP)
        $validated['afp_amount'] = $beneficiaryType->defaultAmount();

        // Total del servicio: base + cargos - descuento
        $validated['total_price'] =
            $validated['base_price']
            + $validated['additional_charges']
            - $validated['discount'];

        // Monto que paga la familia = total - AFP - municipal
        $validated['family_amount'] =
            $validated['total_price']
            - $validated['afp_amount']
            - $validated['municipal_amount'];

        // Si el tipo es Municipal, calcular fecha esperada de pago (+3 meses)
        if ($beneficiaryType === BeneficiaryType::Municipal) {
            $validated['expected_payment_date'] = \Carbon\Carbon::parse($validated['scheduled_at'])
                ->addMonths(3);
        }

        // ──────────────────────────────────────────────────────────────
        // PASO 4: Calcular fecha de término del servicio
        // ──────────────────────────────────────────────────────────────
        $validated['ends_at'] = \Carbon\Carbon::parse($validated['scheduled_at'])
            ->addHours($validated['duration_hours']);

        // ──────────────────────────────────────────────────────────────
        // PASO 5: Auditoría — quién creó y estado inicial
        // ──────────────────────────────────────────────────────────────
        $validated['created_by'] = auth()->id();
        $validated['status'] = 'pending';  // Todo servicio empieza pendiente

        // ──────────────────────────────────────────────────────────────
        // PASO 6: Guardar en la base de datos
        // ──────────────────────────────────────────────────────────────
        Service::create($validated);

        // ──────────────────────────────────────────────────────────────
        // PASO 7: Redirigir con mensaje de éxito
        // ──────────────────────────────────────────────────────────────
        return redirect()->route('services.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Servicio creado correctamente. Pendiente de aprobación.',
            ]);
    }

    public function show(Service $service, AvailabilityService $availability)
    {
        // Cargar relaciones existentes
        $service->load([
            'client', 'deceased', 'serviceType', 'branch',
            'createdBy:id,name', 'approvedBy:id,name',
            'inventoryItems', 'vehicles',
            'payments',
            'assignments.user:id,name,email',
        ]);

        // Agregar manualmente los atributos calculados
        $service->append(['beneficiary_label']);

        // Items disponibles para asignar
        $availableItems = InventoryItem::active()
            ->where('stock', '>', 0)
            ->orderBy('category')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'category', 'stock', 'price']);

        // Vehículos disponibles
        $availableVehicles = Vehicle::available()
            ->orderBy('type')
            ->orderBy('plate')
            ->get(['id', 'plate', 'type', 'brand', 'model', 'status']);

        // ──────────────────────────────────────────────────────────
        // NUEVO: Empleados disponibles en la fecha del servicio
        // Solo se muestran los que NO tienen ausencia aprobada
        // en el día programado del servicio
        // ──────────────────────────────────────────────────────────
        $serviceDate = \Carbon\Carbon::parse($service->scheduled_at);
        $availableEmployees = $availability->getAvailableUsers($serviceDate)
            ->load('roles')
            ->filter(fn ($u) => $u->hasAnyRole(['Administrador', 'Encargado', 'Chofer']));

        // Calcular los saldos de forma explícita para enviarlos al frontend
        $totalPaid = (float) $service->payments()->sum('amount');
        $balance = (float) $service->total_price - $totalPaid;

        return Inertia::render('Services/Show', [
            'service' => $service,
            'availableItems' => $availableItems,
            'availableVehicles' => $availableVehicles,
            'availableEmployees' => $availableEmployees->values(),

            // Datos calculados de forma externa
            'financials' => [
                'total_paid' => $totalPaid,
                'balance' => $balance,
                'is_fully_paid' => $balance <= 0.01,
            ],
        ]);
    }

    /**
     * Muestra el formulario de edición de un servicio existente.
     *
     * Carga todos los catálogos necesarios (clientes, fallecidos, etc.)
     * para que el usuario pueda cambiar cualquier campo del servicio.
     *
     * Además del servicio actual, pasa los mismos datos que create():
     * - branches, beneficiaryTypes: nuevos catálogos de FASE 11.5
     *
     * @param Service $service Servicio a editar (route model binding)
     * @return \Inertia\Response
     */
    public function edit(Service $service)
    {
        return Inertia::render('Services/Edit', [
            'service' => $service,
            'clients' => Client::active()
                ->orderBy('name')
                ->get(['id', 'name', 'rut']),
            'deceased' => Deceased::orderBy('full_name')
                ->get(['id', 'full_name', 'rut']),
            'serviceTypes' => ServiceType::active()
                ->orderBy('sort_order')
                ->get(['id', 'name', 'base_price', 'duration_hours']),
            'branches' => Branch::active()
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'beneficiaryTypes' => collect(BeneficiaryType::cases())->map(fn ($type) => [
                'value' => $type->value,
                'label' => $type->label(),
            ]),
        ]);
    }

    /**
     * Actualiza un servicio existente.
     *
     * Recalcula automáticamente:
     * - Montos (total, family_amount, afp_amount)
     * - Fecha de término (ends_at)
     *
     * Si el tipo de beneficiario cambia (ej: AFP → Municipal),
     * los montos se recalculan para reflejar la nueva realidad.
     *
     * @param Request $request
     * @param Service $service
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Service $service)
    {
        // ──────────────────────────────────────────────────────────────
        // Validación (misma que store, pero sin 'after:now' para scheduled_at
        // porque se permite editar servicios ya programados)
        // ──────────────────────────────────────────────────────────────
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'deceased_id' => 'required|exists:deceased,id',
            'service_type_id' => 'required|exists:service_types,id',
            'branch_id' => 'required|exists:branches,id',
            'beneficiary_type' => 'required|string|in:afp,ips,dipreca,capredena,municipal,particular',
            'scheduled_at' => 'required|date',
            'duration_hours' => 'required|integer|min:1',
            'base_price' => 'required|numeric|min:0',
            'additional_charges' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'municipal_amount' => 'nullable|numeric|min:0',
            'origin_location' => 'nullable|string|max:200',
            'destination_location' => 'nullable|string|max:200',
            'burial_at' => 'nullable|date',
            'client_notes' => 'nullable|string|max:1000',
            'internal_notes' => 'nullable|string|max:1000',
        ]);

        // ──────────────────────────────────────────────────────────────
        // Castear tipos
        // ──────────────────────────────────────────────────────────────
        $validated['duration_hours'] = (int) $validated['duration_hours'];
        $validated['base_price'] = (float) $validated['base_price'];
        $validated['additional_charges'] = (float) ($validated['additional_charges'] ?? 0);
        $validated['discount'] = (float) ($validated['discount'] ?? 0);
        $validated['municipal_amount'] = (float) ($validated['municipal_amount'] ?? 0);

        // ──────────────────────────────────────────────────────────────
        // Recalcular montos según el tipo de beneficiario
        // ──────────────────────────────────────────────────────────────
        $beneficiaryType = BeneficiaryType::from($validated['beneficiary_type']);
        $validated['afp_amount'] = $beneficiaryType->defaultAmount();
        $validated['total_price'] =
            $validated['base_price']
            + $validated['additional_charges']
            - $validated['discount'];
        $validated['family_amount'] =
            $validated['total_price']
            - $validated['afp_amount']
            - $validated['municipal_amount'];

        if ($beneficiaryType === BeneficiaryType::Municipal) {
            $validated['expected_payment_date'] = \Carbon\Carbon::parse($validated['scheduled_at'])
                ->addMonths(3);
        } else {
            $validated['expected_payment_date'] = null;
        }

        // ──────────────────────────────────────────────────────────────
        // Recalcular fecha de término
        // ──────────────────────────────────────────────────────────────
        $validated['ends_at'] = \Carbon\Carbon::parse($validated['scheduled_at'])
            ->addHours($validated['duration_hours']);

        // ──────────────────────────────────────────────────────────────
        // Guardar cambios
        // ──────────────────────────────────────────────────────────────
        $service->update($validated);

        return redirect()->route('services.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Servicio actualizado correctamente.',
            ]);
    }

    public function destroy(Service $service)
    {
        // Solo se pueden eliminar servicios pendientes
        if (! in_array($service->status, ['pending', 'with_observations'])) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'Solo se pueden eliminar servicios pendientes.',
            ]);
        }

        $service->delete();

        return redirect()->route('services.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Servicio eliminado correctamente.',
            ]);
    }

    /**
     * Aprobar un servicio (solo Administrador)
     */
    public function approve(Service $service)
    {
        if (! auth()->user()->hasRole('Administrador')) {
            abort(403, 'Solo el Administrador puede aprobar servicios.');
        }

        $service->update([
            'status' => 'accepted',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Servicio aprobado correctamente.',
        ]);
    }

    /**
     * Rechazar un servicio (solo Administrador)
     */
    public function reject(Request $request, Service $service)
    {
        if (! auth()->user()->hasRole('Administrador')) {
            abort(403, 'Solo el Administrador puede rechazar servicios.');
        }

        $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $service->update([
            'status' => 'rejected',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'rejection_reason' => $request->input('rejection_reason'),
        ]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Servicio rechazado.',
        ]);
    }

    /**
     * Asignar un item de inventario a un servicio (descuenta stock)
     */
    public function assignInventoryItem(Request $request, Service $service, ServiceAssignmentService $assigner)
    {
        $validated = $request->validate([
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:500',
        ]);

        $assigner->assignInventoryItem(
            $service,
            (int) $validated['inventory_item_id'],
            (int) $validated['quantity'],
            $validated['notes'] ?? null
        );

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Item asignado y stock actualizado.',
        ]);
    }

    /**
     * Remover un item de inventario del servicio (devuelve stock)
     */
    public function removeInventoryItem(Service $service, InventoryItem $item, ServiceAssignmentService $assigner)
    {
        $assigner->removeInventoryItem($service, $item->id);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Item removido y stock devuelto.',
        ]);
    }

    /**
     * Asignar un vehículo a un servicio
     */
    public function assignVehicle(Request $request, Service $service, ServiceAssignmentService $assigner)
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'departs_at' => 'nullable|date',
            'returns_at' => 'nullable|date|after:departs_at',
            'notes' => 'nullable|string|max:500',
        ]);

        $assigner->assignVehicle(
            $service,
            (int) $validated['vehicle_id'],
            $validated['departs_at'] ?? null,
            $validated['returns_at'] ?? null,
            $validated['notes'] ?? null
        );

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Vehículo asignado al servicio.',
        ]);
    }

    /**
     * Remover un vehículo de un servicio
     */
    public function removeVehicle(Service $service, Vehicle $vehicle, ServiceAssignmentService $assigner)
    {
        $assigner->removeVehicle($service, $vehicle->id);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Vehículo removido del servicio.',
        ]);
    }

    /**
     * Asigna un empleado al servicio.
     *
     * Valida que el empleado esté disponible (no de vacaciones).
     * Usa el AvailabilityService para la validación.
     *
     * Endpoint: POST /services/{service}/assign-employee
     */
    public function assignEmployee(
        Request $request,
        Service $service,
        AvailabilityService $availability
    ) {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role_in_service' => 'required|in:coordinator,assistant,driver',
            'notes' => 'nullable|string|max:500',
        ]);

        $user = \App\Models\User::findOrFail($validated['user_id']);

        // Validar disponibilidad (lanza Exception si no está disponible)
        try {
            $availability->validateAssignment($user, $service);
        } catch (\Exception $e) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => $e->getMessage(),
            ]);
        }

        // Crear asignación
        $service->assignments()->create([
            'user_id' => $user->id,
            'role_in_service' => $validated['role_in_service'],
            'notes' => $validated['notes'] ?? null,
            'assigned_by' => auth()->id(),
            'assigned_at' => now(),
        ]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => "{$user->name} asignado al servicio.",
        ]);
    }

    /**
     * Remueve un empleado del servicio.
     *
     * Endpoint: DELETE /services/{service}/assignments/{assignment}
     */
    public function removeEmployee(Service $service, \App\Models\ServiceAssignment $assignment)
    {
        // Verificar que la asignación pertenezca a este servicio
        if ($assignment->service_id !== $service->id) {
            abort(404);
        }

        $name = $assignment->user->name;
        $assignment->delete();

        return back()->with('toast', [
            'type' => 'success',
            'message' => "{$name} removido del servicio.",
        ]);
    }

    /**
     * Crea un expediente completo en una sola transacción.
     *
     * Recibe datos de Cliente, Fallecido, Servicio, Item de Inventario y Pago.
     * Si algo falla (ej: falta de stock), hace rollback de todo.
     */
    public function quickStore(Request $request, \App\Services\ServiceAssignmentService $assigner)
    {
        $validated = $request->validate([
            // Cliente (existente o nuevo)
            'existing_client_id' => 'nullable|exists:clients,id',
            'client_rut' => 'required_without:existing_client_id|nullable|string|max:12|unique:clients,rut',
            'client_name' => 'required_without:existing_client_id|nullable|string|max:150',
            'client_phone' => 'nullable|string|max:20',
            'client_email' => 'nullable|email|max:150',
            'client_address' => 'nullable|string|max:255',

            // Fallecido
            'deceased_full_name' => 'required|string|max:200',
            'deceased_rut' => 'nullable|string|max:12|unique:deceased,rut',
            'deceased_death_date' => 'required|date',
            'deceased_death_certificate' => 'nullable|string|max:50',

            // Servicio
            'branch_id' => 'required|exists:branches,id',
            'service_type_id' => 'required|exists:service_types,id',
            'beneficiary_type' => 'required|string',
            'scheduled_at' => 'required|date|after:now',
            'duration_hours' => 'required|integer|min:1',
            'base_price' => 'required|numeric|min:0',
            'origin_location' => 'nullable|string|max:200',
            'destination_location' => 'nullable|string|max:200',
            'burial_at' => 'nullable|date',

            // Inventario (opcional pero recomendado)
            'inventory_item_id' => 'nullable|exists:inventory_items,id',

            // Pago inicial (opcional)
            'initial_payment_amount' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|string',
            'payment_reference' => 'nullable|string',
        ]);

        // Forzar tipos
        $validated['duration_hours'] = (int) $validated['duration_hours'];
        $validated['base_price'] = (float) $validated['base_price'];
        $validated['branch_id'] = (int) $validated['branch_id'];
        $validated['service_type_id'] = (int) $validated['service_type_id'];

        // Si el servicio dura más de 48h, exigir resolución de Seremi
        if ((int) $validated['duration_hours'] > 48) {
            $seremi = $request->validate([
                'seremi_resolution_number' => 'required|string|max:50',
                'seremi_resolution_date' => 'required|date',
            ]);

            $validated = array_merge($validated, $seremi);
            $validated['seremi_extension_granted'] = true;
        }

        try {
            DB::beginTransaction();

            // ─────────────────────────────────────────────────────────────
            // CLIENTE: nuevo o existente
            // ─────────────────────────────────────────────────────────────
            if (! empty($validated['existing_client_id'])) {
                // Cliente existente seleccionado
                $client = \App\Models\Client::findOrFail($validated['existing_client_id']);
            } else {
                // Cliente nuevo
                $client = \App\Models\Client::create([
                    'rut' => $validated['client_rut'],
                    'name' => $validated['client_name'],
                    'phone' => $validated['client_phone'] ?? null,
                    'email' => $validated['client_email'] ?? null,
                    'address' => $validated['client_address'] ?? null,
                    'is_active' => true,
                ]);
            }

            // 2. Crear Fallecido
            $deceased = \App\Models\Deceased::create([
                'full_name' => $validated['deceased_full_name'],
                'rut' => $validated['deceased_rut'] ?? null,
                'death_date' => $validated['deceased_death_date'],
                'death_certificate_number' => $validated['deceased_death_certificate'] ?? null,
                'current_location' => 'Funeraria Cristo Rey',
            ]);

            // 3. Crear Servicio (Estado inicial: accepted)
            $beneficiaryType = \App\Enums\BeneficiaryType::from($validated['beneficiary_type']);

            $service = \App\Models\Service::create([
                'client_id' => $client->id,
                'deceased_id' => $deceased->id,
                'service_type_id' => $validated['service_type_id'],
                'branch_id' => $validated['branch_id'],
                'beneficiary_type' => $validated['beneficiary_type'],
                'scheduled_at' => $validated['scheduled_at'],
                'duration_hours' => $validated['duration_hours'],
                'ends_at' => \Carbon\Carbon::parse($validated['scheduled_at'])->addHours($validated['duration_hours']),
                'base_price' => $validated['base_price'],
                'total_price' => $validated['base_price'],
                'afp_amount' => $beneficiaryType->defaultAmount(),
                'family_amount' => $validated['base_price'] - $beneficiaryType->defaultAmount(),
                'status' => 'accepted', // Lo dejamos "aceptado" directamente para que puedan asignar y pagar
                'created_by' => auth()->id(),
                'approved_by' => auth()->id(),
                'approved_at' => now(),
                'seremi_extension_granted' => $validated['seremi_extension_granted'] ?? false,
                'seremi_resolution_number' => $validated['seremi_resolution_number'] ?? null,
                'seremi_resolution_date' => $validated['seremi_resolution_date'] ?? null,
                'origin_location' => $validated['origin_location'] ?? null,
                'destination_location' => $validated['destination_location'] ?? null,
                'burial_at' => $validated['burial_at'] ?? null,
            ]);

            // 4. Asignar Item de Inventario (si se seleccionó)
            if (!empty($validated['inventory_item_id'])) {
                // Usamos el servicio existente para descontar stock
                $assigner->assignInventoryItem(
                    $service,
                    (int) $validated['inventory_item_id'],
                    1,
                    'Asignado automáticamente en la creación del expediente'
                );
            }

            // 5. Registrar Pago Inicial (si lo hay)
            if (!empty($validated['initial_payment_amount']) && $validated['initial_payment_amount'] > 0) {
                $payment = \App\Models\Payment::create([
                    'service_id' => $service->id,
                    'amount' => $validated['initial_payment_amount'],
                    'payment_method' => $validated['payment_method'] ?? 'efectivo',
                    'reference' => $validated['payment_reference'] ?? null,
                    'payment_date' => now(),
                    'registered_by' => auth()->id(),
                ]);

                // Generar el PDF automáticamente
                app(\App\Http\Controllers\PaymentController::class)->generateReceiptPdf($payment);
            }

            DB::commit();

            return redirect()->route('services.show', $service->id)
                ->with('toast', [
                    'type' => 'success',
                    'message' => 'Expediente completo creado. Cliente, fallecido, servicio y pago registrados.',
                ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Error al crear el expediente: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Genera el PDF del Contrato de Servicio.
     */
    public function downloadContract(Service $service)
    {
        $service->load(['client', 'deceased', 'serviceType', 'branch']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.contract', [
            'service' => $service,
        ])
            ->setPaper('a4', 'portrait');

        return $pdf->download("contrato-{$service->code}.pdf");
    }

    /**
     * Genera el PDF del Certificado de Paz y Salvo (solo si está pagado).
     */
    public function downloadPazYSalvo(Service $service)
    {
        // Verificar que esté totalmente pagado
        if (! $service->is_fully_paid) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'El servicio aún tiene saldo pendiente. No se puede emitir el certificado.',
            ]);
        }

        $service->load(['client', 'deceased', 'serviceType', 'branch', 'payments']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.reports.paz-y-salvo', [
            'service' => $service,
        ])
            ->setPaper('a4', 'portrait');

        return $pdf->download("paz-y-salvo-{$service->code}.pdf");
    }
}