import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { AlertTriangle, CheckSquare, Plus, Eye } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Service {
    id: number;
    uuid: string;
    code: string;
    status: string;
    status_label: string;
    scheduled_at: string;
    ends_at: string | null;
    total_price: string;
    total_paid: number;
    balance: number;
    client: { id: number; name: string; rut: string } | null;
    deceased: { id: number; full_name: string } | null;
    service_type: { id: number; name: string } | null;
}

interface Props {
    services: {
        data: Service[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        search: string;
        status: string;
    };
}

export default function ServicesIndex({ services, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/services', { search, status }, { preserveState: true });
    };

    const handleDelete = (service: Service) => {
        if (confirm(`¿Estás seguro de eliminar el servicio ${service.code}?`)) {
            router.delete(`/services/${service.id}`);
        }
    };

    const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case 'accepted': return 'default';
            case 'pending': return 'secondary';
            case 'in_review': return 'outline';
            case 'rejected': return 'destructive';
            case 'completed': return 'default';
            case 'cancelled': return 'destructive';
            default: return 'secondary';
        }
    };

    const formatDate = (date: string) => 
        new Date(date).toLocaleDateString('es-CL', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });

    // Datos de pago: porcentaje (tope 100%), saldo y color según avance
    const getPayment = (service: Service) => {
        const total = parseFloat(service.total_price) || 0;
        const paid = Number(service.total_paid) || 0;
        const percentage = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
        const balance = Math.max(total - paid, 0);
        return { total, paid, percentage, balance };
    };

    const getPaymentBar = (p: number) => {
        if (p >= 100) return 'bg-emerald-500';
        if (p >= 90) return 'bg-green-400';
        if (p >= 50) return 'bg-yellow-400';
        if (p >= 25) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getPaymentText = (p: number) => {
        if (p >= 100) return 'text-emerald-500';
        if (p >= 90) return 'text-green-400';
        if (p >= 50) return 'text-yellow-400';
        if (p >= 25) return 'text-orange-500';
        return 'text-red-500';
    };

    const formatPrice = (price: string) => 
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })
            .format(parseFloat(price));

    const renderPayment = (service: Service) => {
        const { percentage, balance } = getPayment(service);
        return (
            <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                    <span className={`flex items-center gap-1 font-bold ${getPaymentText(percentage)}`}>
                        {percentage >= 100 ? (
                            <CheckSquare className="h-3.5 w-3.5" />
                        ) : percentage > 0 ? (
                            <AlertTriangle className="h-3.5 w-3.5" />
                        ) : (
                            <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
                        )}
                        {percentage.toFixed(percentage % 1 === 0 ? 0 : 1)}%
                    </span>
                    <span className="text-muted-foreground">
                        {percentage >= 100 ? 'Pagado' : `Saldo: ${formatPrice(String(balance))}`}
                    </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={`h-full ${getPaymentBar(percentage)}`} style={{ width: `${percentage}%` }} />
                </div>
            </div>
        );
    };

    const renderActions = (service: Service) => (
        <div className="flex items-center justify-end gap-2">
            {service.status === 'pending' && (
                <Link href={`/services/${service.id}`}>
                    <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                        Aprobar
                    </Button>
                </Link>
            )}
            {service.balance > 0 && service.status === 'accepted' && (
                <Link href={`/services/${service.id}`}>
                    <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white">
                        Cobrar
                    </Button>
                </Link>
            )}
            <Link href={`/services/${service.id}`}>
                <Button variant="outline" size="sm" className="h-8">
                    <Eye className="h-4 w-4 mr-1" /> Ver
                </Button>
            </Link>
        </div>
    );

    return (
        <AppLayout>
            <Head title="Servicios Funerarios" />

            <div className="p-4 pb-24 sm:p-6">
                {/* Encabezado */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold sm:text-3xl">Servicios Funerarios</h1>
                        <p className="mt-1 text-muted-foreground">
                            Total: {services.total} servicios registrados
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/services/wizard">
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                + Nuevo Expediente Completo
                            </Button>
                        </Link>
                        <Link href="/services/create">
                            <Button variant="outline">Nuevo Servicio (Solo)</Button>
                        </Link>
                    </div>
                </div>

                {/* Búsqueda */}
                <form onSubmit={handleSearch} className="mb-4 flex flex-col gap-2 sm:flex-row">
                    <Input
                        placeholder="Buscar por código, cliente o fallecido..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:max-w-md"
                    />
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm sm:w-auto"
                    >
                        <option value="">Todos los estados</option>
                        <option value="pending">Pendiente</option>
                        <option value="in_review">En revisión</option>
                        <option value="accepted">Aceptada</option>
                        <option value="rejected">Rechazada</option>
                        <option value="in_progress">En ejecución</option>
                        <option value="completed">Completada</option>
                        <option value="cancelled">Cancelada</option>
                    </select>
                    <Button type="submit" variant="secondary" className="w-full sm:w-auto">Buscar</Button>
                </form>

                {/* MÓVIL: tarjetas */}
                <div className="space-y-3 md:hidden">
                    {services.data.length === 0 ? (
                        <p className="rounded-lg border bg-card py-8 text-center text-muted-foreground">
                            No hay servicios registrados
                        </p>
                    ) : (
                        services.data.map((service) => (
                            <div key={service.id} className="space-y-3 rounded-lg border bg-card p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="font-mono text-sm">{service.code}</span>
                                    <Badge 
                                        variant={
                                            service.status === 'accepted' ? 'default' :
                                            service.status === 'pending' ? 'secondary' :
                                            service.status === 'completed' ? 'default' :
                                            service.status === 'cancelled' ? 'destructive' :
                                            service.status === 'rejected' ? 'destructive' :
                                            'outline'
                                        }
                                        className="w-fit"
                                    >
                                        {service.status_label || 'Sin estado'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="font-medium">{service.client?.name || 'Sin cliente'}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {service.deceased?.full_name || 'Sin fallecido'} · {service.service_type?.name || 'Sin tipo'}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{formatDate(service.scheduled_at)}</span>
                                    <span className="font-medium">{formatPrice(service.total_price)}</span>
                                </div>
                                {renderPayment(service)}
                                <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
                                    {renderActions(service)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* ESCRITORIO: tabla */}
                <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Fallecido</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Programado</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Estado de Pago</TableHead>
                                <TableHead>Estado Servicio</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                                        No hay servicios registrados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                services.data.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-mono text-sm">{service.code}</TableCell>
                                        <TableCell className="font-medium">{service.client?.name || 'Sin cliente'}</TableCell>
                                        <TableCell>{service.deceased?.full_name || 'Sin fallecido'}</TableCell>
                                        <TableCell>{service.service_type?.name || 'Sin tipo'}</TableCell>
                                        <TableCell className="text-sm">{formatDate(service.scheduled_at)}</TableCell>
                                        <TableCell className="font-medium">{formatPrice(service.total_price)}</TableCell>
                                        <TableCell className="min-w-[200px]">{renderPayment(service)}</TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={
                                                    service.status === 'accepted' ? 'default' :
                                                    service.status === 'pending' ? 'secondary' :
                                                    service.status === 'completed' ? 'default' :
                                                    service.status === 'cancelled' ? 'destructive' :
                                                    service.status === 'rejected' ? 'destructive' :
                                                    'outline'
                                                }
                                                className="w-fit"
                                            >
                                                {service.status_label || 'Sin estado'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-right">
                                            {renderActions(service)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {services.last_page > 1 && (
                    <div className="mt-4 flex flex-wrap justify-center gap-1">
                        {services.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`rounded border px-3 py-1 text-sm ${
                                    link.active ? 'bg-primary text-primary-foreground' : link.url ? 'hover:bg-accent' : 'opacity-50'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Botón flotante (solo ícono en móvil) */}
            <Link href="/services/wizard" className="fixed bottom-6 right-6 z-10">
                <Button className="h-12 rounded-full bg-emerald-600 px-4 text-white shadow-lg hover:bg-emerald-700 sm:px-5">
                    <Plus className="h-5 w-5 sm:mr-2" />
                    <span className="hidden sm:inline">Nuevo Servicio</span>
                </Button>
            </Link>
        </AppLayout>
    );
}