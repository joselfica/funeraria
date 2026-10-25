import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { AlertTriangle, CheckSquare, Plus } from 'lucide-react';
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
    client: { id: number; name: string; rut: string };
    deceased: { id: number; full_name: string };
    service_type: { id: number; name: string };
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
        if (confirm(`¿Eliminar el servicio ${service.code}?`)) {
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

    return (
        <AppLayout>
            <Head title="Servicios Funerarios" />

            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Servicios Funerarios</h1>
                        <p className="text-muted-foreground mt-1">
                            Total: {services.total} servicios registrados
                        </p>
                    </div>
                    <div className="flex gap-2">
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

                <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                    <Input
                        placeholder="Buscar por código, cliente o fallecido..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-md"
                    />
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="rounded-md border border-input bg-transparent px-3 text-sm"
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
                    <Button type="submit" variant="secondary">Buscar</Button>
                </form>

                <div className="border rounded-lg overflow-hidden bg-card">
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
                                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                        No hay servicios registrados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                services.data.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-mono text-sm">
                                            {service.code}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {service.client.name}
                                        </TableCell>
                                        <TableCell>{service.deceased.full_name}</TableCell>
                                        <TableCell>{service.service_type.name}</TableCell>
                                        <TableCell className="text-sm">
                                            {formatDate(service.scheduled_at)}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {formatPrice(service.total_price)}
                                        </TableCell>
                                        <TableCell className="min-w-[200px]">
                                            {(() => {
                                                const { percentage, balance } = getPayment(service);
                                                return (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs">
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
                                                            <div
                                                                className={`h-full ${getPaymentBar(percentage)}`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(service.status)}>
                                                {service.status_label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {/* Acción rápida: Cobrar si debe plata */}
                                            {service.status === 'accepted' && parseFloat(service.total_price) > Number(service.total_paid) && (
                                                <Link href={`/services/${service.id}`}>
                                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                                                        Cobrar
                                                    </Button>
                                                </Link>
                                            )}

                                            {/* Acción rápida: Aprobar si está pendiente */}
                                            {service.status === 'pending' && (
                                                <Link href={`/services/${service.id}`}>
                                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                                        Aprobar
                                                    </Button>
                                                </Link>
                                            )}

                                            {/* Ver siempre disponible */}
                                            <Link href={`/services/${service.id}`}>
                                                <Button size="sm" variant="outline">Ver Todo</Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {services.last_page > 1 && (
                    <div className="mt-4 flex justify-center gap-1">
                        {services.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`px-3 py-1 rounded border text-sm ${
                                    link.active ? 'bg-primary text-primary-foreground' : link.url ? 'hover:bg-accent' : 'opacity-50'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Botón flotante */}
            <Link href="/services/wizard" className="fixed bottom-6 right-6">
                <Button className="h-12 rounded-full bg-emerald-600 px-5 text-white shadow-lg hover:bg-emerald-700">
                    <Plus className="mr-2 h-5 w-5" /> Nuevo Servicio
                </Button>
            </Link>
        </AppLayout>
    );
}