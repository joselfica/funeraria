<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Deceased;
use App\Models\InventoryItem;
use App\Models\Payment;
use App\Models\Service;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

/**
 * Controlador del Dashboard principal.
 * 
 * Agrupa los KPIs (Key Performance Indicators) más importantes del negocio
 * para mostrarlos en una vista única al administrador.
 */
class DashboardController extends Controller
{
    public function index()
    {
        // 1. KPIs Principales
        $totalClients = Client::active()->count();
        $totalDeceased = Deceased::count();
        
        // Servicios activos = aceptados o en progreso
        $activeServices = Service::whereIn('status', ['accepted', 'in_progress'])->count();
        
        // Ingresos del mes actual (suma de pagos)
        $monthlyRevenue = Payment::whereMonth('payment_date', Carbon::now()->month)
            ->whereYear('payment_date', Carbon::now()->year)
            ->sum('amount');

        // 2. Gráfico de Ingresos (últimos 6 meses)
        // Agrupamos pagos por mes.
        $chartData = Payment::select(
            DB::raw('EXTRACT(MONTH FROM payment_date) as month'),
            DB::raw('EXTRACT(YEAR FROM payment_date) as year'),
            DB::raw('SUM(amount) as total')
        )
        ->where('payment_date', '>=', Carbon::now()->subMonths(6))
        ->groupBy('year', 'month')
        ->orderBy('year', 'asc')
        ->orderBy('month', 'asc')
        ->get()
        ->map(function ($item) {
            // Convertir número de mes a nombre (Ene, Feb, etc.)
            $date = Carbon::createFromDate($item->year, $item->month, 1);
            return [
                'name' => $date->translatedFormat('M'),
                'total' => (float) $item->total,
            ];
        });

        // 3. Alertas de Stock Crítico
        $lowStockItems = InventoryItem::active()
            ->whereColumn('stock', '<=', 'stock_minimum')
            ->orderBy('stock', 'asc')
            ->limit(5)
            ->get(['id', 'code', 'name', 'category', 'stock', 'stock_minimum']);

        // 4. Próximos Servicios (próximos 7 días)
        $upcomingServices = Service::with(['client:id,name', 'deceased:id,full_name'])
            ->whereIn('status', ['accepted', 'in_progress'])
            ->where('scheduled_at', '>=', now())
            ->where('scheduled_at', '<=', now()->addDays(7))
            ->orderBy('scheduled_at', 'asc')
            ->limit(5)
            ->get();

        // 5. Estado de la Flota
        $fleetStatus = [
            'total' => Vehicle::count(),
            'available' => Vehicle::where('status', 'disponible')->count(),
            'in_service' => Vehicle::where('status', 'en_servicio')->count(),
            'maintenance' => Vehicle::where('status', 'mantenimiento')->count(),
        ];

        // 6. Alertas para el "Modo Renato"
        $alerts = [
            'pending_services' => Service::where('status', 'pending')->count(),
            'unpaid_services' => Service::with('payments')
                ->whereIn('status', ['accepted', 'in_progress'])
                ->get()
                ->filter(fn ($s) => $s->balance > 0)
                ->count(),
            'low_stock_items' => InventoryItem::active()
                ->whereColumn('stock', '<=', 'stock_minimum')
                ->count(),
            // Urnas obligatorias por Seremi con stock bajo
            'seremi_critical' => InventoryItem::seremiCritical()->count(),
        ];

        // Servicios del mes actual (para el calendario)
        $services = Service::with(['client:id,name', 'deceased:id,full_name', 'serviceType:id,name', 'branch:id,name'])
            ->whereBetween('scheduled_at', [
                Carbon::now()->startOfMonth()->subMonth(),
                Carbon::now()->endOfMonth()->addMonth(),
            ])
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'code' => $s->code,
                'title' => "{$s->code} — {$s->deceased?->full_name}",
                'start' => $s->scheduled_at->toIso8601String(),
                'end' => $s->ends_at?->toIso8601String(),
                'status' => $s->status,
                'status_label' => $s->status_label,
                'client' => $s->client?->name,
                'deceased' => $s->deceased?->full_name,
                'service_type' => $s->serviceType?->name,
                'branch' => $s->branch?->name,
            ]);

        return Inertia::render('dashboard', [
            'kpis' => [
                'total_clients' => $totalClients,
                'total_deceased' => $totalDeceased,
                'active_services' => $activeServices,
                'monthly_revenue' => (float) $monthlyRevenue,
            ],
            'chart_data' => $chartData,
            'low_stock' => $lowStockItems,
            'upcoming_services' => $upcomingServices,
            'fleet_status' => $fleetStatus,
            'alerts' => $alerts,
            'services' => $services, // ← NUEVO
        ]);
    }
}