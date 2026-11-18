<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Controlador del Dashboard de Choferes.
 * 
 * Solo muestra los servicios asignados al chofer logueado.
 */
class DriverController extends Controller
{
    /**
     * Dashboard principal del chofer.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $today = Carbon::today();
        $nextWeek = Carbon::today()->addDays(7);

        // Servicios activos HOY donde el chofer está asignado.
        $todayServices = Service::with([
                'client:id,name,phone', 
                'deceased:id,full_name', 
                'branch:id,name' 
            ])
            ->whereHas('assignments', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->where(function ($q) use ($today) {
                $endOfDay = $today->copy()->endOfDay();
                $startOfDay = $today->copy()->startOfDay();

                $q->whereBetween('scheduled_at', [$startOfDay, $endOfDay]) // Inician hoy
                  ->orWhereBetween('ends_at', [$startOfDay, $endOfDay])     // Terminan hoy
                  ->orWhere(function ($inner) use ($startOfDay, $endOfDay) {
                      // Están en curso hoy
                      $inner->where('scheduled_at', '<', $startOfDay)
                            ->where('ends_at', '>', $endOfDay);
                  });
            })
            ->orderBy('scheduled_at')
            ->get()
            ->each(fn ($service) => $service->append(['service_type_label', 'status_label']));

        // Próximos servicios (próximos 7 días)
        $upcomingServices = Service::with([
                'client:id,name', 
                'deceased:id,full_name'
            ])
            ->whereHas('assignments', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->whereDate('scheduled_at', '>', $today)
            ->whereDate('scheduled_at', '<=', $nextWeek)
            ->orderBy('scheduled_at')
            ->get()
            ->each(fn ($service) => $service->append(['service_type_label', 'status_label']));

        // Items con stock bajo calculado dinámicamente
        $lowStockItems = InventoryItem::query()
            ->where('is_active', true)
            ->get()
            ->groupBy('name')
            ->map(function ($group) {
                $first = $group->first();
                $available = $group->whereIn('condition', ['nuevo', 'bueno'])->count();
                $threshold = $first->alert_threshold ?? 2;

                return [
                    'id' => $first->id,
                    'code' => $first->code,
                    'name' => $first->name,
                    'category' => $first->category,
                    'available_stock' => $available,
                    'alert_threshold' => $threshold,
                    'is_low_stock' => $available <= $threshold,
                ];
            })
            ->filter(fn ($item) => $item['is_low_stock'])
            ->sortBy('available_stock')
            ->take(5)
            ->values();

        return Inertia::render('Driver/Dashboard', [
            'todayServices' => $todayServices,
            'upcomingServices' => $upcomingServices,
            'lowStockItems' => $lowStockItems,
        ]);
    }

    /**
     * Muestra el detalle de un servicio asignado al chofer.
     */
    public function showService(Service $service)
    {
        $user = auth()->user();

        // Verificar que el servicio esté asignado al chofer
        $isAssigned = $service->assignments()
            ->where('user_id', $user->id)
            ->where('role_in_service', 'driver')
            ->exists();

        if (! $isAssigned) {
            abort(403, 'No tienes permiso para ver este servicio.');
        }

        // Cargar relaciones necesarias (sin serviceType, que ya no existe)
        $service->load(['client', 'deceased', 'branch']);

        // Agregar atributos calculados al JSON
        $service->append(['service_type_label', 'status_label', 'beneficiary_label']);

        return Inertia::render('Driver/ServiceShow', [
            'service' => $service,
        ]);
    }
}