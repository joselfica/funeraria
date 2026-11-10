<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Deceased;
use App\Models\EmployeeAbsence;
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

        // 4. Próximos Servicios (desde mañana hasta 7 días; los de hoy van en $todayServices)
        $upcomingServices = Service::with(['client:id,name', 'deceased:id,full_name', 'vehicles', 'serviceType:id,name'])
            ->whereIn('status', ['accepted', 'in_progress'])
            ->where('scheduled_at', '>=', Carbon::tomorrow())
            ->where('scheduled_at', '<=', now()->addDays(7))
            ->orderBy('scheduled_at', 'asc')
            ->limit(10)
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'code' => $s->code,
                'scheduled_at' => $s->scheduled_at->toIso8601String(),
                'scheduled_date' => $s->scheduled_at->translatedFormat('D d M'),
                'scheduled_time' => $s->scheduled_at->format('H:i'),
                'status' => $s->status,
                'status_label' => $s->status_label,
                'deceased' => $s->deceased?->full_name,
                'client' => $s->client?->name,
                'service_type' => $s->serviceType?->name,
                'origin_location' => $s->origin_location,
                'destination_location' => $s->destination_location,
                'vehicles' => $s->vehicles->pluck('plate')->join(', '),
            ]);

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
            'low_stock_items' => InventoryItem::active()
                ->whereColumn('stock', '<=', 'stock_minimum')
                ->count(),
            // Urnas obligatorias por Seremi con stock bajo
            'seremi_critical' => InventoryItem::seremiCritical()->count(),
            // Ausencias de personal pendientes de aprobación
            'pending_absences' => EmployeeAbsence::where('status', 'pending')->count(),
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

        // Servicios de HOY (que ocurren hoy o están en progreso)
        $todayServices = Service::with(['client:id,name', 'deceased:id,full_name', 'serviceType:id,name', 'branch:id,name'])
            ->whereDate('scheduled_at', Carbon::today())
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'code' => $s->code,
                'scheduled_at' => $s->scheduled_at->toIso8601String(),
                'time' => $s->scheduled_at->format('H:i'),
                'status' => $s->status,
                'status_label' => $s->status_label,
                'client' => $s->client?->name,
                'deceased' => $s->deceased?->full_name,
                'service_type' => $s->serviceType?->name,
                'branch' => $s->branch?->name,
            ]);

        // ─────────────────────────────────────────────────────────────
        // MONTO POR COBRAR
        // ─────────────────────────────────────────────────────────────
        // Se excluyen los pagos municipales con fecha esperada: ya se muestran en su propia tarjeta
        $unpaidServices = Service::with(['client:id,name', 'deceased:id,full_name'])
            ->where(function ($q) {
                $q->whereNull('beneficiary_type')
                    ->orWhere('beneficiary_type', '!=', 'municipal')
                    ->orWhereNull('expected_payment_date');
            })
            ->whereIn('status', ['accepted', 'in_progress', 'completed'])
            ->withSum('payments', 'amount')
            ->get()
            ->filter(function ($s) {
                $paid = (float) ($s->payments_sum_amount ?? 0);
                $total = (float) $s->total_price;
                return $paid < $total - 0.01;
            })
            ->map(function ($s) {
                $paid = (float) ($s->payments_sum_amount ?? 0);
                $total = (float) $s->total_price;
                $balance = $total - $paid;

                return [
                    'id' => $s->id,
                    'code' => $s->code,
                    'client' => $s->client?->name,
                    'deceased' => $s->deceased?->full_name,
                    'total_price' => $total,
                    'total_paid' => $paid,
                    'balance' => $balance,
                    'days_old' => (int) $s->created_at->diffInDays(now()),
                ];
            })
            ->sortByDesc('balance')
            ->values();

        $totalPending = $unpaidServices->sum('balance');
        $unpaidCount = $unpaidServices->count();
        $oldUnpaidCount = $unpaidServices->filter(fn ($s) => $s['days_old'] > 30)->count();
        $topDebtors = $unpaidServices->take(3)->values();

        // ─────────────────────────────────────────────────────────────
        // PAGOS MUNICIPALES ESPERADOS
        // ─────────────────────────────────────────────────────────────
        $municipalPayments = Service::with(['client:id,name', 'deceased:id,full_name'])
            ->where('beneficiary_type', 'municipal')
            ->whereNotNull('expected_payment_date')
            ->whereIn('status', ['accepted', 'in_progress', 'completed'])
            ->withSum('payments', 'amount')
            ->get()
            ->filter(function ($s) {
                $paid = (float) ($s->payments_sum_amount ?? 0);
                $total = (float) $s->total_price;
                return $paid < $total - 0.01;
            })
            ->map(function ($s) {
                $paid = (float) ($s->payments_sum_amount ?? 0);
                $total = (float) $s->total_price;
                $balance = $total - $paid;
                $daysUntilDue = (int) now()->diffInDays($s->expected_payment_date, false);

                return [
                    'id' => $s->id,
                    'code' => $s->code,
                    'client' => $s->client?->name,
                    'deceased' => $s->deceased?->full_name,
                    'balance' => $balance,
                    'expected_payment_date' => $s->expected_payment_date->toIso8601String(),
                    'expected_date_formatted' => $s->expected_payment_date->translatedFormat('d M Y'),
                    'days_until_due' => $daysUntilDue,
                    'is_urgent' => $daysUntilDue <= 7 && $daysUntilDue >= 0,
                    'is_overdue' => $daysUntilDue < 0,
                ];
            })
            ->sortBy('expected_payment_date')
            ->values();

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
            'services' => $services,
            'today_services' => $todayServices,
            'receivables' => [
                'total_pending' => (float) $totalPending,
                'unpaid_count' => $unpaidCount,
                'old_unpaid_count' => $oldUnpaidCount,
                'top_debtors' => $topDebtors,
            ],
            'municipal_payments' => $municipalPayments, // ← NUEVO
        ]);
    }
}