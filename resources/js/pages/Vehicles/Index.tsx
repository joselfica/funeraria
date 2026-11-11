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
import { Car, Users, Truck, Wrench, ShieldAlert, CheckCircle2 } from 'lucide-react';

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

    const getTypeIcon = (type: Vehicle['type']) => {
        switch (type) {
            case 'carroza': return <Car className="h-3.5 w-3.5 mr-1" />;
            case 'acompanamiento': return <Users className="h-3.5 w-3.5 mr-1" />;
            case 'furgon': return <Truck className="h-3.5 w-3.5 mr-1" />;
            default: return null;
        }
    };

    const getStatusBadge = (vehicle: Vehicle) => {
        switch (vehicle.status) {
            case 'disponible':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none px-3 py-1"><CheckCircle2 className="h-3 w-3 mr-1" /> {vehicle.status_label}</Badge>;
            case 'en_servicio':
                return <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none px-3 py-1"><Car className="h-3 w-3 mr-1" /> {vehicle.status_label}</Badge>;
            case 'mantenimiento':
                return <Badge className="bg-amber-400 hover:bg-amber-500 text-amber-950 border-none px-3 py-1"><Wrench className="h-3 w-3 mr-1" /> {vehicle.status_label}</Badge>;
            case 'fuera_servicio':
                return <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none px-3 py-1"><ShieldAlert className="h-3 w-3 mr-1" /> {vehicle.status_label}</Badge>;
            default:
                return <Badge variant="secondary">{vehicle.status_label}</Badge>;
        }
    };

    return (
        <>
            <Head title="Vehículos" />

            <div className="p-4 md:p-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Car className="h-6 w-6 md:h-8 md:w-8" />
                            </div>
                            Flota de Vehículos
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm md:text-base">
                            Total: {vehicles.total} vehículos registrados
                        </p>
                    </div>
                    <Link href="/vehicles/create" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md">
                            <Car className="h-4 w-4 mr-2" /> Nuevo Vehículo
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSearch} className="mb-6 flex flex-col md:flex-row flex-wrap gap-2 bg-muted/40 p-3 rounded-xl">
                    <Input
                        placeholder="Buscar por patente, marca o modelo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full md:max-w-md bg-background"
                    />
                    <div className="grid grid-cols-2 md:flex gap-2">
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm h-9"
                        >
                            <option value="">Todos los tipos</option>
                            <option value="carroza">Carroza</option>
                            <option value="acompanamiento">Acompañamiento</option>
                            <option value="furgon">Furgón</option>
                        </select>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm h-9"
                        >
                            <option value="">Todos los estados</option>
                            <option value="disponible">Disponible</option>
                            <option value="en_servicio">En servicio</option>
                            <option value="mantenimiento">Mantenimiento</option>
                            <option value="fuera_servicio">Fuera de servicio</option>
                        </select>
                    </div>
                    <Button type="submit" variant="secondary" className="w-full md:w-auto">
                        Buscar
                    </Button>
                </form>

                {/* VISTA MÓVIL */}
                <div className="md:hidden space-y-4">
                    {vehicles.data.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-card">
                            No hay vehículos registrados
                        </div>
                    ) : (
                        vehicles.data.map((vehicle) => (
                            <div key={vehicle.id} className="border rounded-xl bg-card p-4 space-y-3 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-mono text-xl font-bold tracking-wider">{vehicle.plate}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {vehicle.brand || '—'} {vehicle.model && `/ ${vehicle.model}`}
                                        </p>
                                    </div>
                                    <Badge variant={vehicle.is_active ? 'default' : 'secondary'} className={vehicle.is_active ? 'bg-emerald-500' : ''}>
                                        {vehicle.is_active ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700 flex items-center">
                                        {getTypeIcon(vehicle.type)} {vehicle.type_label}
                                    </Badge>
                                    {getStatusBadge(vehicle)}
                                </div>

                                {vehicle.needs_maintenance && (
                                    <div className="bg-amber-50 text-amber-700 border border-amber-200 rounded-lg p-2 text-xs flex items-center gap-2">
                                        <Wrench className="h-4 w-4" /> Requiere mantención pronto
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Año</p>
                                        <p className="font-medium">{vehicle.year || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Capacidad</p>
                                        <p className="font-medium">{vehicle.capacity} pasajeros</p>
                                    </div>
                                </div>

                                <div className="pt-3 border-t flex justify-end">
                                    <TableActions
                                        viewHref={`/vehicles/${vehicle.id}`}
                                        editHref={`/vehicles/${vehicle.id}/edit`}
                                        onDelete={() => handleDelete(vehicle)}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* VISTA DESKTOP */}
                <div className="hidden md:block border rounded-xl overflow-hidden bg-card shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
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
                                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                        No hay vehículos registrados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                vehicles.data.map((vehicle) => (
                                    <TableRow key={vehicle.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-mono font-bold text-base tracking-wide">
                                            {vehicle.plate}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="flex items-center w-fit border-slate-300 bg-slate-50 text-slate-700">
                                                {getTypeIcon(vehicle.type)} {vehicle.type_label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {vehicle.brand || '—'} {vehicle.model && `/ ${vehicle.model}`}
                                        </TableCell>
                                        <TableCell>{vehicle.year || '—'}</TableCell>
                                        <TableCell>{vehicle.capacity}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(vehicle)}
                                                {vehicle.needs_maintenance && (
                                                    <span className="text-amber-600" title="Requiere mantención">
                                                        <Wrench className="h-4 w-4" />
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={vehicle.is_active ? 'default' : 'secondary'} className={vehicle.is_active ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
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
                    <div className="mt-6 flex flex-wrap justify-center gap-1">
                        {vehicles.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`px-3 py-1 rounded-lg border text-sm transition-colors ${
                                    link.active ? 'bg-primary text-primary-foreground border-primary' : link.url ? 'hover:bg-muted' : 'opacity-50'
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