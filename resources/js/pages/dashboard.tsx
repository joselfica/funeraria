import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Users, FileText, Activity, DollarSign, AlertTriangle, Calendar, Truck, Package, Calendar as CalendarIcon,
    Clock, CheckCircle2, Building2, // ← NUEVOS
} from 'lucide-react';
import ServicesCalendar from '@/components/Dashboard/ServicesCalendar';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

// ──────────────────────────────────────────────────────────────
// TIPOS
// ──────────────────────────────────────────────────────────────
interface Kpis {
    total_clients: number;
    total_deceased: number;
    active_services: number;
    monthly_revenue: number;
}

interface ChartData {
    name: string;
    total: number;
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
    status: string;
    status_label: string;
    client: string | null;
    deceased: string | null;
    service_type: string | null;
    branch: string | null;
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
    chart_data: ChartData[];
    low_stock: LowStockItem[];
    upcoming_services: UpcomingService[];
    fleet_status: FleetStatus;
    alerts: Alerts;
    services: CalendarService[];
    today_services: TodayService[];
    receivables: Receivables;
    municipal_payments: MunicipalPayment[];  // ← NUEVO
}

// ──────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ──────────────────────────────────────────────────────────────
export default function Dashboard({
    kpis,
    chart_data,
    low_stock,
    upcoming_services,
    fleet_status,
    alerts,
    services,
    today_services,
    receivables,
    municipal_payments,  // ← NUEVO
}: Props) {

    const municipalTotal = municipal_payments.reduce((sum, p) => sum + p.balance, 0);

    const dueLabel = (p: MunicipalPayment): string => {
        const days = Math.abs(p.days_until_due);
        if (p.is_overdue) return `⚠️ Vencido hace ${days} ${days === 1 ? 'día' : 'días'}`;
        if (p.days_until_due === 0) return '⚠️ Vence hoy';
        if (p.is_urgent) return `⚠️ Vence en ${days} ${days === 1 ? 'día' : 'días'}`;
        return `Vence ${p.expected_date_formatted}`;
    };

    const formatPrice = (value: number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

    /**
     * Formatea el eje Y del gráfico.
     * Si el valor es menor a 1.000.000, muestra "k" (miles).
     * Si es mayor o igual a 1.000.000, muestra "M" (millones).
     */
    const formatAxisTick = (value: number): string => {
        if (value >= 1_000_000) {
            const millions = value / 1_000_000;
            return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
        }
        const thousands = value / 1_000;
        return `$${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
    };

    return (
        <>
            <Head title="Dashboard" />

            <div className="p-6 space-y-6">
                
                {/* HEADER */}
                <div>
                    <h1 className="text-3xl font-bold">Panel de Control</h1>
                    <p className="text-muted-foreground">Resumen general de la operación de Funeraria Cristo Rey</p>
                </div>

                {/* ────────────────────────────────────────────────────────── */}
                {/* SERVICIOS DE HOY                                          */}
                {/* ────────────────────────────────────────────────────────── */}
                {today_services.length === 0 ? (
                    /* Sin servicios: tarjeta compacta de una sola línea */
                    <Card className="border-t-4 border-t-primary shadow-sm">
                        <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                <span className="text-lg font-semibold">Servicios de Hoy</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                Ningún servicio programado para hoy
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-t-4 border-t-primary shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Clock className="h-5 w-5 text-primary" />
                                    Servicios de Hoy
                                </CardTitle>
                                <Badge variant="default" className="text-sm">
                                    {today_services.length} {today_services.length === 1 ? 'servicio' : 'servicios'}
                                </Badge>
                            </div>
                            <CardDescription>Servicios programados para el día de hoy</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Las tarjetas se centran y se reparten según la cantidad (1, 2, 3 o más) */}
                            <div className="flex flex-wrap justify-center gap-3">
                                {today_services.map((service) => (
                                    <Link
                                        key={service.id}
                                        href={`/services/${service.id}`}
                                        className="w-full md:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)] p-4 border rounded-lg hover:bg-muted/50 transition-colors bg-card"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-lg text-primary">{service.time}</p>
                                                <p className="font-mono text-xs text-muted-foreground">{service.code}</p>
                                            </div>
                                            <Badge variant={service.status === 'accepted' ? 'default' : 'secondary'} className="text-xs">
                                                {service.status_label}
                                            </Badge>
                                        </div>
                                        <p className="font-medium text-sm truncate">{service.deceased}</p>
                                        <p className="text-xs text-muted-foreground truncate">{service.client}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{service.service_type}</p>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* KPI CARDS (5 tarjetas compactas, incluye la flota) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

                    <Card className="gap-1 py-3">
                        <CardHeader className="flex flex-row items-center justify-between pb-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Activos</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpis.total_clients}</div>
                        </CardContent>
                    </Card>

                    <Card className="gap-1 py-3">
                        <CardHeader className="flex flex-row items-center justify-between pb-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Servicios Activos</CardTitle>
                            <Activity className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpis.active_services}</div>
                        </CardContent>
                    </Card>

                    <Card className="gap-1 py-3">
                        <CardHeader className="flex flex-row items-center justify-between pb-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos del Mes</CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-500">{formatPrice(kpis.monthly_revenue)}</div>
                        </CardContent>
                    </Card>

                    <Card className="gap-1 py-3">
                        <CardHeader className="flex flex-row items-center justify-between pb-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Registros Fallecidos</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpis.total_deceased}</div>
                        </CardContent>
                    </Card>

                    {/* Estado de la Flota */}
                    <Card className="gap-1 py-3">
                        <CardHeader className="flex flex-row items-center justify-between pb-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Flota Disponible</CardTitle>
                            <Truck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {fleet_status.available}
                                <span className="text-base font-medium text-muted-foreground"> / {fleet_status.total}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {fleet_status.in_service} en servicio · {fleet_status.maintenance} en mantención
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ────────────────────────────────────────────────────────── */}
                {/* MONTO POR COBRAR                                         */}
                {/* ────────────────────────────────────────────────────────── */}
                {receivables.unpaid_count === 0 ? (
                    /* Sin deudas: tarjeta compacta de una sola línea */
                    <Card className="border-l-4 border-l-emerald-500 shadow-sm gap-0 py-3">
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
                    <Card className="border-l-4 border-l-destructive bg-destructive/5 shadow-sm gap-2 py-4">
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
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                {/* Monto total */}
                                <div className="md:col-span-1">
                                    <p className="text-3xl font-bold text-destructive">
                                        {formatPrice(receivables.total_pending)}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Pendiente de cobro
                                    </p>
                                    {receivables.old_unpaid_count > 0 && (
                                        <p className="text-xs text-destructive font-medium mt-2">
                                            ⚠️ {receivables.old_unpaid_count} con más de 30 días
                                        </p>
                                    )}
                                </div>

                                {/* Top 3 deudores */}
                                <div className="md:col-span-2">
                                    <p className="text-sm font-medium mb-2">Top deudores:</p>
                                    <div className="space-y-2">
                                        {receivables.top_debtors.map((debtor, index) => (
                                            <Link
                                                key={debtor.id}
                                                href={`/services/${debtor.id}`}
                                                className="flex items-center justify-between p-2 bg-background border rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-destructive/10 text-destructive font-bold text-xs shrink-0">
                                                        {index + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm truncate">{debtor.client}</p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {debtor.deceased} · {debtor.days_old} {debtor.days_old === 1 ? 'día' : 'días'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-destructive text-sm ml-3 shrink-0">
                                                    {formatPrice(debtor.balance)}
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ────────────────────────────────────────────────────────── */}
                {/* PAGOS MUNICIPALES PENDIENTES                              */}
                {/* ────────────────────────────────────────────────────────── */}
                {municipal_payments.length > 0 && (
                    <Card className="border-l-4 border-l-amber-500 bg-amber-500/5 shadow-sm gap-2 py-4">
                        <CardHeader className="pb-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Building2 className="h-5 w-5 text-amber-500" />
                                    Pagos Municipales Pendientes
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-amber-500">{formatPrice(municipalTotal)}</span>
                                    <Badge variant="outline" className="border-amber-500 text-amber-500">
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
                                        className={`flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors ${
                                            payment.is_overdue
                                                ? 'border-destructive bg-destructive/5'
                                                : payment.is_urgent
                                                    ? 'border-amber-500 bg-amber-500/5'
                                                    : 'bg-background'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{payment.deceased}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {payment.client} · <span className="font-mono">{payment.code}</span>
                                            </p>
                                        </div>

                                        <div className="text-right ml-3 shrink-0">
                                            <p className="font-bold text-sm">{formatPrice(payment.balance)}</p>
                                            <p className={`text-xs ${
                                                payment.is_overdue
                                                    ? 'text-destructive font-medium'
                                                    : payment.is_urgent
                                                        ? 'text-amber-500 font-medium'
                                                        : 'text-muted-foreground'
                                            }`}>
                                                {dueLabel(payment)}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* PANEL DE ACCIÓN RÁPIDA (franja delgada) */}
                {(alerts.pending_services > 0 || alerts.low_stock_items > 0 || alerts.seremi_critical > 0) && (
                    <Card className="gap-0 border-amber-500/50 bg-amber-500/5 py-3">
                        <CardContent className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-semibold">Acciones pendientes</span>
                            {alerts.seremi_critical > 0 && (
                                <Link href="/inventory">
                                    <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700 text-white">
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
                                    <Button size="sm" variant="outline" className="gap-2 border-amber-500 text-amber-500">
                                        <Package className="h-4 w-4" />
                                        {alerts.low_stock_items} Item(s) con Stock Bajo
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* GRÁFICO DE INGRESOS (ancho completo, más bajo) */}
                <Card className="gap-2 py-4">
                    <CardHeader className="pb-0">
                        <CardTitle className="text-base">Ingresos Últimos 6 Meses</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[220px]">
                        {chart_data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chart_data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={formatAxisTick}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => [formatPrice(value), 'Ingresos']}
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#10b981' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No hay datos de ingresos para mostrar
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ALERTAS Y PRÓXIMOS SERVICIOS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Stock Crítico */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" /> Alertas de Stock
                            </CardTitle>
                            <CardDescription>Productos por debajo del mínimo</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {low_stock.length > 0 ? (
                                <div className="space-y-3">
                                    {low_stock.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center p-2 border rounded-lg bg-destructive/5">
                                            <div>
                                                <p className="font-medium text-sm">{item.name}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{item.code}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-destructive">{item.stock} un.</p>
                                                <p className="text-xs text-muted-foreground">Mín: {item.stock_minimum}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <Link href="/inventory" className="block text-center text-sm text-primary hover:underline mt-2">
                                        Ver todo el inventario
                                    </Link>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground text-center py-4">
                                    Todo el inventario está en niveles óptimos
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Próximos Servicios */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" /> Próximos Servicios
                                </CardTitle>
                                <Badge variant={upcoming_services.length > 0 ? 'default' : 'secondary'}>
                                    {upcoming_services.length}
                                </Badge>
                            </div>
                            <CardDescription>
                                Programados desde mañana y durante los próximos 7 días
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {upcoming_services.length === 0 ? (
                                <div className="text-center py-8">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-500/50 mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">Sin servicios programados para los próximos días.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {upcoming_services.map((service) => (
                                        <Link
                                            key={service.id}
                                            href={`/services/${service.id}`}
                                            className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-bold text-sm truncate">{service.deceased}</p>
                                                        <Badge
                                                            variant={service.status === 'accepted' ? 'default' : 'secondary'}
                                                            className="text-xs shrink-0"
                                                        >
                                                            {service.status_label}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground truncate">{service.client}</p>
                                                </div>
                                                <div className="text-right ml-3 shrink-0">
                                                    <p className="font-bold text-primary">{service.scheduled_time}</p>
                                                    <p className="text-xs text-muted-foreground">{service.scheduled_date}</p>
                                                </div>
                                            </div>

                                            {(service.origin_location || service.destination_location) && (
                                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
                                                    {service.origin_location && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <span className="font-medium">📍</span> {service.origin_location}
                                                        </span>
                                                    )}
                                                    {service.destination_location && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <span className="font-medium">→</span> {service.destination_location}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {service.vehicles && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    🚗 Vehículo: {service.vehicles}
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                                <span className="text-xs font-mono text-muted-foreground">{service.code}</span>
                                                <span className="text-xs text-primary font-medium">{service.service_type}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* CALENDARIO DE SERVICIOS */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" /> Calendario de Servicios
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