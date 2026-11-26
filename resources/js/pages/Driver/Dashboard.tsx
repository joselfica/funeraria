import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Calendar, Clock, MapPin, User, Phone,
    CheckCircle2, Sun, ArrowRight
} from 'lucide-react';

interface Service {
    id: number;
    uuid: string;
    code: string;
    scheduled_at: string;
    /** Momento del sepelio (ataúd) o de la cremación (urna). */
    event_at: string | null;
    event_type: 'sepelio' | 'cremacion';
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
}

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────

/** Fecha del hito que importa al chofer (sepelio o cremación). */
const eventDate = (s: Service) => new Date(s.event_at ?? s.scheduled_at);

const eventLabel = (s: Service) => (s.event_type === 'cremacion' ? 'Cremación' : 'Sepelio');

const formatTime = (d: Date) =>
    d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });

const formatMonth = (d: Date) =>
    d.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '');

const formatWeekday = (d: Date) => {
    const text = d.toLocaleDateString('es-CL', { weekday: 'long' });
    return text.charAt(0).toUpperCase() + text.slice(1);
};

/** Días calendario entre hoy y la fecha dada (0 = hoy, 1 = mañana). */
const daysUntil = (d: Date): number => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const target = new Date(d);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - start.getTime()) / 86_400_000);
};

const relativeLabel = (days: number): string => {
    if (days <= 0) return 'Hoy';
    if (days === 1) return 'Mañana';
    return `En ${days} días`;
};

export default function DriverDashboard({ todayServices, upcomingServices }: Props) {
    const { auth } = usePage<{ auth: { user: { name: string } } }>().props;
    const userName = auth.user?.name || 'Chofer';

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
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">No tienes sepelios ni cremaciones asignados para hoy.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {todayServices.map((service) => (
                                <Card key={service.id} className="gap-0 py-0 shadow-sm border-l-4 border-l-rose-800 hover:shadow-md transition-shadow">
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
                                                    <p className="text-2xl font-bold text-rose-800 dark:text-rose-500">{formatTime(eventDate(service))}</p>
                                                    <p className="text-xs text-muted-foreground">{eventLabel(service)}</p>
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
                                <p className="text-sm">No tienes sepelios ni cremaciones programados para los próximos días.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {upcomingServices.map((service) => {
                                const date = eventDate(service);
                                const days = daysUntil(date);
                                const isTomorrow = days === 1;

                                return (
                                    <Link key={service.id} href={`/driver/services/${service.uuid}`} className="block h-full">
                                        <Card className="gap-0 py-0 h-full shadow-sm transition-all hover:border-rose-300 hover:shadow-md">
                                            <CardContent className="flex items-stretch gap-4 p-4">
                                                {/* Fecha */}
                                                <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-rose-50 py-2 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                                                    <span className="text-2xl font-bold leading-none">{date.getDate()}</span>
                                                    <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide">{formatMonth(date)}</span>
                                                </div>

                                                {/* Detalle */}
                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="truncate font-mono text-[10px] text-muted-foreground">{service.code}</span>
                                                        <Badge
                                                            variant={isTomorrow ? 'default' : 'outline'}
                                                            className={`shrink-0 text-[10px] ${isTomorrow ? 'bg-rose-800 text-white' : ''}`}
                                                        >
                                                            {relativeLabel(days)}
                                                        </Badge>
                                                    </div>
                                                    <p className="truncate font-bold text-slate-800 dark:text-slate-100">
                                                        {service.deceased.full_name}
                                                    </p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {eventLabel(service)} · {service.client.name}
                                                    </p>
                                                    <div className="flex items-center justify-between border-t pt-2 mt-2">
                                                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Clock className="h-3 w-3" />
                                                            {formatWeekday(date)} · <strong className="text-foreground">{formatTime(date)}</strong>
                                                        </span>
                                                        <ArrowRight className="h-4 w-4 text-rose-800" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </>
    );
}