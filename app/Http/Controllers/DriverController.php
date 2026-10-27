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
    public function index(Request $request)
    {
        $user = $request->user();
        $today = Carbon::today();
        $nextWeek = Carbon::today()->addDays(7);

        // Servicios de hoy donde el chofer está asignado
        $todayServices = Service::with(['client:id,name,phone', 'deceased:id,full_name', 'serviceType:id,name', 'branch:id,name,address'])
            ->whereHas('assignments', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->whereDate('scheduled_at', $today)
            ->orderBy('scheduled_at')
            ->get();

        // Próximos servicios (próximos 7 días)
        $upcomingServices = Service::with(['client:id,name', 'deceased:id,full_name', 'serviceType:id,name'])
            ->whereHas('assignments', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->whereDate('scheduled_at', '>', $today)
            ->whereDate('scheduled_at', '<=', $nextWeek)
            ->orderBy('scheduled_at')
            ->get();

        // Items con stock bajo (para que el chofer informe)
        $lowStockItems = InventoryItem::active()
            ->whereColumn('stock', '<=', 'stock_minimum')
            ->orderBy('stock')
            ->limit(5)
            ->get(['id', 'code', 'name', 'stock', 'stock_minimum']);

        return Inertia::render('Driver/Dashboard', [
            'todayServices' => $todayServices,
            'upcomingServices' => $upcomingServices,
            'lowStockItems' => $lowStockItems,
        ]);
    }
}