<?php

namespace App\Services;

use App\Models\InventoryItem;
use App\Models\Service;
use App\Models\Vehicle;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ServiceAssignmentService
{
    public function assignInventoryItem(Service $service, int $itemId, int $quantity = 1, ?string $notes = null): void
    {
        DB::transaction(function () use ($service, $itemId, $quantity, $notes) {
            $item = InventoryItem::lockForUpdate()->findOrFail($itemId);

            if ($item->stock < $quantity) {
                throw ValidationException::withMessages([
                    'stock' => "Stock insuficiente. Disponible: {$item->stock}, solicitado: {$quantity}.",
                ]);
            }

            if ($service->inventoryItems()->where('inventory_item_id', $itemId)->exists()) {
                throw ValidationException::withMessages([
                    'duplicate' => 'Este item ya está asignado al servicio.',
                ]);
            }

            $service->inventoryItems()->attach($itemId, [
                'quantity' => $quantity,
                'unit_price' => $item->price,
                'notes' => $notes,
                'assigned_by' => auth()->id(),
                'assigned_at' => now(),
            ]);

            $item->decrement('stock', $quantity);

            if ($item->fresh()->needs_restock) {
                \Log::warning("Stock bajo: {$item->name} ({$item->code}) - Stock: {$item->stock}, Mínimo: {$item->stock_minimum}");
            }
        });
    }

    public function removeInventoryItem(Service $service, int $itemId): void
    {
        DB::transaction(function () use ($service, $itemId) {
            $pivot = $service->inventoryItems()->where('inventory_item_id', $itemId)->first();

            if (! $pivot) {
                throw ValidationException::withMessages([
                    'not_found' => 'Este item no está asignado al servicio.',
                ]);
            }

            $quantity = $pivot->pivot->quantity;

            $service->inventoryItems()->detach($itemId);

            InventoryItem::where('id', $itemId)->increment('stock', $quantity);
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