import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { AlertTriangle, CheckSquare, Plus, Eye } from 'lucide-react';
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

    const formatDate = (date: string) => new Date(date).toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

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
        if (p >= 100) return 'text-emerald-600';
        if (p >= 90) return 'text-green-500';
        if (p >= 50) return 'text-yellow-500';
        if (p >= 25) return 'text-orange-500';
        return 'text-red-500';
    };

    const formatPrice = (price: string) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(parseFloat(price));

    const renderPayment = (service: Service) => {
        const { percentage, balance } = getPayment(service);
        return (
            <div className="space-y-1 w-full">
                <div className="flex items-center justify-between gap-2 text-xs">
                    <span className={`flex items-center gap-1 font-bold ${getPaymentText(percentage)}`}>
                        {percentage >= 100 ? <CheckSquare className="h-3.5 w-3.5" /> : percentage > 0 ? <AlertTriangle className="h-3.5 w-3.5" /> : <span className="inline-block h-3 w-3 rounded-full bg-red-500" />}
                        {percentage.toFixed(percentage % 1 === 0 ? 0 : 1)}%
                    </span>
                    <span className="text-muted-foreground">{percentage >= 100 ? 'Pagado' : `Saldo: ${formatPrice(String(balance))}`}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className={`h-full ${getPaymentBar(percentage)}`} style={{ width: `${percentage}%` }} />
                </div>
            </div>
        );
    };

    const renderActions = (service: Service) => (
        <div className="flex flex-col items-end gap-1.5">
            {service.status === 'pending' && (
                <Link href={`/services/${service.id}`} className="w-full">
                    <Button size="sm" className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                        Aprobar
                    </Button>
                </Link>
            )}
            {service.balance > 0 && service.status === 'accepted' && (
                <Link href={`/services/${service.id}`} className="w-full">
                    <Button size="sm" className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white">
                        Cobrar
                    </Button>
                </Link>
            )}
            <Link href={`/services/${service.id}`} className="w-full">
                <Button variant="outline" size="sm" className="w-full h-8">
                    <Eye className="h-4 w-4 mr-1" /> Ver
                </Button>
            </Link>
        </div>
    );

    const getStatusBadge = (service: Service) => {
        const variant = service.status === 'accepted' || service.status === 'completed' ? 'default' :
                        service.status === 'cancelled' || service.status === 'rejected' ? 'destructive' :
                        service.status === 'pending' ? 'secondary' : 'outline';
        return <Badge variant={variant} className="w-fit">{service.status_label || 'Sin estado'}</Badge>;
    };

    return (
        <>
            <Head title="Servicios Funerarios" />

            <div className="p-4 md:p-6 max-w-7xl mx-auto pb-24">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">Servicios Funerarios</h1>
                        <p className="mt-1 text-sm md:text-base text-muted-foreground">Total: {services.total} servicios registrados</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Link href="/services/wizard" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto bg-rose-800 hover:bg-rose-900 text-white shadow-md">
                                <Plus className="h-4 w-4 mr-1" /> Nuevo Expediente Completo
                            </Button>
                        </Link>
                        <Link href="/services/create" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:w-auto">Nuevo Servicio (Solo)</Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="mb-6 flex flex-col sm:flex-row gap-2 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl">
                    <Input placeholder="Buscar por código, cliente o fallecido..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:max-w-md bg-white dark:bg-slate-950" />
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 w-full rounded-md border border-input bg-white dark:bg-slate-950 px-3 text-sm sm:w-auto">
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

                {/* VISTA MÓVIL */}
                <div className="space-y-3 md:hidden">
                    {services.data.length === 0 ? (
                        <p className="rounded-lg border bg-card py-8 text-center text-muted-foreground">No hay servicios registrados</p>
                    ) : (
                        services.data.map((service) => (
                            <div key={service.id} className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="font-mono text-sm font-bold">{service.code}</span>
                                    {getStatusBadge(service)}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-100">{service.client?.name || 'Sin cliente'}</p>
                                    <p className="text-sm text-muted-foreground">{service.deceased?.full_name || 'Sin fallecido'} · {service.service_type?.name || 'Sin tipo'}</p>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{formatDate(service.scheduled_at)}</span>
                                    <span className="font-bold">{formatPrice(service.total_price)}</span>
                                </div>
                                {renderPayment(service)}
                                <div className="flex flex-wrap justify-end gap-2 border-t pt-3">{renderActions(service)}</div>
                            </div>
                        ))
                    )}
                </div>

                {/* VISTA DESKTOP */}
                <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-sm md:block">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/40">
                            <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Fallecido</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Programado</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead className="min-w-[180px]">Estado de Pago</TableHead>
                                <TableHead>Estado Servicio</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.data.length === 0 ? (
                                <TableRow><TableCell colSpan={9} className="py-12 text-center text-muted-foreground">No hay servicios registrados</TableCell></TableRow>
                            ) : (
                                services.data.map((service) => (
                                    <TableRow key={service.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                        <TableCell className="font-mono text-sm">{service.code}</TableCell>
                                        <TableCell className="font-medium">{service.client?.name || 'Sin cliente'}</TableCell>
                                        <TableCell>{service.deceased?.full_name || 'Sin fallecido'}</TableCell>
                                        <TableCell>{service.service_type?.name || 'Sin tipo'}</TableCell>
                                        <TableCell className="text-sm">{formatDate(service.scheduled_at)}</TableCell>
                                        <TableCell className="font-medium">{formatPrice(service.total_price)}</TableCell>
                                        <TableCell>{renderPayment(service)}</TableCell>
                                        <TableCell>{getStatusBadge(service)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right">{renderActions(service)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {services.last_page > 1 && (
                    <div className="mt-6 flex flex-wrap justify-center gap-1">
                        {services.links.map((link, i) => (
                            <Link key={i} href={link.url || '#'} className={`rounded-lg border px-3 py-1 text-sm ${link.active ? 'bg-rose-800 text-white border-rose-800' : link.url ? 'hover:bg-slate-100 dark:hover:bg-slate-800' : 'opacity-50'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>

            <Link href="/services/wizard" className="fixed bottom-6 right-6 z-10 md:hidden">
                <Button className="h-14 w-14 rounded-full bg-rose-800 p-0 text-white shadow-lg hover:bg-rose-900">
                    <Plus className="h-6 w-6" />
                </Button>
            </Link>
        </>
    );
}