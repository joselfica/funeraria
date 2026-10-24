<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VehicleController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $type = $request->input('type', '');
        $status = $request->input('status', '');

        $vehicles = Vehicle::query()
            ->when($search, fn ($q) => $q->search($search))
            ->when($type, fn ($q) => $q->where('type', $type))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->orderBy('type')
            ->orderBy('plate')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Vehicles/Index', [
            'vehicles' => $vehicles,
            'filters' => [
                'search' => $search,
                'type' => $type,
                'status' => $status,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Vehicles/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:carroza,acompanamiento,furgon',
            'plate' => 'required|string|max:10|unique:vehicles,plate',
            'brand' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'color' => 'nullable|string|max:50',
            'capacity' => 'required|integer|min:1',
            'status' => 'required|in:disponible,en_servicio,mantenimiento,fuera_servicio',
            'last_maintenance_at' => 'nullable|date',
            'next_maintenance_at' => 'nullable|date',
            'hourly_rate' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        Vehicle::create($validated);

        return redirect()->route('vehicles.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Vehículo creado correctamente.',
            ]);
    }

    public function show(Vehicle $vehicle)
    {
        return Inertia::render('Vehicles/Show', [
            'vehicle' => $vehicle,
        ]);
    }

    public function edit(Vehicle $vehicle)
    {
        return Inertia::render('Vehicles/Edit', [
            'vehicle' => $vehicle,
        ]);
    }

    public function update(Request $request, Vehicle $vehicle)
    {
        $validated = $request->validate([
            'type' => 'required|in:carroza,acompanamiento,furgon',
            'plate' => 'required|string|max:10|unique:vehicles,plate,' . $vehicle->id,
            'brand' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'color' => 'nullable|string|max:50',
            'capacity' => 'required|integer|min:1',
            'status' => 'required|in:disponible,en_servicio,mantenimiento,fuera_servicio',
            'last_maintenance_at' => 'nullable|date',
            'next_maintenance_at' => 'nullable|date',
            'hourly_rate' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $vehicle->update($validated);

        return redirect()->route('vehicles.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Vehículo actualizado correctamente.',
            ]);
    }

    public function destroy(Vehicle $vehicle)
    {
        $vehicle->delete();

        return redirect()->route('vehicles.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Vehículo eliminado correctamente.',
            ]);
    }
}