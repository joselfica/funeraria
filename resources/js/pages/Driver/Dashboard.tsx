import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Calendar, MapPin, Clock, Package, User, 
    CheckCircle2, AlertTriangle, Sun, ArrowRight, Phone
} from 'lucide-react';

interface Service {
    id: number;
    code: string;
    scheduled_at: string;
    status: string;
    status_label: string;
    client: { name: string; phone: string | null };
    deceased: { full_name: string };
    service_type: { name: string };
    branch: { name: string; address: string } | null;
}

interface Props {
    todayServices: Service[];
    upcomingServices: Service[];
    lowStockItems: Array<{ id: number; code: string; name: string; stock: number; stock_minimum: number }>;
}

export default function DriverDashboard({ todayServices, upcomingServices, lowStockItems }: Props) {
    const { auth } = usePage<{ auth: { user: { name: string } } }>().props;
    const userName = auth.user?.name || 'Chofer';
    
    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
    
    const formatTime = (date: string) =>
        new Date(date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    const today = new Date().toLocaleDateString('es-CL', { 
        weekday: 'long', day: 'numeric', month: 'long' 
    });
    const formattedToday = today.charAt(0).toUpperCase() + today.slice(1);

    return (
        <AppLayout>
            <Head title="Mi Itinerario - Chofer" />

            <div className="p-6 max-w-5xl mx-auto">
                
                {/* Saludo y Fecha */}
                <div className="mb-8 flex items-start gap-4">
                    <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500">
                        <Sun className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Hola, {userName.split(' ')[0]}</h1>
                        <p className="text-muted-foreground mt-1">{formattedToday}</p>
                    </div>
                </div>

                {/* Card Principal de Hoy */}
                <Card className="mb-6 border-t-4 border-t-primary shadow-md">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Clock className="h-5 w-5 text-primary" /> Tus servicios de hoy
                            </CardTitle>
                            <Badge variant={todayServices.length > 0 ? 'default' : 'secondary'} className="text-base px-3 py-1">
                                {todayServices.length} servicio(s)
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {todayServices.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircle2 className="h-16 w-16 text-emerald-500/50 mx-auto mb-4" />
                                <p className="text-lg font-medium">¡Todo tranquilo por hoy!</p>
                                <p className="text-muted-foreground">No tienes servicios asignados.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {todayServices.map((service) => (
                                    <div key={service.id} className="p-5 border-2 border-primary/20 rounded-xl bg-primary/5">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-mono text-sm text-muted-foreground">{service.code}</p>
                                                <p className="font-bold text-xl">{service.deceased.full_name}</p>
                                                <p className="text-sm text-primary font-medium">{service.service_type.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-primary">{formatTime(service.scheduled_at)}</p>
                                                <Badge variant="default">{service.status_label}</Badge>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
                                            <div className="flex items-center gap-2 p-2 bg-background rounded-lg">
                                                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <span>Cliente: <strong>{service.client.name}</strong></span>
                                            </div>
                                            {service.client.phone && (
                                                <a href={`tel:${service.client.phone}`} className="flex items-center gap-2 p-2 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500/20">
                                                    <Phone className="h-4 w-4 shrink-0" />
                                                    <span>Llamar: <strong>{service.client.phone}</strong></span>
                                                </a>
                                            )}
                                            {service.branch && (
                                                <div className="flex items-center gap-2 p-2 bg-background rounded-lg md:col-span-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <span>{service.branch.name} — {service.branch.address}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex justify-end mt-4">
                                            <Link href={`/services/${service.id}`}>
                                                <Button size="sm">
                                                    Ver Detalle <ArrowRight className="h-4 w-4 ml-2" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Próximos servicios */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" /> Próximos días
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {upcomingServices.length === 0 ? (
                                <p className="text-muted-foreground text-center py-6">Sin servicios programados.</p>
                            ) : (
                                <div className="space-y-2">
                                    {upcomingServices.map((service) => (
                                        <div key={service.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div>
                                                <p className="font-medium">{service.code}</p>
                                                <p className="text-sm text-muted-foreground">{service.deceased.full_name}</p>
                                                <p className="text-xs text-primary font-medium mt-1">{formatDate(service.scheduled_at)}</p>
                                            </div>
                                            <Link href={`/services/${service.id}`}>
                                                <Button size="sm" variant="outline">Ver</Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Bodega */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" /> Bodega — Alertas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {lowStockItems.length === 0 ? (
                                <div className="text-center py-6">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-500/50 mx-auto mb-2" />
                                    <p className="text-muted-foreground">Todo el inventario está en orden.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {lowStockItems.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center p-3 border-2 border-destructive/30 rounded-lg bg-destructive/5">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                                <p className="font-medium text-sm">{item.code}</p>
                                            </div>
                                            <span className="text-sm font-bold text-destructive">
                                                {item.stock} / {item.stock_minimum}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="mt-4">
                                <Link href="/inventory">
                                    <Button variant="outline" size="sm" className="w-full">
                                        Ver todo el inventario
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}