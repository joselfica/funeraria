import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    const formatPrice = (value: number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <Head title={client.name} />

            <div className="mx-auto w-full max-w-4xl space-y-3 p-4">
                {/* ENCABEZADO */}
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="truncate text-2xl font-bold">{client.name}</h1>
                        <p className="font-mono text-xs text-muted-foreground">
                            {client.uuid}
                        </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <Link href="/clients">
                            <Button variant="outline" size="sm">Volver</Button>
                        </Link>
                        <Link href={`/clients/${client.id}/edit`}>
                            <Button size="sm">Editar</Button>
                        </Link>
                    </div>
                </div>

                {/* INFORMACIÓN DEL CLIENTE (en dos columnas) */}
                <Card className="gap-2 py-4">
                    <CardHeader className="flex flex-row items-center justify-between pb-0">
                        <CardTitle className="text-base">Información del Cliente</CardTitle>
                        <Badge
                            variant={client.is_active ? 'default' : 'secondary'}
                        >
                            {client.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                            <div>
                                <dt className="text-xs text-muted-foreground">RUT</dt>
                                <dd className="font-mono">{client.rut}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted-foreground">Nombre</dt>
                                <dd className="font-medium">{client.name}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted-foreground">Email</dt>
                                <dd className="truncate">{client.email || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted-foreground">Teléfono</dt>
                                <dd>{client.phone || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted-foreground">Dirección</dt>
                                <dd>{client.address || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted-foreground">Notas</dt>
                                <dd>{client.notes || '—'}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {/* ────────────────────────────────────────────────────────── */}
                {/* RESUMEN DE SERVICIOS                                     */}
                {/* ────────────────────────────────────────────────────────── */}
                {stats.total_services > 0 && (
                    <Card className="gap-2 py-4">
                        <CardHeader className="pb-0">
                            <CardTitle className="flex items-center gap-2 text-base">
                                📊 Resumen del Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                <div>
                                    <p className="text-xs uppercase text-muted-foreground">Total Servicios</p>
                                    <p className="text-xl font-bold">{stats.total_services}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase text-muted-foreground">Facturado</p>
                                    <p className="text-xl font-bold">{formatPrice(stats.total_billed)}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase text-muted-foreground">Pagado</p>
                                    <p className="text-xl font-bold text-emerald-600">{formatPrice(stats.total_paid)}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase text-muted-foreground">Saldo Pendiente</p>
                                    <p className={`text-xl font-bold ${stats.total_pending > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                                        {formatPrice(stats.total_pending)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ────────────────────────────────────────────────────────── */}
                {/* HISTORIAL DE SERVICIOS                                   */}
                {/* ────────────────────────────────────────────────────────── */}
                <Card className="gap-2 py-4">
                    <CardHeader className="pb-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                                📋 Historial de Servicios
                            </CardTitle>
                            <Badge variant="secondary">{services.length}</Badge>
                        </div>
                        <CardDescription>
                            Servicios contratados por este cliente
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {services.length === 0 ? (
                            <div className="py-4 text-center">
                                <p className="text-sm text-muted-foreground">Este cliente aún no tiene servicios registrados.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {services.map((service) => (
                                    <Link
                                        key={service.id}
                                        href={`/services/${service.id}`}
                                        className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate text-sm font-bold">{service.deceased}</p>
                                                    <Badge
                                                        variant={service.status === 'accepted' ? 'default' : 'secondary'}
                                                        className="shrink-0 text-xs"
                                                    >
                                                        {service.status_label}
                                                    </Badge>
                                                </div>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {service.service_type} · {service.branch || 'Sin sucursal'} ·{' '}
                                                    <span className="font-mono">{service.code}</span>
                                                </p>
                                            </div>
                                            <p className="shrink-0 text-sm font-bold text-primary">{service.scheduled_date}</p>
                                        </div>

                                        <div className="mt-2 grid grid-cols-3 gap-2 border-t pt-2 text-xs">
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground">Total</span>
                                                <span className="text-sm font-medium">{formatPrice(service.total_price)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground">Pagado</span>
                                                <span className="text-sm font-medium text-emerald-600">{formatPrice(service.total_paid)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground">Saldo</span>
                                                <span className={`text-sm font-medium ${service.is_fully_paid ? 'text-emerald-600' : 'text-destructive'}`}>
                                                    {service.is_fully_paid ? '✓ Pagado' : formatPrice(service.balance)}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* METADATOS (línea discreta en vez de tarjeta) */}
                <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 px-1 text-xs text-muted-foreground">
                    <span>Creado: {formatDate(client.created_at)}</span>
                    <span>Última actualización: {formatDate(client.updated_at)}</span>
                </div>
            </div>
        </>
    );
}