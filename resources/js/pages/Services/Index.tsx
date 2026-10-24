import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
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
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                                        <TableCell>
                                            <Badge variant={getStatusVariant(service.status)}>
                                                {service.status_label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Link href={`/services/${service.id}`}>
                                                <Button variant="ghost" size="sm">Ver</Button>
                                            </Link>
                                            <Link href={`/services/${service.id}/edit`}>
                                                <Button variant="ghost" size="sm">Editar</Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(service)}
                                            >
                                                Eliminar
                                            </Button>
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
        </AppLayout>
    );
}