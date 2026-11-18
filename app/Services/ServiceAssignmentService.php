<?php

namespace App\Services;

use App\Enums\ItemCondition;
use App\Models\InventoryItem;
use App\Models\Service;
use App\Models\Vehicle;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ServiceAssignmentService
{
    public function assignInventoryItem(Service $service, int $itemId, int $quantity = 1, ?string $notes = null): void
    {
        // Cada fila de inventario es una unidad física: $quantity se ignora (siempre 1).
        DB::transaction(function () use ($service, $itemId, $notes) {
            $item = InventoryItem::lockForUpdate()->findOrFail($itemId);

            if (! $item->is_active || ! $item->condition?->isAvailable()) {
                throw ValidationException::withMessages([
                    'inventory_item_id' => "La unidad {$item->code} no está disponible (condición: {$item->condition_label}).",
                ]);
            }

            if ($service->inventoryItems()->where('inventory_item_id', $itemId)->exists()) {
                throw ValidationException::withMessages([
                    'duplicate' => 'Este item ya está asignado al servicio.',
                ]);
            }

            $service->inventoryItems()->attach($itemId, [
                'quantity' => 1,
                'unit_price' => $item->price,
                'notes' => $notes,
                'assigned_by' => auth()->id(),
                'assigned_at' => now(),
            ]);

            // La unidad se marca como vendida al asignarse al servicio
            $item->update(['condition' => ItemCondition::NO_DISPONIBLE]);
        });
    }

    public function removeInventoryItem(Service $service, int $itemId): void
    {
        DB::transaction(function () use ($service, $itemId) {
            if (! $service->inventoryItems()->where('inventory_item_id', $itemId)->exists()) {
                throw ValidationException::withMessages([
                    'not_found' => 'Este item no está asignado al servicio.',
                ]);
            }

            $service->inventoryItems()->detach($itemId);

            // La unidad vuelve a quedar disponible
            InventoryItem::where('id', $itemId)->update(['condition' => ItemCondition::DISPONIBLE]);
        });
    }

    public function assignVehicle(
        Service $service,
        int $vehicleId,
        ?string $departsAt = null,
        ?string $returnsAt = null,
        ?string $notes = null
    ): void {
        DB::transaction(function () use ($service, $vehicleId, $departsAt, $returnsAt, $notes) {
            $vehicle = Vehicle::findOrFail($vehicleId);

            if ($vehicle->status !== 'disponible') {
                throw ValidationException::withMessages([
                    'status' => "El vehículo {$vehicle->plate} no está disponible (estado: {$vehicle->status_label}).",
                ]);
            }

            if ($service->vehicles()->where('vehicle_id', $vehicleId)->exists()) {
                throw ValidationException::withMessages([
                    'duplicate' => 'Este vehículo ya está asignado al servicio.',
                ]);
            }

            $service->vehicles()->attach($vehicleId, [
                'departs_at' => $departsAt,
                'returns_at' => $returnsAt,
                'notes' => $notes,
                'assigned_by' => auth()->id(),
                'assigned_at' => now(),
            ]);
        });
    }

    public function removeVehicle(Service $service, int $vehicleId): void
    {
        $service->vehicles()->detach($vehicleId);
    }
}