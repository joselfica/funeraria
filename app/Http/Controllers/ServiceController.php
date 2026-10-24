<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Deceased;
use App\Models\Service;
use App\Models\ServiceType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\InventoryItem;
use App\Models\Vehicle;
use App\Services\ServiceAssignmentService;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $status = $request->input('status', '');

        $services = Service::query()
            ->with(['client:id,name,rut', 'deceased:id,full_name', 'serviceType:id,name'])
            ->when($search, fn ($q) => $q->search($search))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->orderByDesc('scheduled_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Services/Index', [
            'services' => $services,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Services/Create', [
            'clients' => Client::active()->orderBy('name')->get(['id', 'name', 'rut']),
            'deceased' => Deceased::orderBy('full_name')->get(['id', 'full_name', 'rut']),
            'serviceTypes' => ServiceType::active()->orderBy('sort_order')->get(['id', 'name', 'base_price', 'duration_hours']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'deceased_id' => 'required|exists:deceased,id',
            'service_type_id' => 'required|exists:service_types,id',
            'scheduled_at' => 'required|date|after:now',
            'duration_hours' => 'required|integer|min:1',
            'base_price' => 'required|numeric|min:0',
            'additional_charges' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'client_notes' => 'nullable|string|max:1000',
            'internal_notes' => 'nullable|string|max:1000',
        ]);

        // Forzar tipos correctos (porque vienen como strings del frontend)
        $validated['duration_hours'] = (int) $validated['duration_hours'];
        $validated['base_price'] = (float) $validated['base_price'];
        $validated['additional_charges'] = (float) ($validated['additional_charges'] ?? 0);
        $validated['discount'] = (float) ($validated['discount'] ?? 0);

        // Calcular total
        $validated['total_price'] =
            $validated['base_price']
            + $validated['additional_charges']
            - $validated['discount'];

        // Calcular ends_at
        $validated['ends_at'] = \Carbon\Carbon::parse($validated['scheduled_at'])
            ->addHours($validated['duration_hours']);

        $validated['created_by'] = auth()->id();
        $validated['status'] = 'pending';

        Service::create($validated);

        return redirect()->route('services.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Servicio creado correctamente. Pendiente de aprobación.',
            ]);
    }

    public function show(Service $service)
{
    $service->load([
        'client', 'deceased', 'serviceType',
        'createdBy:id,name', 'approvedBy:id,name',
        'inventoryItems', 'vehicles',
        'payments',
    ]);

    $availableItems = InventoryItem::active()
        ->where('stock', '>', 0)
        ->orderBy('category')
        ->orderBy('name')
        ->get(['id', 'code', 'name', 'category', 'stock', 'price']);

    $availableVehicles = Vehicle::available()
        ->orderBy('type')
        ->orderBy('plate')
        ->get(['id', 'plate', 'type', 'brand', 'model', 'status']);

    return Inertia::render('Services/Show', [
        'service' => $service,
        'availableItems' => $availableItems,
        'availableVehicles' => $availableVehicles,
    ]);
}

    public function edit(Service $service)
    {
        return Inertia::render('Services/Edit', [
            'service' => $service,
            'clients' => Client::active()->orderBy('name')->get(['id', 'name', 'rut']),
            'deceased' => Deceased::orderBy('full_name')->get(['id', 'full_name', 'rut']),
            'serviceTypes' => ServiceType::active()->orderBy('sort_order')->get(['id', 'name', 'base_price', 'duration_hours']),
        ]);
    }

    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'deceased_id' => 'required|exists:deceased,id',
            'service_type_id' => 'required|exists:service_types,id',
            'scheduled_at' => 'required|date',
            'duration_hours' => 'required|integer|min:1',
            'base_price' => 'required|numeric|min:0',
            'additional_charges' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'client_notes' => 'nullable|string|max:1000',
            'internal_notes' => 'nullable|string|max:1000',
        ]);

        // Forzar tipos correctos
        $validated['duration_hours'] = (int) $validated['duration_hours'];
        $validated['base_price'] = (float) $validated['base_price'];
        $validated['additional_charges'] = (float) ($validated['additional_charges'] ?? 0);
        $validated['discount'] = (float) ($validated['discount'] ?? 0);

        // Calcular total
        $validated['total_price'] =
            $validated['base_price']
            + $validated['additional_charges']
            - $validated['discount'];

        // Calcular ends_at
        $validated['ends_at'] = \Carbon\Carbon::parse($validated['scheduled_at'])
            ->addHours($validated['duration_hours']);

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
}