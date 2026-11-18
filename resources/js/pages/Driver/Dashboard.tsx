import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Calendar, Clock, MapPin, User, Phone, AlertTriangle, 
    CheckCircle2, Sun, ArrowRight, Package
} from 'lucide-react';

interface Service {
    id: number;
    uuid: string;
    code: string;
    scheduled_at: string;
    status: string;
    status_label: string;
    client: { name: string; phone: string | null };
    deceased: { full_name: string };
    branch: { name: string; address: string | null } | null;
    service_type_label: string;
}

interface Props {
    todayServices: Service[];
    upcomingServices: Service[];
    // 👇 CAMBIADO: available_stock y alert_threshold
    lowStockItems: Array<{ id: number; code: string; name: string; available_stock: number; alert_threshold: number }>;
}

export default function DriverDashboard({ todayServices, upcomingServices, lowStockItems }: Props) {
    const { auth } = usePage<{ auth: { user: { name: string } } }>().props;
    const userName = auth.user?.name || 'Chofer';
    
    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('es-CL', { weekday: 'long', day: '2-digit', month: 'long' });
    
    const formatTime = (date: string) =>
        new Date(date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    const today = new Date().toLocaleDateString('es-CL', { 
        weekday: 'long', day: 'numeric', month: 'long' 
    });

    return (
        <>
            <Head title="Mi Itinerario - Chofer" />

            <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
                
                {/* HERO / BIENVENIDA */}
                <div className="flex items-start gap-4 bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-950/40 dark:to-rose-900/20 p-6 rounded-2xl border border-rose-200 dark:border-rose-900">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-rose-800 shadow-sm shrink-0">
                        <Sun className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
                            Hola, {userName.split(' ')[0]}
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm md:text-base capitalize">
                            {today}
                        </p>
                    </div>
                </div>

                {/* SECCIÓN 1: SERVICIOS DE HOY */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-rose-800" /> Servicios de Hoy
                        </h2>
                        <Badge variant={todayServices.length > 0 ? 'default' : 'secondary'}>
                            {todayServices.length} servicio(s)
                        </Badge>
                    </div>

                    {todayServices.length === 0 ? (
                        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
                            <CardContent className="p-6 text-center">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                                <p className="text-lg font-medium text-emerald-800 dark:text-emerald-300">¡Todo tranquilo por hoy!</p>
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">No tienes servicios asignados para el día de hoy.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {todayServices.map((service) => (
                                <Card key={service.id} className="shadow-sm border-l-4 border-l-rose-800 hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            {/* Info del servicio */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono text-xs text-muted-foreground">{service.code}</span>
                                                    <Badge className="bg-rose-800 text-white text-[10px]">{service.status_label}</Badge>
                                                </div>
                                                <p className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate">
                                                    {service.deceased.full_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">{service.service_type_label}</p>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <User className="h-3 w-3" /> <span>Cliente: {service.client.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <MapPin className="h-3 w-3" /> <span>{service.branch?.name || 'Sin sucursal'}</span>
                                                    </div>
                                                    {service.client.phone && (
                                                        <a href={`tel:${service.client.phone}`} className="flex items-center gap-2 text-emerald-600 hover:underline">
                                                            <Phone className="h-3 w-3" /> Llamar: {service.client.phone}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Hora + Acción */}
                                            <div className="flex items-center gap-4 md:flex-col md:items-end justify-between border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-4">
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-rose-800 dark:text-rose-500">{formatTime(service.scheduled_at)}</p>
                                                    <p className="text-xs text-muted-foreground">Inicio</p>
                                                </div>
                                                <Link href={`/driver/services/${service.uuid}`}>
                                                    <Button size="sm" className="bg-rose-800 hover:bg-rose-900 text-white">
                                                        Ver Detalle <ArrowRight className="h-4 w-4 ml-1" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* SECCIÓN 2: PRÓXIMOS SERVICIOS */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-rose-800" /> Próximos Servicios
                        </h2>
                        <Badge variant="outline">
                            {upcomingServices.length} programado(s)
                        </Badge>
                    </div>

                    {upcomingServices.length === 0 ? (
                        <Card className="bg-slate-50 dark:bg-slate-900/40 border-dashed">
                            <CardContent className="p-6 text-center text-muted-foreground">
                                <Calendar className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                                <p className="text-sm">No tienes servicios programados para los próximos días.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {upcomingServices.map((service) => (
                                <Link key={service.id} href={`/driver/services/${service.uuid}`}>
                                    <Card className="shadow-sm hover:shadow-md hover:border-rose-300 transition-all h-full">
                                        <CardContent className="p-4 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <span className="font-mono text-[10px] text-muted-foreground">{service.code}</span>
                                                <Badge variant="outline" className="text-[10px] capitalize">
                                                    {formatDate(service.scheduled_at)}
                                                </Badge>
                                            </div>
                                            <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                                {service.deceased.full_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {service.client.name} · {service.service_type_label}
                                            </p>
                                            <div className="flex items-center justify-between pt-2 border-t mt-2">
                                                <span className="text-xs text-muted-foreground">Hora: <strong>{formatTime(service.scheduled_at)}</strong></span>
                                                <ArrowRight className="h-4 w-4 text-rose-800" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* SECCIÓN 3: ALERTAS DE STOCK */}
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500" /> Alertas de Bodega
                    </h2>
                    {lowStockItems.length === 0 ? (
                        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200">
                            <CardContent className="p-4 flex items-center gap-3">
                                <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                                <p className="text-sm text-emerald-800 dark:text-emerald-300">Todo el inventario está en orden. No hay insumos críticos.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {lowStockItems.map((item) => (
                                <Card key={item.id} className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                                    <CardContent className="p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Package className="h-4 w-4 text-amber-600 shrink-0" />
                                            <span className="text-sm font-medium truncate">{item.name}</span>
                                        </div>
                                        {/* 👇 Usamos available_stock y alert_threshold */}
                                        <span className="text-sm font-bold text-amber-700 dark:text-amber-400 shrink-0">
                                            {item.available_stock} / alerta {item.alert_threshold}
                                        </span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </>
    );
}