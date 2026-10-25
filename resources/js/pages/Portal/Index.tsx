import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, LogOut, Home } from 'lucide-react';

interface Service {
    id: number;
    uuid: string;
    code: string;
    status: string;
    status_label: string;
    scheduled_at: string;
    total_price: string;
    total_paid: number;
    balance: number;
    is_fully_paid: boolean;
    deceased_name: string;
    service_type: string;
}

interface Props {
    client: { name: string; rut: string; };
    services: Service[];
}

export default function PortalIndex({ client, services }: Props) {
    const formatPrice = (value: string | number) => 
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })
            .format(typeof value === 'string' ? parseFloat(value) : value);

    const formatDate = (date: string) => 
        new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <>
            <Head title="Mi Portal - Funeraria Cristo Rey" />

            <div className="min-h-screen bg-muted/10">
                
                {/* HEADER DEL PORTAL (Único) */}
                <header className="bg-primary text-primary-foreground py-6 px-4 sm:px-6 shadow-md">
                    <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <Home className="h-8 w-8" />
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold leading-tight">Portal del Cliente</h1>
                                <p className="text-primary-foreground/80 text-sm">Funeraria Cristo Rey</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="text-left sm:text-right">
                                <p className="font-medium text-sm sm:text-base">{client.name}</p>
                                <p className="text-xs text-primary-foreground/80">RUT: {client.rut}</p>
                            </div>
                            <Link href="/logout" method="post" as="button">
                                <Button variant="secondary" size="sm" className="shrink-0">
                                    <LogOut className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Salir</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* CONTENIDO */}
                <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
                    <div className="mb-6">
                        <h2 className="text-xl sm:text-2xl font-semibold">Mis Servicios</h2>
                        <p className="text-sm sm:text-base text-muted-foreground">Aquí puedes ver el estado de tus expedientes.</p>
                    </div>
                    
                    {services.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12 text-muted-foreground">
                                No tienes servicios registrados aún.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {services.map((service) => (
                                <Card key={service.id} className="overflow-hidden border-t-4 border-t-primary shadow-sm">
                                    
                                    {/* Cabecera de la tarjeta */}
                                    <CardHeader className="bg-muted/20 pb-4">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            <div>
                                                <CardTitle className="text-lg sm:text-xl flex flex-wrap items-center gap-2">
                                                    {service.code}
                                                    <Badge variant={service.status === 'accepted' ? 'default' : 'secondary'}>
                                                        {service.status_label}
                                                    </Badge>
                                                </CardTitle>
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    En memoria de: <strong className="text-foreground">{service.deceased_name}</strong>
                                                </p>
                                            </div>
                                            <div className="sm:text-right text-sm">
                                                <p className="font-medium text-primary">{service.service_type}</p>
                                                <p className="text-muted-foreground">{formatDate(service.scheduled_at)}</p>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    {/* Cuerpo de la tarjeta */}
                                    <CardContent className="pt-6">
                                        {/* Grid que en móvil se vuelve 1 columna, en desktop 3 */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                                            <div className="p-3 bg-muted/30 rounded-lg">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Total</p>
                                                <p className="text-base sm:text-lg font-bold">{formatPrice(service.total_price)}</p>
                                            </div>
                                            <div className="p-3 bg-emerald-500/10 rounded-lg">
                                                <p className="text-xs text-emerald-600/80 uppercase tracking-wider font-semibold mb-1">Pagado</p>
                                                <p className="text-base sm:text-lg font-bold text-emerald-500">{formatPrice(service.total_paid)}</p>
                                            </div>
                                            <div className={`p-3 rounded-lg ${service.is_fully_paid ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
                                                <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${service.is_fully_paid ? 'text-emerald-600/80' : 'text-destructive/80'}`}>Saldo</p>
                                                <p className={`text-base sm:text-lg font-bold ${service.is_fully_paid ? 'text-emerald-500' : 'text-destructive'}`}>
                                                    {formatPrice(service.balance)}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-end pt-4 border-t">
                                            <Link href={`/portal/servicio/${service.uuid}`} className="w-full sm:w-auto">
                                                <Button className="w-full sm:w-auto">
                                                    Ver Detalles <ArrowRight className="h-4 w-4 ml-2" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}