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
 * Controlador del Panel Principal (Dashboard).
 *
 * Agrupa los Indicadores Clave de Rendimiento (KPI) más importantes del negocio
 * para mostrarlos en una vista única al administrador y al encargado.
 */
class DashboardController extends Controller
{
    /**
     * Momento del hito de un servicio: cremación (urna) = scheduled_at;
     * sepelio (ataúd) = burial_at. Un ataúd sin burial_at da NULL y no
     * aparece en hoy/próximos hasta que se le asigne fecha.
     */
    private const EVENT_AT = "CASE WHEN services.service_type = 'urna' THEN services.scheduled_at ELSE services.burial_at END";

    private static function eventAt(Service $s): \Carbon\CarbonInterface
    {
        return $s->service_type?->value === 'urna' ? $s->scheduled_at : $s->burial_at;
    }

    public function index()
    {
        // Las finanzas (ingresos, cobros, pagos) son visibles para Administrador y Encargado
        $canSeeFinance = auth()->user()->hasAnyRole(['Administrador', 'Encargado']);
        $activeStatuses = ['accepted', 'in_progress', 'completed'];

        // 1. Indicadores Clave de Rendimiento Principales
        $totalClients = Client::active()->count();
        $totalDeceased = Deceased::count();

        // Servicios activos = aceptados o en progreso
        $activeServices = Service::whereIn('status', ['accepted', 'in_progress'])->count();

        // ─────────────────────────────────────────────────────────────
        // INGRESOS DEL MES: CAJA vs FACTURACIÓN
        // ─────────────────────────────────────────────────────────────
        //
        // Se distinguen dos métricas complementarias:
        //
        //   - cashRevenue   (Caja / Flujo de efectivo):
        //     Suma de los pagos efectivamente recibidos este mes, según
        //     la fecha del pago (payment_date). Responde a: "¿cuánta
        //     plata entró a la caja este mes?".
        //
        //   - billedRevenue (Facturación / Ventas del mes):
        //     Suma del precio total de los servicios agendados este mes,
        //     según la fecha del servicio (scheduled_at). Responde a:
        //     "¿cuánto vendimos este mes?".
        //
        // Ambas métricas suelen diferir porque los pagos pueden llegar
        // antes o después de la fecha del servicio (abonos, cuotas,
        // pagos municipales a 3 meses, etc.).
        //
        // El "revenueChangePct" se calcula sobre la caja (cashRevenue)
        // porque es la métrica que más interesa al negocio para medir
        // el pulso semanal/mensual.
        // ─────────────────────────────────────────────────────────────
        $cashRevenue = 0.0;
        $billedRevenue = 0.0;
        $revenueChangePct = null;

        if ($canSeeFinance) {
            // 1. Ingresos por Caja (pagos recibidos este mes)
            $cashRevenue = (float) Payment::whereMonth('payment_date', Carbon::now()->month)
                ->whereYear('payment_date', Carbon::now()->year)
                ->sum('amount');

            // 2. Ingresos por Facturación (servicios agendados este mes)
            $billedRevenue = (float) Service::whereIn('status', $activeStatuses)
                ->whereMonth('scheduled_at', Carbon::now()->month)
                ->whereYear('scheduled_at', Carbon::now()->year)
                ->sum('total_price');

            // Variación porcentual de la caja respecto al mes anterior
            $prevMonth = Carbon::now()->startOfMonth()->subMonth();
            $previousRevenue = (float) Payment::whereMonth('payment_date', $prevMonth->month)
                ->whereYear('payment_date', $prevMonth->year)
                ->sum('amount');

            $revenueChangePct = $previousRevenue > 0
                ? (int) round((($cashRevenue - $previousRevenue) / $previousRevenue) * 100)
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
            ->whereRaw('('.self::EVENT_AT.') >= ?', [Carbon::tomorrow()->toDateTimeString()])
            ->whereRaw('('.self::EVENT_AT.') <= ?', [now()->addDays(7)->toDateTimeString()])
            ->orderByRaw(self::EVENT_AT.' asc')
            ->limit(10)
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'uuid' => $s->uuid,
                'code' => $s->code,
                'scheduled_at' => self::eventAt($s)->toIso8601String(),
                'event_type' => $s->service_type?->value === 'urna' ? 'cremacion' : 'sepelio',
                'scheduled_date' => self::eventAt($s)->translatedFormat('D d M'),
                'scheduled_time' => self::eventAt($s)->format('H:i'),
                'day' => self::eventAt($s)->format('j'),
                'month' => ucfirst(rtrim(self::eventAt($s)->translatedFormat('M'), '.')),
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

        // ─────────────────────────────────────────────────────────────
        // INDICADOR: TASA DE APROBACIÓN (Operativo)
        // ─────────────────────────────────────────────────────────────
        //
        // Mide qué porcentaje de los servicios que ya fueron evaluados
        // (es decir, que salieron del estado "pendiente") fueron aprobados
        // en lugar de rechazados. Es un indicador de calidad de la
        // operación comercial: qué tan seguido se cierran los servicios
        // que se evalúan.
        //
        // Fórmula:
        //   approval_rate = (aceptados / (aceptados + rechazados)) * 100
        //
        // Notas:
        //   - Solo se consideran los servicios en estado 'accepted' y
        //     'rejected' (los ya evaluados). Los 'pending' no entran
        //     porque aún no tienen veredicto.
        //   - Si no hay servicios evaluados, el indicador queda en 100%
        //     (no hay rechazos, por lo tanto la tasa es perfecta).
        //   - Este valor reemplaza al antiguo "completed_pct" en el
        //     arreglo de indicadores que consume el frontend.
        // ─────────────────────────────────────────────────────────────

        // 1. Contar los estados
        $totalAceptados = Service::where('status', 'accepted')->count();
        $totalRechazados = Service::where('status', 'rejected')->count();

        // 2. Calcular el porcentaje (evitando división por cero)
        $totalEvaluados = $totalAceptados + $totalRechazados;
        $approvalRate = $totalEvaluados > 0
            ? (int) round(($totalAceptados / $totalEvaluados) * 100)
            : 100; // Si no hay rechazados, es 100%

        // ─────────────────────────────────────────────────────────────
        // INDICADOR: PORCENTAJE COBRADO (Financiero)
        // ─────────────────────────────────────────────────────────────
        //
        // Mide qué porcentaje del monto facturado en servicios operativos
        // ha sido efectivamente cobrado. Solo visible para Administrador
        // y Encargado.
        //
        // Se calcula como:
        //   collected_pct = (suma cobrada / suma facturada) * 100
        //
        // Donde "suma cobrada" es la suma de pagos por servicio, pero
        // limitada al precio total de cada servicio (no se cuenta de más
        // si un cliente pagó de más). Si no hay monto facturado, el
        // porcentaje queda en null (no aplica).
        // ─────────────────────────────────────────────────────────────

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

        // ─────────────────────────────────────────────────────────────
        // INDICADOR: INVENTARIO EN BUEN ESTADO
        // ─────────────────────────────────────────────────────────────
        //
        // Mide qué porcentaje del inventario activo está en buen estado
        // (sin problemas de stock bajo). Se calcula como:
        //   inventory_ok_pct = ((activos - alertas_stock) / activos) * 100
        //
        // Si no hay ítems activos, se asume 100% (todo ok).
        // ─────────────────────────────────────────────────────────────

        $activeItems = InventoryItem::active()->count();

        // ─────────────────────────────────────────────────────────────
        // INDICADOR: DISPONIBILIDAD DE FLOTA
        // ─────────────────────────────────────────────────────────────
        //
        // Mide qué porcentaje de los vehículos totales están disponibles
        // (no en servicio ni en mantenimiento). Se calcula como:
        //   fleet_available_pct = (disponibles / total) * 100
        //
        // Si no hay vehículos registrados, el porcentaje es 0.
        // ─────────────────────────────────────────────────────────────

        // Arreglo final de indicadores clave (porcentajes)
        // Nota: la clave 'completed_pct' se mantiene por compatibilidad con
        // el frontend, pero ahora contiene la Tasa de Aprobación.
        $indicators = [
            'completed_pct' => $approvalRate, // 👈 Reemplazamos el valor por la Tasa de Aprobación
            'collected_pct' => $collectedPct,
            // Usa el conteo de alertas de stock por categoría
            'inventory_ok_pct' => $activeItems > 0
                ? (int) round((($activeItems - $alerts['low_stock_items']) / $activeItems) * 100)
                : 100,
            'fleet_available_pct' => $fleetStatus['total'] > 0
                ? (int) round(($fleetStatus['available'] / $fleetStatus['total']) * 100)
                : 0,
        ];

        // Servicios para el calendario: sepelios (burial_at) y cremaciones (scheduled_at).
        // Ventana de 12 meses hacia atrás y 3 hacia adelante para poder navegar por meses antiguos.
        $calStart = Carbon::now()->startOfMonth()->subMonths(12);
        $calEnd = Carbon::now()->endOfMonth()->addMonths(3);

        $services = Service::with(['client:id,name', 'deceased:id,full_name', 'branch:id,name'])
            ->whereIn('status', ['accepted', 'in_progress', 'completed']) // 👈 Solo los aprobados
            ->where(function ($q) use ($calStart, $calEnd) {
                // Entierros: tienen fecha de sepelio
                $q->where(fn ($e) => $e->whereNotNull('burial_at')
                        ->whereBetween('burial_at', [$calStart, $calEnd]))
                    // Cremaciones (urna): la fecha del evento es scheduled_at
                    ->orWhere(fn ($c) => $c->where('service_type', 'urna')
                        ->whereBetween('scheduled_at', [$calStart, $calEnd]));
            })
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'uuid' => $s->uuid,
                'code' => $s->code,
                // Título que aparecerá en el recuadro del calendario
                'title' => ($s->service_type?->value === 'urna' ? 'Cremación' : 'Sepelio').": {$s->deceased?->full_name}",
                'event_type' => $s->service_type?->value === 'urna' ? 'cremacion' : 'sepelio',
                // Cremación: scheduled_at. Entierro: burial_at
                'start' => ($s->service_type?->value === 'urna' ? $s->scheduled_at : ($s->burial_at ?? $s->scheduled_at))->toIso8601String(),
                'end' => null, // Es un evento puntual, sin duración en horas
                'status' => $s->status,
                'status_label' => $s->status_label,
                'client' => $s->client?->name,
                'deceased' => $s->deceased?->full_name,
                'service_type' => $s->service_type_label,
                'branch' => $s->branch?->name,
            ])
            ->sortBy('start')
            ->values();

        // Servicios de HOY (que ocurren hoy o están en progreso)
        // El hito del día es el sepelio (burial_at) en ataúd, o la cremación (scheduled_at) en urna.
        $todayServices = Service::with(['client:id,name', 'deceased:id,full_name', 'branch:id,name'])
            ->whereIn('status', ['accepted', 'in_progress', 'completed'])
            ->whereRaw('('.self::EVENT_AT.') BETWEEN ? AND ?', [
                Carbon::today()->startOfDay()->toDateTimeString(),
                Carbon::today()->endOfDay()->toDateTimeString(),
            ])
            ->orderByRaw(self::EVENT_AT.' asc')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'uuid' => $s->uuid,
                'code' => $s->code,
                'scheduled_at' => self::eventAt($s)->toIso8601String(),
                'event_type' => $s->service_type?->value === 'urna' ? 'cremacion' : 'sepelio',
                'time' => self::eventAt($s)->format('H:i'),
                'day' => self::eventAt($s)->format('j'),
                'month' => ucfirst(rtrim(self::eventAt($s)->translatedFormat('M'), '.')),
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
        //
        // Lista de servicios con saldo pendiente de pago. Se excluyen los
        // pagos municipales que tienen fecha esperada de pago, porque esos
        // se muestran en su propia tarjeta (ver sección siguiente).
        //
        // Para cada servicio se calcula:
        //   - total_price: precio total del servicio
        //   - total_paid:  suma de pagos registrados
        //   - balance:     saldo pendiente (total_price - total_paid)
        //   - days_old:    días transcurridos desde la creación del servicio
        //
        // Se ordena de mayor a menor saldo pendiente y se toma el top 3
        // como "mayores deudores" para mostrar en el panel.
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
        //
        // Lista de servicios municipales con saldo pendiente y fecha
        // esperada de pago. Para cada uno se calcula:
        //   - days_until_due: días restantes hasta la fecha esperada
        //                     (negativo si ya venció)
        //   - is_urgent:      vence en los próximos 7 días
        //   - is_overdue:     ya venció (fecha esperada en el pasado)
        //
        // Se ordena por fecha esperada de pago (los más próximos primero).
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
                // Ingresos por Caja (pagos recibidos este mes)
                'monthly_revenue' => (float) $cashRevenue,
                // Ingresos por Facturación (servicios agendados este mes)
                'billed_revenue' => (float) $billedRevenue,
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