import { Head, Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

/** Colores de estado (semánticos). El color principal sale del tema. */
const statusClass = (status: string): string => {
    switch (status) {
        case 'accepted':
            return 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
        case 'in_progress':
            return 'border-primary/30 bg-primary/10 text-primary';
        case 'pending':
            return 'border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400';
        case 'completed':
            return 'border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-400';
        case 'rejected':
        case 'cancelled':
            return 'border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-400';
        default:
            return 'border-border bg-muted text-muted-foreground';
    }
};

// ──────────────────────────────────────────────────────────────
// SUBCOMPONENTES
// ──────────────────────────────────────────────────────────────
/** Acentos de color para tarjetas, iconos y gráficos (no tocan el fondo del tema). */
const ACCENTS = {
    amber: { tile: 'bg-amber-500/15 text-amber-500', border: 'border-l-amber-500', ring: 'text-amber-500' },
    sky: { tile: 'bg-sky-500/15 text-sky-500', border: 'border-l-sky-500', ring: 'text-sky-500' },
    emerald: { tile: 'bg-emerald-500/15 text-emerald-500', border: 'border-l-emerald-500', ring: 'text-emerald-500' },
    orange: { tile: 'bg-orange-500/15 text-orange-500', border: 'border-l-orange-500', ring: 'text-orange-500' },
    violet: { tile: 'bg-violet-500/15 text-violet-500', border: 'border-l-violet-500', ring: 'text-violet-500' },
    rose: { tile: 'bg-rose-500/15 text-rose-500', border: 'border-l-rose-500', ring: 'text-rose-500' },
} as const;

type Accent = keyof typeof ACCENTS;

function TitleIcon({ icon: Icon, accent }: { icon: LucideIcon; accent: Accent }) {
    return (
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${ACCENTS[accent].tile}`}>
            <Icon className="h-4 w-4" />
        </span>
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
        <Card className={`border-l-4 py-4 shadow-sm ${ACCENTS[accent].border}`}>
            <CardContent className="flex items-center gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${ACCENTS[accent].tile}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                    <p className="truncate text-2xl font-bold leading-tight">{value}</p>
                    <p className="truncate text-sm text-muted-foreground">{label}</p>
                    {children && <div className="mt-1">{children}</div>}
                </div>
            </CardContent>
        </Card>
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
        <div className="flex flex-col items-center gap-2 text-center">
            <div className={`relative h-24 w-24 ${ACCENTS[accent].ring}`}>
                <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                    <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={7} />
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={7}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - pct / 100)}
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">
                    {value === null ? '—' : `${pct}%`}
                </span>
            </div>
            <p className="text-xs text-muted-foreground">{label}</p>
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
        <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
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
        if (p.is_overdue) return `⚠️ Vencido hace ${days} ${days === 1 ? 'día' : 'días'}`;
        if (p.days_until_due === 0) return '⚠️ Vence hoy';
        if (p.is_urgent) return `⚠️ Vence en ${days} ${days === 1 ? 'día' : 'días'}`;
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

    return (
        <>
            <Head title="Dashboard" />

            <div className="space-y-6 p-4 sm:p-6">
                {/* ─────────────── ENCABEZADO ─────────────── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold sm:text-3xl">
                            {firstName ? `Bienvenido, ${firstName}` : 'Bienvenido'}
                        </h1>
                        <p className="text-sm text-muted-foreground sm:text-base">
                            Panel de control - Funeraria Cristo Rey
                        </p>
                    </div>
                    <div className="flex w-fit items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        <span>{today_label}</span>
                    </div>
                </div>

                {/* ─────────────── ACCIONES PENDIENTES ─────────────── */}
                {hasActions && (
                    <Card className="gap-0 border-amber-500/50 bg-amber-500/5 py-3">
                        <CardContent className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-semibold">Acciones pendientes</span>
                            {alerts.seremi_critical > 0 && (
                                <Link href="/inventory">
                                    <Button size="sm" className="gap-2 bg-red-600 text-white hover:bg-red-700">
                                        <AlertTriangle className="h-4 w-4" />
                                        ALERTA SEREMI: {alerts.seremi_critical} urna(s) obligatoria(s) sin stock
                                    </Button>
                                </Link>
                            )}
                            {alerts.pending_services > 0 && (
                                <Link href="/services?status=pending">
                                    <Button size="sm" variant="destructive" className="gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        {alerts.pending_services} Servicio(s) por Aprobar
                                    </Button>
                                </Link>
                            )}
                            {alerts.low_stock_items > 0 && (
                                <Link href="/inventory">
                                    <Button size="sm" variant="outline" className="gap-2 border-amber-500 text-amber-600 dark:text-amber-400">
                                        <Package className="h-4 w-4" />
                                        {alerts.low_stock_items} Artículo(s) con Stock Bajo
                                    </Button>
                                </Link>
                            )}
                            {alerts.pending_absences > 0 && (
                                <Link href="/absences?status=pending">
                                    <Button size="sm" variant="outline" className="gap-2 border-destructive text-destructive">
                                        <CalendarDays className="h-4 w-4" />
                                        {alerts.pending_absences} Ausencia(s) por Aprobar
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* ─────────────── KPIs ─────────────── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard icon={FileText} accent="amber" label="Servicios Activos" value={kpis.active_services}>
                        <span className="text-xs text-muted-foreground">
                            {today_services.length} {today_services.length === 1 ? 'programado' : 'programados'} hoy
                        </span>
                    </KpiCard>

                    <KpiCard icon={Users} accent="sky" label="Clientes Registrados" value={kpis.total_clients}>
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            +{kpis.new_clients_month} este mes
                        </span>
                    </KpiCard>

                    {can_see_finance ? (
                        <KpiCard icon={DollarSign} accent="emerald" label="Ingresos del Mes" value={formatPrice(kpis.monthly_revenue)}>
                            <Trend pct={kpis.revenue_change_pct} />
                        </KpiCard>
                    ) : (
                        <KpiCard icon={ClipboardList} accent="violet" label="Registros de Fallecidos" value={kpis.total_deceased} />
                    )}

                    <KpiCard icon={CalendarClock} accent="orange" label="Servicios Pendientes" value={alerts.pending_services}>
                        {alerts.pending_services > 0 ? (
                            <Link href="/services?status=pending" className="text-xs font-medium text-primary hover:underline">
                                Requieren aprobación
                            </Link>
                        ) : (
                            <span className="text-xs text-muted-foreground">Todo al día</span>
                        )}
                    </KpiCard>
                </div>

                {/* ─────────────── RESUMEN + PRÓXIMOS SERVICIOS ─────────────── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Resumen general */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <TitleIcon icon={BarChart3} accent="sky" />
                                    Resumen General
                                </CardTitle>
                                <span className="rounded-md border px-3 py-1 text-xs text-muted-foreground">
                                    Últimos 6 meses
                                </span>
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                {can_see_finance && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Ingresos
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Servicios
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[280px] text-foreground">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chart_data} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} vertical={false} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    {can_see_finance && (
                                        <YAxis
                                            yAxisId="money"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={formatAxisTick}
                                            width={52}
                                        />
                                    )}
                                    <YAxis
                                        yAxisId="count"
                                        orientation={can_see_finance ? 'right' : 'left'}
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                        width={32}
                                    />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'currentColor', fillOpacity: 0.05 }} />
                                    <Bar
                                        yAxisId="count"
                                        dataKey="services"
                                        fill="#0ea5e9"
                                        fillOpacity={0.85}
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={44}
                                    />
                                    {can_see_finance && (
                                        <Line
                                            yAxisId="money"
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#f59e0b"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#f59e0b', stroke: '#f59e0b' }}
                                            activeDot={{ r: 6 }}
                                        />
                                    )}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Próximos servicios */}
                    <Card>
                        <CardHeader className="pb-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <TitleIcon icon={CalendarClock} accent="amber" />
                                    Próximos Servicios
                                </CardTitle>
                                <Link href="/services" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                                    Ver todos <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {nextServices.length === 0 ? (
                                <div className="py-8 text-center">
                                    <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500/50" />
                                    <p className="text-sm text-muted-foreground">Sin servicios programados para los próximos días.</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {nextServices.map((s) => (
                                        <Link
                                            key={`${s.id}-${s.isToday ? 'hoy' : 'prox'}`}
                                            href={`/services/${s.id}`}
                                            className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/40"
                                        >
                                            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                                <span className="text-lg font-bold leading-none">{s.day}</span>
                                                <span className="text-xs font-medium">{s.month}</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold">{s.deceased ?? s.client}</p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {s.isToday && <span className="mr-1 font-medium text-primary">Hoy ·</span>}
                                                    {s.detail || s.client}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 flex-col items-end gap-1">
                                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3.5 w-3.5" /> {s.time}
                                                </span>
                                                <Badge variant="outline" className={`text-xs ${statusClass(s.status)}`}>
                                                    {s.status_label}
                                                </Badge>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ─────────────── ÚLTIMOS SERVICIOS + INDICADORES ─────────────── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Últimos servicios */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <TitleIcon icon={ClipboardList} accent="violet" />
                                    Últimos Servicios
                                </CardTitle>
                                <Link href="/services" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                                    Ver todos <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {recent_services.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay servicios registrados.</p>
                            ) : (
                                <>
                                    {/* Tabla (≥ sm) */}
                                    <div className="hidden sm:block">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>N° Expediente</TableHead>
                                                    <TableHead>Cliente</TableHead>
                                                    <TableHead>Fecha</TableHead>
                                                    <TableHead>Estado</TableHead>
                                                    <TableHead className="text-right">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {recent_services.map((s) => (
                                                    <TableRow key={s.id}>
                                                        <TableCell className="font-mono text-xs">{s.code}</TableCell>
                                                        <TableCell>
                                                            <p className="font-medium">{s.client}</p>
                                                            <p className="text-xs text-muted-foreground">{s.deceased}</p>
                                                        </TableCell>
                                                        <TableCell className="text-sm">{s.date ?? '—'}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={`text-xs ${statusClass(s.status)}`}>
                                                                {s.status_label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Link href={`/services/${s.id}`}>
                                                                <Button variant="ghost" size="sm" title="Ver detalle">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Lista (< sm) */}
                                    <div className="divide-y sm:hidden">
                                        {recent_services.map((s) => (
                                            <Link key={s.id} href={`/services/${s.id}`} className="flex items-center justify-between gap-3 py-3">
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
                        </CardContent>
                    </Card>

                    {/* Indicadores clave */}
                    <Card>
                        <CardHeader className="pb-0">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TitleIcon icon={Gauge} accent="emerald" />
                                Indicadores Clave
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <Ring value={indicators.completed_pct} accent="amber" label="Servicios Completados" />
                                {can_see_finance && <Ring value={indicators.collected_pct} accent="emerald" label="Saldo Cobrado" />}
                                <Ring value={indicators.inventory_ok_pct} accent="sky" label="Inventario Disponible" />
                                <Ring value={indicators.fleet_available_pct} accent="violet" label="Flota Disponible" />
                            </div>
                            <p className="mt-3 text-center text-xs text-muted-foreground">
                                {fleet_status.available} de {fleet_status.total} vehículos disponibles · {fleet_status.in_service} en servicio ·{' '}
                                {fleet_status.maintenance} en mantenimiento
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ─────────────── FINANZAS (solo Administrador) ─────────────── */}
                {can_see_finance && receivables && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Monto por cobrar */}
                        {receivables.unpaid_count === 0 ? (
                            <Card className="gap-0 border-l-4 border-l-emerald-500 py-3 shadow-sm">
                                <CardContent className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-emerald-500" />
                                        <span className="text-lg font-semibold">Total por Cobrar</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        Sin montos pendientes de cobro
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="gap-2 border-l-4 border-l-destructive bg-destructive/5 py-4 shadow-sm">
                                <CardHeader className="pb-0">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <DollarSign className="h-5 w-5 text-destructive" />
                                            Total por Cobrar
                                        </CardTitle>
                                        <Badge variant="destructive">
                                            {receivables.unpaid_count} {receivables.unpaid_count === 1 ? 'servicio' : 'servicios'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="text-3xl font-bold text-destructive">{formatPrice(receivables.total_pending)}</p>
                                        <p className="mt-1 text-sm text-muted-foreground">Pendiente de cobro</p>
                                        {receivables.old_unpaid_count > 0 && (
                                            <p className="mt-2 text-xs font-medium text-destructive">
                                                ⚠️ {receivables.old_unpaid_count} con más de 30 días
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="mb-2 text-sm font-medium">Top deudores:</p>
                                        <div className="space-y-2">
                                            {receivables.top_debtors.map((debtor, index) => (
                                                <Link
                                                    key={debtor.id}
                                                    href={`/services/${debtor.id}`}
                                                    className="flex items-center justify-between rounded-lg border bg-background p-2 transition-colors hover:bg-muted/50"
                                                >
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-bold text-destructive">
                                                            {index + 1}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium">{debtor.client}</p>
                                                            <p className="truncate text-xs text-muted-foreground">
                                                                {debtor.deceased} · {debtor.days_old} {debtor.days_old === 1 ? 'día' : 'días'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="ml-3 shrink-0 text-sm font-bold text-destructive">{formatPrice(debtor.balance)}</p>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Pagos municipales */}
                        {municipal_payments.length > 0 && (
                            <Card className="gap-2 border-l-4 border-l-amber-500 bg-amber-500/5 py-4 shadow-sm">
                                <CardHeader className="pb-0">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Building2 className="h-5 w-5 text-amber-500" />
                                            Pagos Municipales Pendientes
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatPrice(municipalTotal)}</span>
                                            <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">
                                                {municipal_payments.length} {municipal_payments.length === 1 ? 'pendiente' : 'pendientes'}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {municipal_payments.map((payment) => (
                                            <Link
                                                key={payment.id}
                                                href={`/services/${payment.id}`}
                                                className={`flex items-center justify-between rounded-lg border p-2 transition-colors hover:bg-muted/50 ${
                                                    payment.is_overdue
                                                        ? 'border-destructive bg-destructive/5'
                                                        : payment.is_urgent
                                                          ? 'border-amber-500 bg-amber-500/5'
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
                                                                ? 'font-medium text-destructive'
                                                                : payment.is_urgent
                                                                  ? 'font-medium text-amber-600 dark:text-amber-400'
                                                                  : 'text-muted-foreground'
                                                        }`}
                                                    >
                                                        {dueLabel(payment)}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* ─────────────── ALERTAS DE STOCK ─────────────── */}
                {low_stock.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <AlertTriangle className="h-5 w-5 text-destructive" /> Alertas de Stock
                            </CardTitle>
                            <CardDescription>Productos por debajo del mínimo</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {low_stock.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between rounded-lg border bg-destructive/5 p-2">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">{item.name}</p>
                                            <p className="font-mono text-xs text-muted-foreground">{item.code}</p>
                                        </div>
                                        <div className="ml-3 shrink-0 text-right">
                                            <p className="text-sm font-bold text-destructive">{item.stock} un.</p>
                                            <p className="text-xs text-muted-foreground">Mín: {item.stock_minimum}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link href="/inventory" className="mt-3 block text-center text-sm text-primary hover:underline">
                                Ver todo el inventario
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* ─────────────── CALENDARIO ─────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TitleIcon icon={CalendarIcon} accent="rose" /> Calendario de Servicios
                        </CardTitle>
                        <CardDescription>
                            Vista mensual de todos los servicios programados. Haz clic en un servicio para ver el detalle.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ServicesCalendar services={services} />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}