import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    ArrowLeft, Calendar, Clock, MapPin, User, Users, Phone, 
    AlertTriangle, CheckCircle2, FileText
} from 'lucide-react';

interface Client {
    id: number;
    name: string;
    rut: string;
    phone: string | null;
    email: string | null;
}

interface Deceased {
    id: number;
    full_name: string;
    rut: string | null;
    death_date: string;
}

interface Service {
    id: number;
    uuid: string;
    code: string;
    status: string;
    status_label: string;
    scheduled_at: string;
    ends_at: string | null;
    duration_hours: number;
    origin_location: string | null;
    destination_location: string | null;
    burial_at: string | null;
    client: Client | null;
    deceased: Deceased | null;
    branch: { name: string; address: string | null } | null;
    service_type_label: string;
}

interface Props {
    service: Service;
}

export default function DriverServiceShow({ service }: Props) {
    const formatDate = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('es-CL', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <>
            <Head title={`Servicio ${service.code}`} />

            <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex items-start gap-3">
                    <Link href="/dashboard">
                        <Button variant="outline" size="icon" className="shrink-0 mt-1">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
                            {service.code}
                        </h1>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant={service.status === 'accepted' ? 'default' : 'secondary'}>
                                {service.status_label}
                            </Badge>
                            <Badge variant="outline">{service.service_type_label}</Badge>
                        </div>
                    </div>
                </div>

                {/* Cliente */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/40">
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-5 w-5 text-rose-800" /> Cliente Contratante
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <p className="font-bold text-lg">{service.client?.name || 'Sin cliente'}</p>
                        <p className="text-sm text-muted-foreground">{service.client?.rut || '—'}</p>
                        {service.client?.phone && (
                            <a 
                                href={`tel:${service.client.phone}`} 
                                className="mt-2 inline-flex items-center gap-2 text-sm text-emerald-600 hover:underline"
                            >
                                <Phone className="h-4 w-4" /> {service.client.phone}
                            </a>
                        )}
                    </CardContent>
                </Card>

                {/* Fallecido */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/40">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-5 w-5 text-rose-800" /> Fallecido
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <p className="font-bold text-lg">{service.deceased?.full_name || 'Sin fallecido'}</p>
                        {service.deceased?.rut && (
                            <p className="text-sm text-muted-foreground">{service.deceased.rut}</p>
                        )}
                        <p className="text-sm mt-1 text-muted-foreground">
                            Fallecimiento: {formatDate(service.deceased?.death_date || null)}
                        </p>
                    </CardContent>
                </Card>

                {/* Programación */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/40">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-rose-800" /> Programación
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3 text-sm">
                        <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-muted-foreground text-xs">Inicio</p>
                                <p className="font-medium">{formatDate(service.scheduled_at)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-muted-foreground text-xs">Fin estimado</p>
                                <p className="font-medium">{formatDate(service.ends_at)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-muted-foreground text-xs">Lugar de origen</p>
                                <p className="font-medium">{service.origin_location || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-muted-foreground text-xs">Destino</p>
                                <p className="font-medium">{service.destination_location || '—'}</p>
                            </div>
                        </div>
                        {service.burial_at && (
                            <div className="flex items-start gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-muted-foreground text-xs">Entierro / Cremación</p>
                                    <p className="font-medium">{formatDate(service.burial_at)}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sucursal */}
                {service.branch && (
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/40">
                            <CardTitle className="text-base flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-rose-800" /> Sucursal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <p className="font-medium">{service.branch.name}</p>
                            {service.branch.address && (
                                <p className="text-sm text-muted-foreground">{service.branch.address}</p>
                            )}
                        </CardContent>
                    </Card>
                )}

            </div>
        </>
    );
}