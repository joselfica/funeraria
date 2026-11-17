import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Activity, ClipboardList, CheckCircle2 } from 'lucide-react';

interface Client {
    id: number;
    uuid: string;
    rut: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface ClientService {
    id: number;
    uuid: string;
    code: string;
    scheduled_at: string;
    scheduled_date: string;
    status: string;
    status_label: string;
    deceased: string | null;
    service_type: string | null;
    branch: string | null;
    total_price: number;
    total_paid: number;
    balance: number;
    is_fully_paid: boolean;
}

interface Stats {
    total_services: number;
    total_billed: number;
    total_paid: number;
    total_pending: number;
}

interface Props {
    client: Client;
    services: ClientService[];
    stats: Stats;
}

export default function ClientsShow({ client, services, stats }: Props) {
    const formatPrice = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
    const formatDate = (date: string) => new Date(date).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <>
            <Head title={client.name} />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-6">
                {/* ENCABEZADO */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <Link href="/clients">
                            <Button variant="outline" size="icon" className="shrink-0 mt-1"><ArrowLeft className="h-4 w-4" /></Button>
                        </Link>
                        <div className="min-w-0">
                            <h1 className="truncate text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">{client.name}</h1>
                            <p className="font-mono text-xs text-muted-foreground mt-1">{client.uuid}</p>
                        </div>
                    </div>
                    <Link href={`/clients/${client.id}/edit`} className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-rose-800 hover:bg-rose-900 text-white shadow-md">
                            <Pencil className="h-4 w-4 mr-2" /> Editar
                        </Button>
                    </Link>
                </div>

                {/* INFORMACIÓN DEL CLIENTE */}
                <Card className="shadow-sm border-t-4 border-t-rose-800/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-3 bg-slate-50 dark:bg-slate-900/40">
                        <CardTitle className="text-base">Información del Cliente</CardTitle>
                        <Badge className={client.is_active ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600'}>
                            {client.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                            <div><dt className="text-xs text-muted-foreground">RUT</dt><dd className="font-mono font-medium">{client.rut}</dd></div>
                            <div><dt className="text-xs text-muted-foreground">Nombre</dt><dd className="font-medium">{client.name}</dd></div>
                            <div><dt className="text-xs text-muted-foreground">Email</dt><dd className="truncate">{client.email || '—'}</dd></div>
                            <div><dt className="text-xs text-muted-foreground">Teléfono</dt><dd>{client.phone || '—'}</dd></div>
                            <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Dirección</dt><dd>{client.address || '—'}</dd></div>
                            <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Notas</dt><dd className="whitespace-pre-line">{client.notes || '—'}</dd></div>
                        </dl>
                    </CardContent>
                </Card>

                {/* RESUMEN DE SERVICIOS */}
                {stats.total_services > 0 && (
                    <Card className="shadow-sm">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/40 pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Activity className="h-5 w-5 text-rose-800" /> Resumen del Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                    <p className="text-xs uppercase font-semibold text-muted-foreground">Total Servicios</p>
                                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.total_services}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                    <p className="text-xs uppercase font-semibold text-muted-foreground">Facturado</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">{formatPrice(stats.total_billed)}</p>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900">
                                    <p className="text-xs uppercase font-semibold text-emerald-700 dark:text-emerald-400">Pagado</p>
                                    <p className="text-lg font-bold text-emerald-600 mt-1">{formatPrice(stats.total_paid)}</p>
                                </div>
                                <div className={`p-3 rounded-lg border ${stats.total_pending > 0 ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200'}`}>
                                    <p className={`text-xs uppercase font-semibold ${stats.total_pending > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-muted-foreground'}`}>Saldo Pendiente</p>
                                    <p className={`text-lg font-bold mt-1 ${stats.total_pending > 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>{formatPrice(stats.total_pending)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* HISTORIAL DE SERVICIOS */}
                <Card className="shadow-sm">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/40 pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ClipboardList className="h-5 w-5 text-rose-800" /> Historial de Servicios
                            </CardTitle>
                            <Badge variant="secondary">{services.length}</Badge>
                        </div>
                        <CardDescription>Servicios contratados por este cliente</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {services.length === 0 ? (
                            <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/30 rounded-lg">
                                <p className="text-sm text-muted-foreground">Este cliente aún no tiene servicios registrados.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {services.map((service) => (
                                    <Link key={service.id} href={`/services/${service.uuid}`} className="block rounded-xl border p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:border-rose-200 dark:hover:border-rose-900">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{service.deceased}</p>
                                                    <Badge className={service.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                                                        {service.status_label}
                                                    </Badge>
                                                </div>
                                                <p className="truncate text-xs text-muted-foreground mt-1">
                                                    {service.service_type} · {service.branch || 'Sin sucursal'} · <span className="font-mono">{service.code}</span>
                                                </p>
                                            </div>
                                            <p className="shrink-0 text-sm font-bold text-rose-800 bg-rose-50 dark:bg-rose-950/30 px-2 py-1 rounded">{service.scheduled_date}</p>
                                        </div>

                                        <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-xs">
                                            <div className="flex flex-col"><span className="text-muted-foreground">Total</span><span className="text-sm font-medium">{formatPrice(service.total_price)}</span></div>
                                            <div className="flex flex-col"><span className="text-muted-foreground">Pagado</span><span className="text-sm font-medium text-emerald-600">{formatPrice(service.total_paid)}</span></div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground">Saldo</span>
                                                <span className={`text-sm font-medium flex items-center gap-1 ${service.is_fully_paid ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {service.is_fully_paid && <CheckCircle2 className="h-3 w-3" />}
                                                    {service.is_fully_paid ? 'Pagado' : formatPrice(service.balance)}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 px-1 text-xs text-muted-foreground pb-4">
                    <span>Creado: {formatDate(client.created_at)}</span>
                    <span>Última actualización: {formatDate(client.updated_at)}</span>
                </div>
            </div>
        </>
    );
}