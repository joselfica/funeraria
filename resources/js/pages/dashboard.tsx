import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, FileText, Activity, DollarSign, AlertTriangle, Calendar, Truck, Package, Calendar as CalendarIcon } from 'lucide-react';
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
    client: { name: string };
    deceased: { full_name: string };
}

interface FleetStatus {
    total: number;
    available: number;
    in_service: number;
    maintenance: number;
}

interface Alerts {
    pending_services: number;
    unpaid_services: number;
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

interface Props {
    kpis: Kpis;
    chart_data: ChartData[];
    low_stock: LowStockItem[];
    upcoming_services: UpcomingService[];
    fleet_status: FleetStatus;
    alerts: Alerts;
    services: CalendarService[];
}

// ──────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ──────────────────────────────────────────────────────────────
export default function Dashboard({ kpis, chart_data, low_stock, upcoming_services, fleet_status, alerts, services }: Props) {

    const formatPrice = (value: number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('es-CL', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

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

                {/* KPI CARDS (4 tarjetas) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Activos</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpis.total_clients}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Servicios Activos</CardTitle>
                            <Activity className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpis.active_services}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos del Mes</CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-500">{formatPrice(kpis.monthly_revenue)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Registros Fallecidos</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpis.total_deceased}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* PANEL DE ACCIÓN RÁPIDA */}
                {(alerts.pending_services > 0 || alerts.unpaid_services > 0 || alerts.low_stock_items > 0 || alerts.seremi_critical > 0) && (
                    <Card className="border-amber-500/50 bg-amber-500/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Acciones Pendientes</CardTitle>
                        </CardHeader>
                        <CardContent className="flex gap-4 flex-wrap">
                            {alerts.seremi_critical > 0 && (
                                <Link href="/inventory">
                                    <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                                        <AlertTriangle className="h-4 w-4" />
                                        ALERTA SEREMI: {alerts.seremi_critical} urna(s) obligatoria(s) sin stock
                                    </Button>
                                </Link>
                            )}
                            {alerts.pending_services > 0 && (
                                <Link href="/services?status=pending">
                                    <Button variant="destructive" className="gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        {alerts.pending_services} Servicio(s) por Aprobar
                                    </Button>
                                </Link>
                            )}
                            {alerts.unpaid_services > 0 && (
                                <Link href="/services">
                                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                                        <DollarSign className="h-4 w-4" />
                                        {alerts.unpaid_services} Servicio(s) con Deuda
                                    </Button>
                                </Link>
                            )}
                            {alerts.low_stock_items > 0 && (
                                <Link href="/inventory">
                                    <Button variant="outline" className="gap-2 border-amber-500 text-amber-500">
                                        <Package className="h-4 w-4" />
                                        {alerts.low_stock_items} Item(s) con Stock Bajo
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* GRÁFICO Y FLOTA */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Gráfico de Ingresos (ocupa 2 columnas) */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Ingresos Últimos 6 Meses</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
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

                    {/* Estado de la Flota */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5" /> Estado de Flota
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-sm font-medium">Total Vehículos</span>
                                <span className="font-bold">{fleet_status.total}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Disponibles</span>
                                <span className="font-medium">{fleet_status.available}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> En Servicio</span>
                                <span className="font-medium">{fleet_status.in_service}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Mantenimiento</span>
                                <span className="font-medium">{fleet_status.maintenance}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

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
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-500" /> Próximos Servicios
                            </CardTitle>
                            <CardDescription>Programados para los próximos 7 días</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {upcoming_services.length > 0 ? (
                                <div className="space-y-3">
                                    {upcoming_services.map((service) => (
                                        <Link 
                                            key={service.id} 
                                            href={`/services/${service.id}`}
                                            className="flex justify-between items-center p-2 border rounded-lg hover:bg-accent transition-colors"
                                        >
                                            <div>
                                                <p className="font-medium text-sm">{service.code}</p>
                                                <p className="text-xs text-muted-foreground">{service.deceased.full_name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-blue-500">
                                                    {formatDate(service.scheduled_at)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{service.client.name}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground text-center py-4">
                                    No hay servicios programados
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