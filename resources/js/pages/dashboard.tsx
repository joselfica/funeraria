import { Head, Link, usePage } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    AlertTriangle, ArrowRight, BarChart3, Building2, Calendar as CalendarIcon, CalendarClock,
    CalendarDays, CheckCircle2, ClipboardList, Clock, DollarSign, Eye, FileText, Gauge, Package,
    TrendingDown, TrendingUp, Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import ServicesCalendar from '@/components/Dashboard/ServicesCalendar';
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

// ──────────────────────────────────────────────────────────────
// TIPOS
// ──────────────────────────────────────────────────────────────
interface Kpis {
    total_clients: number;
    total_deceased: number;
    active_services: number;
    monthly_revenue: number;
    revenue_change_pct: number | null;
    new_clients_month: number;
}

interface ChartData {
    name: string;
    total: number;
    services: number;
}

interface LowStockItem {
    id: number;
    code: string;
    name: string;
    stock: number;
    stock_minimum: number;
}

interface UpcomingService {
    id: number;
    code: string;
    scheduled_at: string;
    scheduled_date: string;
    scheduled_time: string;
    day: string;
    month: string;
    status: string;
    status_label: string;
    deceased: string | null;
    client: string | null;
    service_type: string | null;
    origin_location: string | null;
    destination_location: string | null;
    vehicles: string;
}

interface FleetStatus {
    total: number;
    available: number;
    in_service: number;
    maintenance: number;
}

interface Alerts {
    pending_services: number;
    low_stock_items: number;
    seremi_critical: number;
    pending_absences: number;
}

interface CalendarService {
    id: number;
    code: string;
    title: string;
    start: string;
    end: string | null;
    status: string;
    status_label: string;
    client: string | null;
    deceased: string | null;
    service_type: string | null;
    branch: string | null;
}

interface TodayService {
    id: number;
    code: string;
    scheduled_at: string;
    time: string;
    day: string;
    month: string;
    status: string;
    status_label: string;
    client: string | null;
    deceased: string | null;
    service_type: string | null;
    branch: string | null;
}

interface RecentService {
    id: number;
    code: string;
    client: string | null;
    deceased: string | null;
    date: string | null;
    status: string;
    status_label: string;
}

interface Indicators {
    completed_pct: number;
    collected_pct: number | null;
    inventory_ok_pct: number;
    fleet_available_pct: number;
}

interface Debtor {
    id: number;
    code: string;
    client: string | null;
    deceased: string | null;
    total_price: number;
    total_paid: number;
    balance: number;
    days_old: number;
}

interface Receivables {
    total_pending: number;
    unpaid_count: number;
    old_unpaid_count: number;
    top_debtors: Debtor[];
}

interface MunicipalPayment {
    id: number;
    code: string;
    client: string | null;
    deceased: string | null;
    balance: number;
    expected_payment_date: string;
    expected_date_formatted: string;
    days_until_due: number;
    is_urgent: boolean;
    is_overdue: boolean;
}

interface Props {
    kpis: Kpis;
    can_see_finance: boolean;
    today_label: string;
    chart_data: ChartData[];
    low_stock: LowStockItem[];
    upcoming_services: UpcomingService[];
    fleet_status: FleetStatus;
    alerts: Alerts;
    services: CalendarService[];
    today_services: TodayService[];
    recent_services: RecentService[];
    indicators: Indicators;
    receivables: Receivables | null;
    municipal_payments: MunicipalPayment[];
}

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────
const formatPrice = (value: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

/** Eje Y: "k" para miles, "M" para millones. */
const formatAxisTick = (value: number): string => {
    if (value >= 1_000_000) {
        const millions = value / 1_000_000;
        return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
    }
    const thousands = value / 1_000;
    return `$${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
};

/** Badges suaves de estado (semánticos). */
const statusClass = (status: string): string => {
    switch (status) {
        case 'accepted':
            return 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
        case 'in_progress':
            return 'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300';
        case 'pending':
            return 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300';
        case 'completed':
            return 'border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300';
        case 'rejected':
        case 'cancelled':
            return 'border-red-200 bg-red-100 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300';
        default:
            return 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
};

// ──────────────────────────────────────────────────────────────
// SUBCOMPONENTES
// ──────────────────────────────────────────────────────────────
const ACCENTS = {
    amber: { tile: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', ring: 'text-amber-500' },
    sky: { tile: 'bg-sky-500/15 text-sky-600 dark:text-sky-400', ring: 'text-sky-500' },
    emerald: { tile: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', ring: 'text-emerald-500' },
    orange: { tile: 'bg-orange-500/15 text-orange-600 dark:text-orange-400', ring: 'text-orange-500' },
    violet: { tile: 'bg-violet-500/15 text-violet-600 dark:text-violet-400', ring: 'text-violet-500' },
    rose: { tile: 'bg-rose-500/15 text-rose-700 dark:text-rose-400', ring: 'text-rose-500' },
} as const;

type Accent = keyof typeof ACCENTS;

/** Tarjeta de sección: encabezado compacto con icono, título y enlace opcional. */
function Section({
    icon: Icon,
    accent,
    title,
    subtitle,
    href,
    right,
    className = '',
    children,
}: {
    icon: LucideIcon;
    accent: Accent;
    title: string;
    subtitle?: string;
    href?: string;
    right?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section className={`rounded-xl border bg-card shadow-sm ${className}`}>
            <div className="flex items-center justify-between gap-3 px-4 pt-4">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ACCENTS[accent].tile}`}>
                        <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold sm:text-base">{title}</h2>
                        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
                    </div>
                </div>
                {right}
                {href && (
                    <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-rose-800 hover:underline dark:text-rose-300">
                        Ver todos <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                )}
            </div>
            <div className="p-4">{children}</div>
        </section>
    );
}

function KpiCard({
    icon: Icon,
    label,
    value,
    accent,
    children,
}: {
    icon: LucideIcon;
    label: string;
    value: ReactNode;
    accent: Accent;
    children?: ReactNode;
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ACCENTS[accent].tile}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
                <p className="truncate text-xl font-bold leading-tight sm:text-2xl">{value}</p>
                {children && <div className="mt-0.5">{children}</div>}
            </div>
        </div>
    );
}

function Trend({ pct }: { pct: number | null }) {
    if (pct === null) {
        return <span className="text-xs text-muted-foreground">Sin datos del mes anterior</span>;
    }
    const positive = pct >= 0;
    return (
        <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${
                positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
            }`}
        >
            {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {positive ? '+' : ''}
            {pct}% vs mes anterior
        </span>
    );
}

function Ring({ value, label, accent }: { value: number | null; label: string; accent: Accent }) {
    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    const pct = value === null ? 0 : Math.max(0, Math.min(100, value));

    return (
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
            <div className={`relative h-14 w-14 shrink-0 ${ACCENTS[accent].ring}`}>
                <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                    <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={8} />
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={8}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - pct / 100)}
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                    {value === null ? '—' : `${pct}%`}
                </span>
            </div>
            <p className="text-xs leading-tight text-muted-foreground">{label}</p>
        </div>
    );
}

function ChartTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ dataKey?: string | number; value?: number }>;
    label?: string;
}) {
    if (!active || !payload || payload.length === 0) return null;

    const revenue = payload.find((p) => p.dataKey === 'total');
    const count = payload.find((p) => p.dataKey === 'services');

    return (
        <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
            <p className="mb-1 font-medium">{label}</p>
            {revenue && <p>Ingresos: {formatPrice(revenue.value ?? 0)}</p>}
            {count && <p>Servicios: {count.value ?? 0}</p>}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ──────────────────────────────────────────────────────────────
export default function Dashboard({
    kpis,
    can_see_finance,
    today_label,
    chart_data,
    low_stock,
    upcoming_services,
    fleet_status,
    alerts,
    services,
    today_services,
    recent_services,
    indicators,
    receivables,
    municipal_payments,
}: Props) {
    const { props } = usePage<{ auth?: { user?: { name?: string } } }>();
    const firstName = props.auth?.user?.name?.split(' ')[0] ?? '';

    const municipalTotal = municipal_payments.reduce((sum, p) => sum + p.balance, 0);

    const dueLabel = (p: MunicipalPayment): string => {
        const days = Math.abs(p.days_until_due);
        if (p.is_overdue) return `Vencido hace ${days} ${days === 1 ? 'día' : 'días'}`;
        if (p.days_until_due === 0) return 'Vence hoy';
        if (p.is_urgent) return `Vence en ${days} ${days === 1 ? 'día' : 'días'}`;
        return `Vence ${p.expected_date_formatted}`;
    };

    // Próximos servicios = los de hoy primero + los de los próximos 7 días
    const nextServices = [
        ...today_services.map((s) => ({
            id: s.id,
            code: s.code,
            day: s.day,
            month: s.month,
            time: s.time,
            status: s.status,
            status_label: s.status_label,
            deceased: s.deceased,
            client: s.client,
            detail: s.service_type,
            isToday: true,
        })),
        ...upcoming_services.map((s) => ({
            id: s.id,
            code: s.code,
            day: s.day,
            month: s.month,
            time: s.scheduled_time,
            status: s.status,
            status_label: s.status_label,
            deceased: s.deceased,
            client: s.client,
            detail: [s.service_type, s.destination_location].filter(Boolean).join(' · '),
            isToday: false,
        })),
    ].slice(0, 5);

    const hasActions =
        alerts.pending_services > 0 ||
        alerts.low_stock_items > 0 ||
        alerts.seremi_critical > 0 ||
        alerts.pending_absences > 0;

    const pill = 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors';

    return (
        <>
            <Head title="Dashboard" />

            <div className="mx-auto max-w-7xl space-y-4 p-4 pb-10 sm:p-6">
                {/* ─────────────── ENCABEZADO ─────────────── */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 sm:text-2xl">
                            {firstName ? `Bienvenido, ${firstName}` : 'Bienvenido'}
                        </h1>
                        <p className="text-sm text-muted-foreground">Panel de control · Funeraria Cristo Rey</p>
                    </div>
                    <div className="flex w-fit items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium shadow-sm sm:text-sm">
                        <CalendarDays className="h-4 w-4 text-rose-800 dark:text-rose-300" />
                        <span className="capitalize">{today_label}</span>
                    </div>
                </div>

                {/* ─────────────── ACCIONES PENDIENTES ─────────────── */}
                {hasActions && (
                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2.5 dark:border-amber-900/60 dark:bg-amber-950/20">
                        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                            Pendiente
                        </span>
                        {alerts.seremi_critical > 0 && (
                            <Link href="/inventory" className={`${pill} border-red-600 bg-red-600 text-white hover:bg-red-700`}>
                                <AlertTriangle className="h-3.5 w-3.5" />
                                SEREMI: {alerts.seremi_critical} urna(s) obligatoria(s) sin stock
                            </Link>
                        )}
                        {alerts.pending_services > 0 && (
                            <Link href="/services?status=pending" className={`${pill} border-red-200 bg-red-100 text-red-800 hover:bg-red-200`}>
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {alerts.pending_services} servicio(s) por aprobar
                            </Link>
                        )}
                        {alerts.low_stock_items > 0 && (
                            <Link href="/inventory" className={`${pill} border-amber-300 bg-white text-amber-800 hover:bg-amber-100 dark:bg-transparent dark:text-amber-300`}>
                                <Package className="h-3.5 w-3.5" />
                                {alerts.low_stock_items} con stock bajo
                            </Link>
                        )}
                        {alerts.pending_absences > 0 && (
                            <Link href="/absences?status=pending" className={`${pill} border-rose-300 bg-white text-rose-800 hover:bg-rose-100 dark:bg-transparent dark:text-rose-300`}>
                                <CalendarDays className="h-3.5 w-3.5" />
                                {alerts.pending_absences} ausencia(s) por aprobar
                            </Link>
                        )}
                    </div>
                )}

                {/* ─────────────── KPIs ─────────────── */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard icon={FileText} accent="amber" label="Servicios activos" value={kpis.active_services}>
                        <span className="text-xs text-muted-foreground">
                            {today_services.length} {today_services.length === 1 ? 'programado' : 'programados'} hoy
                        </span>
                    </KpiCard>

                    <KpiCard icon={Users} accent="sky" label="Clientes registrados" value={kpis.total_clients}>
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            +{kpis.new_clients_month} este mes
                        </span>
                    </KpiCard>

                    {can_see_finance ? (
                        <KpiCard icon={DollarSign} accent="emerald" label="Ingresos del mes" value={formatPrice(kpis.monthly_revenue)}>
                            <Trend pct={kpis.revenue_change_pct} />
                        </KpiCard>
                    ) : (
                        <KpiCard icon={ClipboardList} accent="violet" label="Registros de fallecidos" value={kpis.total_deceased} />
                    )}

                    <KpiCard icon={CalendarClock} accent="orange" label="Servicios pendientes" value={alerts.pending_services}>
                        {alerts.pending_services > 0 ? (
                            <Link href="/services?status=pending" className="text-xs font-medium text-rose-800 hover:underline dark:text-rose-300">
                                Requieren aprobación
                            </Link>
                        ) : (
                            <span className="text-xs text-muted-foreground">Todo al día</span>
                        )}
                    </KpiCard>
                </div>

                {/* ─────────────── RESUMEN + PRÓXIMOS SERVICIOS ─────────────── */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Section
                        icon={BarChart3}
                        accent="sky"
                        title="Resumen general"
                        subtitle="Últimos 6 meses"
                        className="lg:col-span-2"
                        right={
                            <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                                {can_see_finance && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-amber-500" /> Ingresos
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-sky-500" /> Servicios
                                </span>
                            </div>
                        }
                    >
                        <div className="h-[220px] text-foreground">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chart_data} margin={{ top: 6, right: 4, bottom: 0, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} vertical={false} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                                    {can_see_finance && (
                                        <YAxis
                                            yAxisId="money"
                                            stroke="#888888"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={formatAxisTick}
                                            width={48}
                                        />
                                    )}
                                    <YAxis
                                        yAxisId="count"
                                        orientation={can_see_finance ? 'right' : 'left'}
                                        stroke="#888888"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                        width={28}
                                    />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'currentColor', fillOpacity: 0.05 }} />
                                    <Bar
                                        yAxisId="count"
                                        dataKey="services"
                                        fill="#0ea5e9"
                                        fillOpacity={0.85}
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={36}
                                    />
                                    {can_see_finance && (
                                        <Line
                                            yAxisId="money"
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#f59e0b"
                                            strokeWidth={2.5}
                                            dot={{ r: 3, fill: '#f59e0b', stroke: '#f59e0b' }}
                                            activeDot={{ r: 5 }}
                                        />
                                    )}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </Section>

                    <Section icon={CalendarClock} accent="amber" title="Próximos servicios" href="/services">
                        {nextServices.length === 0 ? (
                            <div className="py-6 text-center">
                                <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-emerald-500/50" />
                                <p className="text-sm text-muted-foreground">Sin servicios programados.</p>
                            </div>
                        ) : (
                            <div className="-my-1 divide-y">
                                {nextServices.map((s) => (
                                    <Link
                                        key={`${s.id}-${s.isToday ? 'hoy' : 'prox'}`}
                                        href={`/services/${s.id}`}
                                        className="flex items-center gap-3 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
                                            <span className="text-sm font-bold leading-none">{s.day}</span>
                                            <span className="text-[10px] font-medium uppercase">{s.month}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{s.deceased ?? s.client}</p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {s.isToday && <span className="mr-1 font-semibold text-rose-800 dark:text-rose-300">Hoy ·</span>}
                                                {s.detail || s.client}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-1">
                                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" /> {s.time}
                                            </span>
                                            <Badge variant="outline" className={`px-1.5 py-0 text-[10px] ${statusClass(s.status)}`}>
                                                {s.status_label}
                                            </Badge>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Section>
                </div>

                {/* ─────────────── ÚLTIMOS SERVICIOS + INDICADORES ─────────────── */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Section icon={ClipboardList} accent="violet" title="Últimos servicios" href="/services" className="lg:col-span-2">
                        {recent_services.length === 0 ? (
                            <p className="py-4 text-center text-sm text-muted-foreground">Aún no hay servicios registrados.</p>
                        ) : (
                            <>
                                {/* Tabla (≥ sm) */}
                                <div className="-mx-4 -mb-4 hidden overflow-hidden rounded-b-xl border-t sm:block">
                                    <Table>
                                        <TableHeader className="bg-slate-50 dark:bg-slate-900/40">
                                            <TableRow>
                                                <TableHead className="h-10 px-4 text-xs">Expediente</TableHead>
                                                <TableHead className="h-10 px-4 text-xs">Cliente</TableHead>
                                                <TableHead className="h-10 px-4 text-xs">Fecha</TableHead>
                                                <TableHead className="h-10 px-4 text-xs">Estado</TableHead>
                                                <TableHead className="h-10 px-4 text-right text-xs"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recent_services.map((s) => (
                                                <TableRow key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                                    <TableCell className="px-4 py-2.5 font-mono text-xs">{s.code}</TableCell>
                                                    <TableCell className="px-4 py-2.5">
                                                        <p className="text-sm font-medium">{s.client}</p>
                                                        <p className="text-xs text-muted-foreground">{s.deceased}</p>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-2.5 text-sm">{s.date ?? '—'}</TableCell>
                                                    <TableCell className="px-4 py-2.5">
                                                        <Badge variant="outline" className={`text-xs ${statusClass(s.status)}`}>
                                                            {s.status_label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-2.5 text-right">
                                                        <Link
                                                            href={`/services/${s.id}`}
                                                            title="Ver detalle"
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Lista (< sm) */}
                                <div className="-my-1 divide-y sm:hidden">
                                    {recent_services.map((s) => (
                                        <Link key={s.id} href={`/services/${s.id}`} className="flex items-center justify-between gap-3 py-2.5">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">{s.client}</p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    <span className="font-mono">{s.code}</span> · {s.date ?? '—'}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className={`shrink-0 text-xs ${statusClass(s.status)}`}>
                                                {s.status_label}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}
                    </Section>

                    <Section icon={Gauge} accent="emerald" title="Indicadores clave">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                            <Ring value={indicators.completed_pct} accent="amber" label="Servicios completados" />
                            {can_see_finance && <Ring value={indicators.collected_pct} accent="emerald" label="Saldo cobrado" />}
                            <Ring value={indicators.inventory_ok_pct} accent="sky" label="Inventario disponible" />
                            <Ring value={indicators.fleet_available_pct} accent="violet" label="Flota disponible" />
                        </div>
                        <p className="mt-3 text-center text-xs text-muted-foreground">
                            {fleet_status.available} de {fleet_status.total} vehículos disponibles · {fleet_status.in_service} en servicio ·{' '}
                            {fleet_status.maintenance} en mantenimiento
                        </p>
                    </Section>
                </div>

                {/* ─────────────── FINANZAS (solo Administrador) ─────────────── */}
                {can_see_finance && receivables && (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Monto por cobrar */}
                        {receivables.unpaid_count === 0 ? (
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-4 shadow-sm">
                                <div className="flex items-center gap-2.5">
                                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${ACCENTS.emerald.tile}`}>
                                        <DollarSign className="h-4 w-4" />
                                    </span>
                                    <span className="font-semibold">Total por cobrar</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    Sin montos pendientes
                                </div>
                            </div>
                        ) : (
                            <section className="rounded-xl border border-red-200 bg-red-50/60 shadow-sm dark:border-red-900/60 dark:bg-red-950/10">
                                <div className="flex items-start justify-between gap-3 p-4 pb-3">
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15 text-red-600">
                                                <DollarSign className="h-4 w-4" />
                                            </span>
                                            Total por cobrar
                                        </div>
                                        <p className="mt-2 text-2xl font-bold text-red-600 sm:text-3xl">{formatPrice(receivables.total_pending)}</p>
                                        {receivables.old_unpaid_count > 0 && (
                                            <p className="mt-0.5 text-xs font-medium text-red-600">
                                                {receivables.old_unpaid_count} con más de 30 días
                                            </p>
                                        )}
                                    </div>
                                    <Badge className="border-red-200 bg-red-100 text-red-700 hover:bg-red-100">
                                        {receivables.unpaid_count} {receivables.unpaid_count === 1 ? 'servicio' : 'servicios'}
                                    </Badge>
                                </div>
                                <div className="space-y-1.5 border-t border-red-200/70 p-4 pt-3 dark:border-red-900/50">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top deudores</p>
                                    {receivables.top_debtors.map((debtor, index) => (
                                        <Link
                                            key={debtor.id}
                                            href={`/services/${debtor.id}`}
                                            className="flex items-center justify-between rounded-lg border bg-background px-2.5 py-2 transition-colors hover:bg-muted/50"
                                        >
                                            <div className="flex min-w-0 items-center gap-2">
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[11px] font-bold text-red-700">
                                                    {index + 1}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">{debtor.client}</p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {debtor.deceased} · {debtor.days_old} {debtor.days_old === 1 ? 'día' : 'días'}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="ml-3 shrink-0 text-sm font-bold text-red-600">{formatPrice(debtor.balance)}</p>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Pagos municipales */}
                        {municipal_payments.length > 0 && (
                            <section className="rounded-xl border border-amber-200 bg-amber-50/60 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/10">
                                <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-3">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
                                            <Building2 className="h-4 w-4" />
                                        </span>
                                        Pagos municipales
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{formatPrice(municipalTotal)}</span>
                                        <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">
                                            {municipal_payments.length} {municipal_payments.length === 1 ? 'pendiente' : 'pendientes'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-1.5 border-t border-amber-200/70 p-4 pt-3 dark:border-amber-900/50">
                                    {municipal_payments.map((payment) => (
                                        <Link
                                            key={payment.id}
                                            href={`/services/${payment.id}`}
                                            className={`flex items-center justify-between rounded-lg border px-2.5 py-2 transition-colors hover:bg-muted/50 ${
                                                payment.is_overdue
                                                    ? 'border-red-300 bg-red-50 dark:bg-red-950/20'
                                                    : payment.is_urgent
                                                      ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20'
                                                      : 'bg-background'
                                            }`}
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">{payment.deceased}</p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {payment.client} · <span className="font-mono">{payment.code}</span>
                                                </p>
                                            </div>
                                            <div className="ml-3 shrink-0 text-right">
                                                <p className="text-sm font-bold">{formatPrice(payment.balance)}</p>
                                                <p
                                                    className={`text-xs ${
                                                        payment.is_overdue
                                                            ? 'font-medium text-red-600'
                                                            : payment.is_urgent
                                                              ? 'font-medium text-amber-700 dark:text-amber-400'
                                                              : 'text-muted-foreground'
                                                    }`}
                                                >
                                                    {dueLabel(payment)}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {/* ─────────────── ALERTAS DE STOCK ─────────────── */}
                {low_stock.length > 0 && (
                    <section className="rounded-xl border bg-card shadow-sm">
                        <div className="flex items-center justify-between gap-3 px-4 pt-4">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15 text-red-600">
                                    <AlertTriangle className="h-4 w-4" />
                                </span>
                                <div>
                                    <h2 className="text-sm font-semibold sm:text-base">Alertas de stock</h2>
                                    <p className="text-xs text-muted-foreground">Productos por debajo del mínimo</p>
                                </div>
                            </div>
                            <Link href="/inventory" className="inline-flex items-center gap-1 text-xs font-medium text-rose-800 hover:underline dark:text-rose-300">
                                Ver inventario <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 gap-2 p-4 md:grid-cols-2 xl:grid-cols-3">
                            {low_stock.map((item) => (
                                <div key={item.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 dark:border-red-900/40 dark:bg-red-950/10">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{item.name}</p>
                                        <p className="font-mono text-xs text-muted-foreground">{item.code}</p>
                                    </div>
                                    <div className="ml-3 shrink-0 text-right">
                                        <p className="text-sm font-bold text-red-600">{item.stock} un.</p>
                                        <p className="text-xs text-muted-foreground">Mín: {item.stock_minimum}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ─────────────── CALENDARIO ─────────────── */}
                <Section
                    icon={CalendarIcon}
                    accent="rose"
                    title="Calendario de servicios"
                    subtitle="Haz clic en un servicio para ver el detalle"
                >
                    <ServicesCalendar services={services} />
                </Section>
            </div>
        </>
    );
}