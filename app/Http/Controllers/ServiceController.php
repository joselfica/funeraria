<?php

namespace App\Http\Controllers;

use App\Enums\BeneficiaryType;
use App\Enums\ServiceTypeEnum;
use App\Models\Branch;
use App\Models\Client;
use App\Models\Deceased;
use App\Models\InventoryItem;
use App\Models\Service;
use App\Models\Vehicle;
use App\Services\AvailabilityService;
use App\Services\ServiceAssignmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $status = $request->input('status', '');

        // Filtro de pagos: all | pending (con deuda) | paid (totalmente pagados)
        $paymentFilter = in_array($request->input('payment_filter'), ['pending', 'paid'], true)
            ? $request->input('payment_filter')
            : 'all';

        // Subconsulta con el total pagado de cada servicio (ignora pagos eliminados)
        $paidSql = '(SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payments.service_id = services.id AND payments.deleted_at IS NULL)';

        // Condiciones de pago reutilizables (deuda pendiente / totalmente pagado)
        $debtSql = "services.total_price > {$paidSql} + 0.01";
        $paidCondSql = "services.total_price <= {$paidSql} + 0.01";

        // Consulta base (búsqueda y estado): se reutiliza para contadores, total y listado
        $base = Service::query()
            ->when($search, fn ($q) => $q->search($search))
            ->when($status, fn ($q) => $q->where('status', $status));

        // Contadores de los chips (respetan la búsqueda, no el filtro de pagos)
        $counts = [
            'all' => (clone $base)->count(),
            'pending' => (clone $base)->whereRaw($debtSql)->count(),
            'paid' => (clone $base)->whereRaw($paidCondSql)->count(),
        ];

        // Total por cobrar del filtro activo (suma de saldos positivos)
        $totalDue = (float) (clone $base)
            ->when($paymentFilter === 'paid', fn ($q) => $q->whereRaw($paidCondSql))
            ->when($paymentFilter === 'pending', fn ($q) => $q->whereRaw($debtSql))
            ->selectRaw("COALESCE(SUM(GREATEST(services.total_price - {$paidSql}, 0)), 0) AS due")
            ->value('due');

        $services = (clone $base)
            ->with([
                'client:id,name,rut',
                'deceased:id,full_name',
                // Solo el chofer asignado (para mostrarlo en el listado)
                'assignments' => fn ($q) => $q->where('role_in_service', 'driver')->with('user:id,name'),
            ])
            ->withSum('payments', 'amount')
            ->when($paymentFilter === 'paid', fn ($q) => $q->whereRaw($paidCondSql))
            ->when($paymentFilter === 'pending', fn ($q) => $q->whereRaw($debtSql))
            // Orden: 1) primero los servicios con saldo pendiente (total > pagado),
            //        2) luego por fecha de programación (más recientes primero)
            ->orderByRaw("(services.total_price - COALESCE({$paidSql}, 0)) > 0 DESC")
            ->orderByDesc('scheduled_at')
            ->paginate(15)
            ->withQueryString()
            ->through(function ($service) {
                $totalPaid = (float) ($service->payments_sum_amount ?? 0);
                $totalPrice = (float) $service->total_price;
                $balance = $totalPrice - $totalPaid;

                $service->total_paid = $totalPaid;
                $service->balance = $balance;
                $service->is_fully_paid = $balance <= 0.01;
                $service->payment_percentage = $totalPrice > 0 ? min(100, round(($totalPaid / $totalPrice) * 100, 1)) : 0;

                // status_label, beneficiary_label y service_type_label vienen por $appends
                $service->append(['status_label', 'beneficiary_label', 'service_type_label']);

                // Chofer asignado (primero, si hay varios) y sin enviar la relación completa
                $service->driver_name = $service->assignments->first()?->user?->name;
                $service->unsetRelation('assignments');

                return $service;
            });

        return Inertia::render('Services/Index', [
            'services' => $services,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'payment_filter' => $paymentFilter,
            ],
            'counts' => $counts,
            'total_due' => $totalDue,
        ]);
    }

    /**
     * Muestra el formulario de creación de un nuevo servicio funerario.
     */
    public function create()
    {
        return Inertia::render('Services/Create', [
            'clients' => Client::active()->orderBy('name')->get(['id', 'name', 'rut']),
            'deceased' => Deceased::orderBy('full_name')->get(['id', 'full_name', 'rut']),

            // 👇 Tipos de servicio desde el Enum
            'serviceTypes' => collect(ServiceTypeEnum::cases())->map(fn ($type) => [
                'value' => $type->value,
                'label' => $type->label(),
                'base_price' => $type->basePrice(),
                'duration_hours' => $type->durationHours(),
            ]),

            'branches' => Branch::active()->orderBy('name')->get(['id', 'name', 'code']),
            'beneficiaryTypes' => collect(BeneficiaryType::cases())->map(fn ($type) => [
                'value' => $type->value,
                'label' => $type->label(),
            ]),
        ]);
    }

    /**
     * Guarda un nuevo servicio funerario en la base de datos.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'deceased_id' => 'required|exists:deceased,id',
            'service_type' => ['required', Rule::enum(ServiceTypeEnum::class)],
            'branch_id' => 'required|exists:branches,id',
            // ─────────────────────────────────────────────────────────────
            // VALIDACIÓN DE BENEFICIARIO CON ENUM
            // ─────────────────────────────────────────────────────────────
            //
            // Se usa Rule::enum(BeneficiaryType::class) en lugar de una
            // regla `in:afp,ips,...` manual. De esta forma, si en el futuro
            // se agrega, renombra o elimina un caso en el Enum
            // App\Enums\BeneficiaryType, la validación se mantiene
            // automáticamente sincronizada sin tocar este controlador.
            //
            // Además, el Enum centraliza la lógica de negocio asociada
            // (labels, helpers como isMunicipal(), etc.), evitando
            // valores "mágicos" dispersos por el código.
            // ─────────────────────────────────────────────────────────────
            'beneficiary_type' => ['required', Rule::enum(BeneficiaryType::class)],
            'scheduled_at' => 'required|date|after:now',
            'duration_hours' => 'required|integer|min:1',
            'base_price' => 'required|numeric|min:0',
            'additional_charges' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'municipal_amount' => 'nullable|numeric|min:0',
            'client_notes' => 'nullable|string|max:1000',
            'internal_notes' => 'nullable|string|max:1000',
        ]);

        $validated['duration_hours'] = (int) $validated['duration_hours'];
        $validated['base_price'] = (float) $validated['base_price'];
        $validated['additional_charges'] = (float) ($validated['additional_charges'] ?? 0);
        $validated['discount'] = (float) ($validated['discount'] ?? 0);
        $validated['municipal_amount'] = (float) ($validated['municipal_amount'] ?? 0);

        // ─────────────────────────────────────────────────────────────
        // FECHA ESPERADA DE PAGO PARA BENEFICIARIOS MUNICIPALES
        // ─────────────────────────────────────────────────────────────
        //
        // $validated['beneficiary_type'] contiene el value del Enum
        // ('municipalidad'), así que se compara contra
        // BeneficiaryType::MUNICIPALIDAD->value.
        // ─────────────────────────────────────────────────────────────
        $isMunicipal = $validated['beneficiary_type'] === BeneficiaryType::MUNICIPALIDAD->value;

        $validated['total_price'] = $validated['base_price'] + $validated['additional_charges'] - $validated['discount'];

        if ($isMunicipal) {
            $validated['expected_payment_date'] = \Carbon\Carbon::parse($validated['scheduled_at'])->addMonths(3);
        } else {
            $validated['expected_payment_date'] = null;
        }

        $validated['ends_at'] = \Carbon\Carbon::parse($validated['scheduled_at'])->addHours($validated['duration_hours']);
        $validated['created_by'] = auth()->id();
        $validated['status'] = 'pending';

        Service::create($validated);

        return redirect()->route('services.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Servicio creado correctamente. Pendiente de aprobación.',
            ]);
    }

    public function show(Service $service, AvailabilityService $availability)
    {
        $service->load([
            'client', 'deceased', 'branch',
            'createdBy:id,name', 'approvedBy:id,name',
            'inventoryItems', 'vehicles',
            'payments',
            'assignments.user:id,name,email',
        ]);

        $service->append(['beneficiary_label', 'service_type_label']);

        // Unidades asignables; se mapea a arrays para no disparar los $appends del modelo
        $availableItems = InventoryItem::assignable()
            ->orderBy('category')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'category', 'price'])
            ->map(fn ($i) => [
                'id' => $i->id,
                'code' => $i->code,
                'name' => $i->name,
                'category' => $i->category,
                'price' => $i->price,
            ]);
        $availableVehicles = Vehicle::available()->orderBy('type')->orderBy('plate')->get(['id', 'plate', 'type', 'brand', 'model', 'status']);

        $serviceDate = \Carbon\Carbon::parse($service->scheduled_at);
        // Personal ya asignado a este servicio (no se ofrece de nuevo)
        $assignedUserIds = $service->assignments->pluck('user_id');

        $availableEmployees = $availability->getAvailableUsers($serviceDate)
            ->load('roles')
            ->filter(fn ($u) => $u->hasAnyRole(['Administrador', 'Encargado', 'Chofer']))
            // Solo quienes no tienen otro servicio en el mismo horario
            ->reject(fn ($u) => $assignedUserIds->contains($u->id)
                || $availability->hasScheduleConflict($u, $service));

        $totalPaid = (float) $service->payments()->sum('amount');
        $balance = (float) $service->total_price - $totalPaid;

        return Inertia::render('Services/Show', [
            'service' => $service,
            'availableItems' => $availableItems,
            'availableVehicles' => $availableVehicles,
            'availableEmployees' => $availableEmployees->values(),
            'financials' => [
                'total_paid' => $totalPaid,
                'balance' => $balance,
                'is_fully_paid' => $balance <= 0.01,
            ],
        ]);
    }

    public function edit(Service $service)
    {
        return Inertia::render('Services/Edit', [
            'service' => $service,
            'clients' => Client::active()->orderBy('name')->get(['id', 'name', 'rut']),
            'deceased' => Deceased::orderBy('full_name')->get(['id', 'full_name', 'rut']),

            // 👇 Tipos de servicio desde el Enum
            'serviceTypes' => collect(ServiceTypeEnum::cases())->map(fn ($type) => [
                'value' => $type->value,
                'label' => $type->label(),
                'base_price' => $type->basePrice(),
                'duration_hours' => $type->durationHours(),
            ]),

            'branches' => Branch::active()->orderBy('name')->get(['id', 'name', 'code']),
            'beneficiaryTypes' => collect(BeneficiaryType::cases())->map(fn ($type) => [
                'value' => $type->value,
                'label' => $type->label(),
            ]),
        ]);
    }

    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'deceased_id' => 'required|exists:deceased,id',
            'service_type' => ['required', Rule::enum(ServiceTypeEnum::class)],
            'branch_id' => 'required|exists:branches,id',
            // ─────────────────────────────────────────────────────────────
            // VALIDACIÓN DE BENEFICIARIO CON ENUM
            // ─────────────────────────────────────────────────────────────
            //
            // Igual que en store(): se valida con Rule::enum para que la
            // lista de valores aceptados se derive directamente del Enum
            // App\Enums\BeneficiaryType. Así se evita el error clásico de
            // que el formulario ofrezca un caso nuevo (agregado al Enum)
            // y el backend lo rechace por una regla `in:` desactualizada.
            // ─────────────────────────────────────────────────────────────
            'beneficiary_type' => ['required', Rule::enum(BeneficiaryType::class)],
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

        $validated['duration_hours'] = (int) $validated['duration_hours'];
        $validated['base_price'] = (float) $validated['base_price'];
        $validated['additional_charges'] = (float) ($validated['additional_charges'] ?? 0);
        $validated['discount'] = (float) ($validated['discount'] ?? 0);
        $validated['municipal_amount'] = (float) ($validated['municipal_amount'] ?? 0);

        // ─────────────────────────────────────────────────────────────
        // FECHA ESPERADA DE PAGO PARA BENEFICIARIOS MUNICIPALES
        // ─────────────────────────────────────────────────────────────
        //
        // $validated['beneficiary_type'] contiene el value del Enum
        // ('municipalidad'), así que se compara contra
        // BeneficiaryType::MUNICIPALIDAD->value.
        // ─────────────────────────────────────────────────────────────
        $isMunicipal = $validated['beneficiary_type'] === BeneficiaryType::MUNICIPALIDAD->value;

        $validated['total_price'] = $validated['base_price'] + $validated['additional_charges'] - $validated['discount'];

        if ($isMunicipal) {
            $validated['expected_payment_date'] = \Carbon\Carbon::parse($validated['scheduled_at'])->addMonths(3);
        } else {
            $validated['expected_payment_date'] = null;
        }

        $validated['ends_at'] = \Carbon\Carbon::parse($validated['scheduled_at'])->addHours($validated['duration_hours']);

        $service->update($validated);

        // Sincronizar ubicación con el fallecido asociado (solo si el campo vino en el request)
        if ($service->deceased) {
            $deceasedUpdate = [];

            if ($request->has('origin_location')) {
                $deceasedUpdate['death_location'] = $validated['origin_location'] ?? null;
            }
            if ($request->has('destination_location')) {
                $deceasedUpdate['cemetery'] = $validated['destination_location'] ?? null;
            }

            if (!empty($deceasedUpdate)) {
                $service->deceased->update($deceasedUpdate);
            }
        }

        return redirect()->route('services.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Servicio actualizado correctamente.',
            ]);
    }

    public function destroy(Service $service)
    {
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

    public function assignInventoryItem(Request $request, Service $service, ServiceAssignmentService $assigner)
    {
        $validated = $request->validate([
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'notes' => 'nullable|string|max:500',
        ]);

        // Cada fila de inventario es una unidad física: la cantidad siempre es 1
        $assigner->assignInventoryItem(
            $service,
            (int) $validated['inventory_item_id'],
            1,
            $validated['notes'] ?? null
        );

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Unidad asignada al servicio.',
        ]);
    }

    public function removeInventoryItem(Service $service, InventoryItem $item, ServiceAssignmentService $assigner)
    {
        $assigner->removeInventoryItem($service, $item->id);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Unidad removida y disponible nuevamente.',
        ]);
    }

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

    public function removeVehicle(Service $service, Vehicle $vehicle, ServiceAssignmentService $assigner)
    {
        $assigner->removeVehicle($service, $vehicle->id);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Vehículo removido del servicio.',
        ]);
    }

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

        try {
            $availability->validateAssignment($user, $service);
        } catch (\Exception $e) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => $e->getMessage(),
            ]);
        }

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

    public function removeEmployee(Service $service, \App\Models\ServiceAssignment $assignment)
    {
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
     * Corregido: El campo branch_id ahora se guarda correctamente en la tabla services.
     * La validación de Seremi se liberó (ya no es required_if) para permitir
     * crear servicios con duración > 48h sin bloquear el flujo.
     */
    public function quickStore(
        Request $request,
        \App\Services\ServiceAssignmentService $assigner,
        AvailabilityService $availability
    ) {
        // ─────────────────────────────────────────────────────────────
        // 1. VALIDACIÓN (todos los campos, Seremi siempre opcional)
        // ─────────────────────────────────────────────────────────────
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
            'deceased_rut' => 'required|string|max:12|unique:deceased,rut',
            'deceased_death_date' => 'required|date',
            'deceased_death_time' => 'nullable|date_format:H:i',
            'deceased_death_location' => 'nullable|string|max:200',
            'deceased_cause_of_death' => 'nullable|string|max:255',
            'deceased_death_certificate' => 'nullable|string|max:50',

            // Servicio
            'branch_id' => 'required|exists:branches,id',
            'service_type' => ['required', Rule::enum(ServiceTypeEnum::class)], // 👈 Enum
            'beneficiary_type' => ['required', Rule::enum(BeneficiaryType::class)],
            'scheduled_at' => 'required|date', // 👈 Sin 'after:now' para permitir fechas pasadas
            'duration_hours' => 'required|integer|min:1',
            'total_amount' => 'required|numeric|min:0', // 👈 Monto total ingresado manualmente
            'origin_location' => 'nullable|string|max:200',
            'destination_location' => 'nullable|string|max:200',
            'burial_at' => 'nullable|date',

            // Inventario y pago inicial (opcionales)
            'inventory_item_id' => 'nullable|exists:inventory_items,id',
            'amount_paid' => 'required|numeric|min:0|lte:total_amount', // 👈 Abono entregado
            'payment_method' => 'nullable|string',
            'payment_reference' => 'nullable|string',

            // Seremi (opcional, siempre)
            'seremi_resolution_number' => 'nullable|string|max:50',
            'seremi_resolution_date' => 'nullable|date',

            // Vehículo y chofer (opcionales)
            'vehicle_id' => 'nullable|exists:vehicles,id',
            'driver_id' => 'nullable|exists:users,id',
        ]);

        // ─────────────────────────────────────────────────────────────
        // 2. CASTEO DE TIPOS + MONTOS MANUALES (total y abono)
        // ─────────────────────────────────────────────────────────────
        $validated['duration_hours'] = (int) $validated['duration_hours'];
        $validated['branch_id'] = (int) $validated['branch_id'];

        $serviceType = ServiceTypeEnum::from($validated['service_type']);

        // 👇 Solo la duración se toma del Enum. Los montos los ingresa el usuario.
        $validated['duration_hours'] = (int) $serviceType->durationHours();

        $totalAmount = (float) $validated['total_amount'];
        $amountPaid = (float) $validated['amount_paid'];

        // El abono inicial debe ser al menos el 50% del total ingresado
        $requiredDeposit = $totalAmount * 0.50;

        if ($amountPaid + 0.01 < $requiredDeposit) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'amount_paid' => 'El abono inicial debe ser de al menos el 50% del total ($' . number_format($requiredDeposit, 0, ',', '.') . ').',
            ]);
        }

        $validated['seremi_extension_granted'] = !empty($validated['seremi_resolution_number']);

        try {
            DB::beginTransaction();

            // ─────────────────────────────────────────────────────────
            // 3. CLIENTE: reutilizar existente o crear nuevo
            // ─────────────────────────────────────────────────────────
            if (!empty($validated['existing_client_id'])) {
                $client = \App\Models\Client::findOrFail($validated['existing_client_id']);
            } else {
                $client = \App\Models\Client::create([
                    'rut' => $validated['client_rut'],
                    'name' => $validated['client_name'],
                    'phone' => $validated['client_phone'] ?? null,
                    'email' => $validated['client_email'] ?? null,
                    'address' => $validated['client_address'] ?? null,
                    'is_active' => true,
                ]);
            }

            // ─────────────────────────────────────────────────────────
            // 4. FALLECIDO
            // ─────────────────────────────────────────────────────────
            $deceased = \App\Models\Deceased::create([
                'full_name' => $validated['deceased_full_name'],
                'rut' => $validated['deceased_rut'],

                // Nombres del wizard (deceased_*) → columnas reales de la tabla
                'death_date' => $validated['deceased_death_date'],
                'death_time' => $validated['deceased_death_time'] ?? null,
                'death_location' => $validated['deceased_death_location'] ?? null,
                'cause_of_death' => $validated['deceased_cause_of_death'] ?? null, // El modelo lo encripta
                'death_certificate_number' => $validated['deceased_death_certificate'] ?? null,

                // Se mantienen del código anterior (no estaban en el cambio pedido)
                'current_location' => 'Funeraria Cristo Rey',
                'cemetery' => $validated['destination_location'] ?? null, // A dónde se lleva (cementerio/crematorio)
            ]);

            // ─────────────────────────────────────────────────────────
            // 5. SERVICIO (con branch_id garantizado como entero)
            // ─────────────────────────────────────────────────────────
            $endsAt = \Carbon\Carbon::parse($validated['scheduled_at'])->addHours($validated['duration_hours']);

            $service = \App\Models\Service::create([
                'client_id' => $client->id,
                'deceased_id' => $deceased->id,
                'service_type' => $serviceType, // 👈 Enum (se castea a string en el modelo)
                'branch_id' => $validated['branch_id'], // 👈 AHORA SÍ SE GUARDA
                'beneficiary_type' => $validated['beneficiary_type'],
                'scheduled_at' => $validated['scheduled_at'],
                'duration_hours' => $validated['duration_hours'],
                'ends_at' => $endsAt,
                // 👇 Monto manual directo
                'base_price' => $totalAmount,
                'total_price' => $totalAmount,

                'status' => 'accepted',
                'created_by' => auth()->id(),
                'approved_by' => auth()->id(),
                'approved_at' => now(),
                'seremi_extension_granted' => $validated['seremi_extension_granted'],
                'seremi_resolution_number' => $validated['seremi_resolution_number'] ?? null,
                'seremi_resolution_date' => $validated['seremi_resolution_date'] ?? null,
                'origin_location' => $validated['origin_location'] ?? null,
                'destination_location' => $validated['destination_location'] ?? null,
                'burial_at' => $validated['burial_at'] ?? null,
            ]);

            // ─────────────────────────────────────────────────────────
            // 6. ASIGNAR ITEM DE INVENTARIO (si se seleccionó)
            // ─────────────────────────────────────────────────────────
            if (!empty($validated['inventory_item_id'])) {
                $assigner->assignInventoryItem(
                    $service,
                    (int) $validated['inventory_item_id'],
                    1,
                    'Asignado automáticamente en la creación del expediente'
                );
            }

            // ─────────────────────────────────────────────────────────
            // 6.1 ASIGNAR VEHÍCULO (si se seleccionó)
            // ─────────────────────────────────────────────────────────
            if (!empty($validated['vehicle_id'])) {
                $assigner->assignVehicle(
                    $service,
                    (int) $validated['vehicle_id'],
                    null,
                    null,
                    'Asignado en la creación del expediente'
                );
            }

            // ─────────────────────────────────────────────────────────
            // 6.2 ASIGNAR CHOFER (si se seleccionó)
            // ─────────────────────────────────────────────────────────
            if (!empty($validated['driver_id'])) {
                $driver = \App\Models\User::findOrFail((int) $validated['driver_id']);

                // Valida: usuario activo, sin ausencia aprobada y sin otro
                // servicio en el mismo horario. Si falla, se revierte todo el
                // expediente y el error se muestra en el campo del chofer.
                try {
                    $availability->validateAssignment($driver, $service);
                } catch (\Exception $e) {
                    DB::rollBack();
                    return back()->withErrors(['driver_id' => $e->getMessage()])->withInput();
                }

                $service->assignments()->create([
                    'user_id' => $driver->id,
                    'role_in_service' => 'driver',
                    'notes' => 'Asignado en la creación del expediente',
                    'assigned_by' => auth()->id(),
                    'assigned_at' => now(),
                ]);
            }

            // ─────────────────────────────────────────────────────────
            // 7. REGISTRAR ABONO (monto ingresado en el formulario)
            // ─────────────────────────────────────────────────────────
            if ($amountPaid > 0) {
                $payment = \App\Models\Payment::create([
                    'service_id' => $service->id,
                    'amount' => $amountPaid,
                    'payment_method' => $validated['payment_method'] ?? 'efectivo',
                    'reference' => $validated['payment_reference'] ?? null,
                    'payment_date' => now(),
                    'registered_by' => auth()->id(),
                ]);

                app(\App\Http\Controllers\PaymentController::class)->generateReceiptPdf($payment);
            }

            DB::commit();

            return redirect()->route('services.show', $service->uuid)
                ->with('toast', [
                    'type' => 'success',
                    'message' => 'Expediente creado y abono registrado.',
                ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            // Errores de asignación (p. ej. unidad ya no disponible): se muestran en su campo
            DB::rollBack();
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Error al crear el expediente: ' . $e->getMessage()])->withInput();
        }
    }

    public function downloadContract(Service $service)
    {
        $service->load(['client', 'deceased', 'branch']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.contract', [
            'service' => $service,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("contrato-{$service->code}.pdf");
    }

    public function downloadPazYSalvo(Service $service)
    {
        if (! $service->is_fully_paid) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'El servicio aún tiene saldo pendiente. No se puede emitir el certificado.',
            ]);
        }

        $service->load(['client', 'deceased', 'branch', 'payments']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.reports.paz-y-salvo', [
            'service' => $service,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("paz-y-salvo-{$service->code}.pdf");
    }
}