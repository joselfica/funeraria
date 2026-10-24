import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Activity, DollarSign, AlertTriangle, Calendar, Truck } from 'lucide-react';
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

interface Props {
    kpis: Kpis;
    chart_data: ChartData[];
    low_stock: LowStockItem[];
    upcoming_services: UpcomingService[];
    fleet_status: FleetStatus;
}

// ──────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ──────────────────────────────────────────────────────────────
export default function Dashboard({ kpis, chart_data, low_stock, upcoming_services, fleet_status }: Props) {

    const formatPrice = (value: number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('es-CL', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

    return (
        <AppLayout>
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
                                            tickFormatter={(value) => `$${value / 1000}k`}
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

            </div>
        </AppLayout>
    );
}