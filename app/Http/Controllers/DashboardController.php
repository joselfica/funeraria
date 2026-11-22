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
 * para mostrarlos en una vista única al administrador y al encargado.
 */
class DashboardController extends Controller
{
    public function index()
    {
        // Las finanzas (ingresos, cobros, pagos) son visibles para Administrador y Encargado
        $canSeeFinance = auth()->user()->hasAnyRole(['Administrador', 'Encargado']);
        $activeStatuses = ['accepted', 'in_progress', 'completed'];

        // 1. KPIs Principales
        $totalClients = Client::active()->count();
        $totalDeceased = Deceased::count();

        // Servicios activos = aceptados o en progreso
        $activeServices = Service::whereIn('status', ['accepted', 'in_progress'])->count();

        // Ingresos del mes actual y del anterior (suma de pagos) — Admin y Encargado
        $monthlyRevenue = 0.0;
        $revenueChangePct = null;
        if ($canSeeFinance) {
            $monthlyRevenue = (float) Payment::whereMonth('payment_date', Carbon::now()->month)
                ->whereYear('payment_date', Carbon::now()->year)
                ->sum('amount');

            $prevMonth = Carbon::now()->startOfMonth()->subMonth();
            $previousRevenue = (float) Payment::whereMonth('payment_date', $prevMonth->month)
                ->whereYear('payment_date', $prevMonth->year)
                ->sum('amount');

            $revenueChangePct = $previousRevenue > 0
                ? (int) round((($monthlyRevenue - $previousRevenue) / $previousRevenue) * 100)
                : null;
        }

        $newClientsMonth = Client::active()
            ->whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->count();

        // 2. Resumen general (últimos 6 meses, incluye meses sin movimiento)
        $chartStart = Carbon::now()->startOfMonth()->subMonths(5);
        $chartEnd = Carbon::now()->endOfMonth();

        $revenueByMonth = collect();
        if ($canSeeFinance) {
            $revenueByMonth = Payment::select(
                DB::raw('EXTRACT(MONTH FROM payment_date) as month'),
                DB::raw('EXTRACT(YEAR FROM payment_date) as year'),
                DB::raw('SUM(amount) as total')
            )
                ->whereBetween('payment_date', [$chartStart, $chartEnd])
                ->groupBy('year', 'month')
                ->get()
                ->keyBy(fn ($r) => ((int) $r->year).'-'.((int) $r->month));
        }

        $servicesByMonth = Service::select(
            DB::raw('EXTRACT(MONTH FROM scheduled_at) as month'),
            DB::raw('EXTRACT(YEAR FROM scheduled_at) as year'),
            DB::raw('COUNT(*) as total')
        )
            ->whereIn('status', $activeStatuses)
            ->whereBetween('scheduled_at', [$chartStart, $chartEnd])
            ->groupBy('year', 'month')
            ->get()
            ->keyBy(fn ($r) => ((int) $r->year).'-'.((int) $r->month));

        $chartData = collect(range(0, 5))->map(function ($i) use ($chartStart, $revenueByMonth, $servicesByMonth) {
            $date = $chartStart->copy()->addMonths($i);
            $key = $date->year.'-'.$date->month;

            return [
                'name' => ucfirst(rtrim($date->translatedFormat('M'), '.')),
                'total' => (float) ($revenueByMonth[$key]->total ?? 0),
                'services' => (int) ($servicesByMonth[$key]->total ?? 0),
            ];
        })->values();

        // 3. Stock de Ataúdes y Urnas (conteo simple por categoría)
        $ataudesDisponibles = InventoryItem::where('category', 'ataud')
            ->where('condition', 'disponible')
            ->count();

        $ataudesTotales = InventoryItem::where('category', 'ataud')->count();

        $urnasDisponibles = InventoryItem::where('category', 'urna')
            ->where('condition', 'disponible')
            ->count();

        $urnasTotales = InventoryItem::where('category', 'urna')->count();

        $inventoryStats = [
            'ataudes' => [
                'disponibles' => $ataudesDisponibles,
                'totales' => $ataudesTotales,
            ],
            'urnas' => [
                'disponibles' => $urnasDisponibles,
                'totales' => $urnasTotales,
            ],
        ];

        // 4. Próximos Servicios (desde mañana hasta 7 días; los de hoy van en $todayServices)
        $upcomingServices = Service::with(['client:id,name', 'deceased:id,full_name', 'vehicles'])
            ->whereIn('status', ['accepted', 'in_progress'])
            ->where('scheduled_at', '>=', Carbon::tomorrow())
            ->where('scheduled_at', '<=', now()->addDays(7))
            ->orderBy('scheduled_at', 'asc')
            ->limit(10)
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'uuid' => $s->uuid,
                'code' => $s->code,
                'scheduled_at' => $s->scheduled_at->toIso8601String(),
                'scheduled_date' => $s->scheduled_at->translatedFormat('D d M'),
                'scheduled_time' => $s->scheduled_at->format('H:i'),
                'day' => $s->scheduled_at->format('j'),
                'month' => ucfirst(rtrim($s->scheduled_at->translatedFormat('M'), '.')),
                'status' => $s->status,
                'status_label' => $s->status_label,
                'deceased' => $s->deceased?->full_name,
                'client' => $s->client?->name,
                'service_type' => $s->service_type_label,
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
            // Stock bajo de ataúdes y urnas (disponibles <= umbral por categoría)
            'low_stock_items' => ($ataudesDisponibles <= 2 ? 1 : 0) + ($urnasDisponibles <= 2 ? 1 : 0),
            // Urnas obligatorias por Seremi con stock bajo (temporalmente en 0)
            'seremi_critical' => 0,
            // Ausencias de personal pendientes de aprobación
            'pending_absences' => EmployeeAbsence::where('status', 'pending')->count(),
        ];

        // Últimos servicios registrados
        $recentServices = Service::with(['client:id,name', 'deceased:id,full_name'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'uuid' => $s->uuid,
                'code' => $s->code,
                'client' => $s->client?->name,
                'deceased' => $s->deceased?->full_name,
                'date' => $s->scheduled_at?->format('d/m/Y'),
                'status' => $s->status,
                'status_label' => $s->status_label,
            ]);

        // Indicadores clave (porcentajes)
        $operativeServices = Service::whereIn('status', $activeStatuses)->count();
        $completedServices = Service::where('status', 'completed')->count();

        $collectedPct = null;
        if ($canSeeFinance) {
            $billingServices = Service::whereIn('status', $activeStatuses)
                ->withSum('payments', 'amount')
                ->get();
            $billed = (float) $billingServices->sum('total_price');
            $collected = (float) $billingServices->sum(
                fn ($s) => min((float) ($s->payments_sum_amount ?? 0), (float) $s->total_price)
            );
            $collectedPct = $billed > 0 ? (int) round(($collected / $billed) * 100) : null;
        }

        $activeItems = InventoryItem::active()->count();

        $indicators = [
            'completed_pct' => $operativeServices > 0 ? (int) round(($completedServices / $operativeServices) * 100) : 0,
            'collected_pct' => $collectedPct,
            // Usa el conteo de alertas de stock por categoría
            'inventory_ok_pct' => $activeItems > 0
                ? (int) round((($activeItems - $alerts['low_stock_items']) / $activeItems) * 100)
                : 100,
            'fleet_available_pct' => $fleetStatus['total'] > 0
                ? (int) round(($fleetStatus['available'] / $fleetStatus['total']) * 100)
                : 0,
        ];

        // Servicios del mes actual (para el calendario) - se muestran los sepelios
        $services = Service::with(['client:id,name', 'deceased:id,full_name', 'branch:id,name'])
            ->whereNotNull('burial_at') // 👈 Solo los que tienen fecha de entierro
            ->whereIn('status', ['accepted', 'in_progress', 'completed']) // 👈 Solo los aprobados
            ->whereBetween('burial_at', [
                Carbon::now()->startOfMonth()->subMonth(),
                Carbon::now()->endOfMonth()->addMonth(),
            ])
            ->orderBy('burial_at')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'uuid' => $s->uuid,
                'code' => $s->code,
                // Título que aparecerá en el recuadro del calendario
                'title' => "Sepelio: {$s->deceased?->full_name}",
                'start' => $s->burial_at->toIso8601String(), // 👈 Usamos burial_at
                'end' => null, // El entierro no tiene duración en horas, es un evento puntual
                'status' => $s->status,
                'status_label' => $s->status_label,
                'client' => $s->client?->name,
                'deceased' => $s->deceased?->full_name,
                'service_type' => $s->service_type_label,
                'branch' => $s->branch?->name,
            ]);

        // Servicios de HOY (que ocurren hoy o están en progreso)
        $todayServices = Service::with(['client:id,name', 'deceased:id,full_name', 'branch:id,name'])
            ->whereDate('scheduled_at', Carbon::today())
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'uuid' => $s->uuid,
                'code' => $s->code,
                'scheduled_at' => $s->scheduled_at->toIso8601String(),
                'time' => $s->scheduled_at->format('H:i'),
                'day' => $s->scheduled_at->format('j'),
                'month' => ucfirst(rtrim($s->scheduled_at->translatedFormat('M'), '.')),
                'status' => $s->status,
                'status_label' => $s->status_label,
                'client' => $s->client?->name,
                'deceased' => $s->deceased?->full_name,
                'service_type' => $s->service_type_label,
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
                    'uuid' => $s->uuid,
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
                    'uuid' => $s->uuid,
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
                'revenue_change_pct' => $revenueChangePct,
                'new_clients_month' => $newClientsMonth,
            ],
            'can_see_finance' => $canSeeFinance,
            'today_label' => ucfirst(now()->translatedFormat('l, j \d\e F \d\e Y')),
            'recent_services' => $recentServices,
            'indicators' => $indicators,
            'chart_data' => $chartData,
            'inventory_stats' => $inventoryStats,
            'upcoming_services' => $upcomingServices,
            'fleet_status' => $fleetStatus,
            'alerts' => $alerts,
            'services' => $services,
            'today_services' => $todayServices,
            // Datos financieros: Admin y Encargado
            'receivables' => $canSeeFinance ? [
                'total_pending' => (float) $totalPending,
                'unpaid_count' => $unpaidCount,
                'old_unpaid_count' => $oldUnpaidCount,
                'top_debtors' => $topDebtors,
            ] : null,
            'municipal_payments' => $canSeeFinance ? $municipalPayments : [],
        ]);
    }
}