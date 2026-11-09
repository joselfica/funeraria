import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableActions } from '@/components/ui/table-actions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Vehicle {
    id: number;
    uuid: string;
    type: 'carroza' | 'acompanamiento' | 'furgon';
    type_label: string;
    plate: string;
    brand: string | null;
    model: string | null;
    year: number | null;
    capacity: number;
    status: 'disponible' | 'en_servicio' | 'mantenimiento' | 'fuera_servicio';
    status_label: string;
    needs_maintenance: boolean;
    is_active: boolean;
}

interface Props {
    vehicles: {
        data: Vehicle[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        search: string;
        type: string;
        status: string;
    };
}

export default function VehiclesIndex({ vehicles, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/vehicles', { search, type, status }, { preserveState: true });
    };

    const handleDelete = (vehicle: Vehicle) => {
        if (confirm(`¿Eliminar el vehículo ${vehicle.plate}?`)) {
            router.delete(`/vehicles/${vehicle.id}`);
        }
    };

    const getStatusColor = (status: Vehicle['status']) => {
        switch (status) {
            case 'disponible': return 'default';
            case 'en_servicio': return 'default';
            case 'mantenimiento': return 'secondary';
            case 'fuera_servicio': return 'destructive';
            default: return 'secondary';
        }
    };

    return (
        <>
            <Head title="Vehículos" />

            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Flota de Vehículos</h1>
                        <p className="text-muted-foreground mt-1">
                            Total: {vehicles.total} vehículos
                        </p>
                    </div>
                    <Link href="/vehicles/create">
                        <Button>Nuevo Vehículo</Button>
                    </Link>
                </div>

                <form onSubmit={handleSearch} className="mb-4 flex gap-2 flex-wrap">
                    <Input
                        placeholder="Buscar por patente, marca o modelo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-md"
                    />
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="rounded-md border border-input bg-transparent px-3 text-sm"
                    >
                        <option value="">Todos los tipos</option>
                        <option value="carroza">Carroza</option>
                        <option value="acompanamiento">Acompañamiento</option>
                        <option value="furgon">Furgón</option>
                    </select>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="rounded-md border border-input bg-transparent px-3 text-sm"
                    >
                        <option value="">Todos los estados</option>
                        <option value="disponible">Disponible</option>
                        <option value="en_servicio">En servicio</option>
                        <option value="mantenimiento">Mantenimiento</option>
                        <option value="fuera_servicio">Fuera de servicio</option>
                    </select>
                    <Button type="submit" variant="secondary">Buscar</Button>
                </form>

                <div className="border rounded-lg overflow-hidden bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Patente</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Marca / Modelo</TableHead>
                                <TableHead>Año</TableHead>
                                <TableHead>Capacidad</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Activo</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vehicles.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        No hay vehículos registrados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                vehicles.data.map((vehicle) => (
                                    <TableRow key={vehicle.id}>
                                        <TableCell className="font-mono font-medium">
                                            {vehicle.plate}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{vehicle.type_label}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {vehicle.brand || '—'} {vehicle.model && `/ ${vehicle.model}`}
                                        </TableCell>
                                        <TableCell>{vehicle.year || '—'}</TableCell>
                                        <TableCell>{vehicle.capacity}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusColor(vehicle.status)}>
                                                {vehicle.status_label}
                                            </Badge>
                                            {vehicle.needs_maintenance && (
                                                <span className="ml-2 text-xs text-destructive font-bold">
                                                    ⚠️ Mantención
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={vehicle.is_active ? 'default' : 'secondary'}>
                                                {vehicle.is_active ? 'Sí' : 'No'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <TableActions
                                                viewHref={`/vehicles/${vehicle.id}`}
                                                editHref={`/vehicles/${vehicle.id}/edit`}
                                                onDelete={() => handleDelete(vehicle)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {vehicles.last_page > 1 && (
                    <div className="mt-4 flex justify-center gap-1">
                        {vehicles.links.map((link, i) => (
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
        </>
    );
}