import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
import { Car, Users, Truck, Wrench, ShieldAlert, CheckCircle2, MoreVertical, Eye, Pencil, Trash2, Plus } from 'lucide-react';

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

interface Counts {
    all: number;
    disponible: number;
    en_servicio: number;
    mantenimiento: number;
    fuera_servicio: number;
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
    /** Opcional: si el controlador lo envía, los chips muestran contadores. */
    counts?: Counts;
}

/**
 * Menú de tres puntos por fila. Se dibuja en un portal con posición fija para
 * que no lo recorte el scroll horizontal de la tabla.
 */
function RowMenu({ vehicle, onDelete, large = false }: { vehicle: Vehicle; onDelete: () => void; large?: boolean }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, right: 0 });
    const btnRef = useRef<HTMLButtonElement>(null);

    const toggle = () => {
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
        }
        setOpen((o) => !o);
    };

    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
            window.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const itemClass = 'flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800';

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={toggle}
                aria-label="Más acciones"
                className={`inline-flex shrink-0 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    large ? 'h-10 w-10 border' : 'h-9 w-9'
                }`}
            >
                <MoreVertical className="h-4 w-4" />
            </button>

            {open &&
                createPortal(
                    <>
                        <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
                        <div
                            className="fixed z-[9999] w-48 rounded-lg border bg-card p-1 shadow-lg"
                            style={{ top: pos.top, right: pos.right }}
                        >
                            <Link href={`/vehicles/${vehicle.id}`} className={itemClass}>
                                <Eye className="h-4 w-4" /> Ver detalle
                            </Link>
                            <Link href={`/vehicles/${vehicle.id}/edit`} className={itemClass}>
                                <Pencil className="h-4 w-4" /> Editar
                            </Link>
                            <button
                                type="button"
                                onClick={() => {
                                    setOpen(false);
                                    onDelete();
                                }}
                                className={`${itemClass} text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30`}
                            >
                                <Trash2 className="h-4 w-4" /> Eliminar
                            </button>
                        </div>
                    </>,
                    document.body,
                )}
        </>
    );
}

export default function VehiclesIndex({ vehicles, filters, counts }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || '');

    const activeStatus = filters.status || '';

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/vehicles', { search, type, status: activeStatus }, { preserveState: true });
    };

    const applyStatus = (key: string) => {
        router.get(
            '/vehicles',
            { search: filters.search, type: filters.type, status: key },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleDelete = (vehicle: Vehicle) => {
        if (confirm(`¿Eliminar el vehículo ${vehicle.plate}?`)) {
            router.delete(`/vehicles/${vehicle.id}`);
        }
    };

    const chips: Array<{ key: string; label: string; dot: string | null; count?: number }> = [
        { key: '', label: 'Todos', dot: null, count: counts?.all },
        { key: 'disponible', label: 'Disponible', dot: 'bg-emerald-500', count: counts?.disponible },
        { key: 'en_servicio', label: 'En servicio', dot: 'bg-blue-500', count: counts?.en_servicio },
        { key: 'mantenimiento', label: 'Mantenimiento', dot: 'bg-amber-400', count: counts?.mantenimiento },
        { key: 'fuera_servicio', label: 'Fuera de servicio', dot: 'bg-rose-500', count: counts?.fuera_servicio },
    ];

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

    const formatCapacity = (capacity: number) => `${capacity} ${capacity === 1 ? 'pasajero' : 'pasajeros'}`;

    /** Patente con aspecto de placa, para que sea lo primero que se lee. */
    const renderPlate = (vehicle: Vehicle) => (
        <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md border-2 border-slate-300 bg-white px-3 py-1.5 font-mono text-base font-bold tracking-widest dark:border-slate-600 dark:bg-slate-900">
                {vehicle.plate}
            </span>
            {!vehicle.is_active && (
                <Badge variant="secondary" className="text-[10px]">Inactivo</Badge>
            )}
        </div>
    );

    const renderModel = (vehicle: Vehicle) => (
        <div className="text-sm">
            <p className="font-medium">
                {vehicle.brand || '—'} {vehicle.model && `/ ${vehicle.model}`}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{vehicle.year || 'Año s/d'}</p>
        </div>
    );

    const renderMaintenanceTag = (vehicle: Vehicle) =>
        vehicle.needs_maintenance ? (
            <span className="inline-flex w-fit items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                <Wrench className="h-3 w-3" /> Mantención pronto
            </span>
        ) : null;

    return (
        <>
            <Head title="Vehículos" />

            <div className="mx-auto max-w-7xl space-y-6 p-4 pb-12 sm:p-6 lg:p-8">
                {/* ENCABEZADO */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-3 text-2xl font-bold md:text-3xl">
                            <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                <Car className="h-6 w-6 md:h-8 md:w-8" />
                            </div>
                            Flota de Vehículos
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground md:text-base">
                            {vehicles.total} {vehicles.total === 1 ? 'vehículo' : 'vehículos'}
                        </p>
                    </div>
                    <Link href="/vehicles/create" className="w-full sm:w-auto">
                        <Button className="h-10 w-full bg-rose-800 text-white shadow-md hover:bg-rose-900 sm:w-auto">
                            <Plus className="mr-1 h-4 w-4" /> Nuevo Vehículo
                        </Button>
                    </Link>
                </div>

                {/* CHIPS DE ESTADO + RESUMEN DE FLOTA */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1.5 dark:bg-slate-900" role="tablist">
                        {chips.map((chip) => {
                            const active = activeStatus === chip.key;
                            return (
                                <button
                                    key={chip.key || 'all'}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => applyStatus(chip.key)}
                                    className={`flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                                        active ? 'bg-rose-800 text-white shadow-sm' : 'text-muted-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {chip.dot && <span className={`h-2 w-2 rounded-full ${chip.dot}`} />}
                                    {chip.label}
                                    {chip.count !== undefined && (
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                active ? 'bg-white/20 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                            }`}
                                        >
                                            {chip.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {counts && (
                        <div className="flex items-baseline justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 dark:border-emerald-900 dark:bg-emerald-950/30">
                            <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Disponibles</span>
                            <span className="text-lg font-bold text-emerald-800 dark:text-emerald-400">
                                {counts.disponible} de {counts.all}
                            </span>
                        </div>
                    )}
                </div>

                {/* BÚSQUEDA */}
                <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/40 sm:flex-row sm:items-center">
                    <Input
                        placeholder="Buscar por patente, marca o modelo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-10 w-full bg-white dark:bg-slate-950 sm:max-w-md sm:flex-1"
                    />
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm dark:bg-slate-950 sm:w-auto"
                    >
                        <option value="">Todos los tipos</option>
                        <option value="carroza">Carroza</option>
                        <option value="acompanamiento">Acompañamiento</option>
                        <option value="furgon">Furgón</option>
                    </select>
                    <Button type="submit" variant="secondary" className="h-10 w-full sm:w-auto">
                        Buscar
                    </Button>
                </form>

                {/* TARJETAS (móvil y tablet) */}
                <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
                    {vehicles.data.length === 0 ? (
                        <div className="rounded-xl border bg-card py-10 text-center text-muted-foreground sm:col-span-2">
                            No hay vehículos para mostrar
                        </div>
                    ) : (
                        vehicles.data.map((vehicle) => (
                            <div
                                key={vehicle.id}
                                className={`flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm ${vehicle.is_active ? '' : 'opacity-60'}`}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    {renderPlate(vehicle)}
                                    {getStatusBadge(vehicle)}
                                </div>

                                {renderModel(vehicle)}

                                <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Tipo</p>
                                        <Badge variant="outline" className="flex w-fit items-center border-slate-300 bg-white text-slate-700">
                                            {getTypeIcon(vehicle.type)} {vehicle.type_label}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Capacidad</p>
                                        <p className="text-sm font-medium">{formatCapacity(vehicle.capacity)}</p>
                                    </div>
                                </div>

                                {renderMaintenanceTag(vehicle)}

                                <div className="mt-auto flex items-center gap-2 border-t pt-4">
                                    <Link href={`/vehicles/${vehicle.id}`} className="flex-1">
                                        <Button variant="outline" className="h-10 w-full">
                                            <Eye className="mr-1.5 h-4 w-4" /> Ver detalle
                                        </Button>
                                    </Link>
                                    <RowMenu vehicle={vehicle} onDelete={() => handleDelete(vehicle)} large />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* TABLA (escritorio) */}
                <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-sm lg:block">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="h-12 px-5">Patente</TableHead>
                                <TableHead className="h-12 px-5">Marca / Modelo</TableHead>
                                <TableHead className="h-12 px-5">Tipo</TableHead>
                                <TableHead className="h-12 px-5">Capacidad</TableHead>
                                <TableHead className="h-12 px-5">Estado</TableHead>
                                <TableHead className="h-12 px-5 text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vehicles.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                        No hay vehículos para mostrar
                                    </TableCell>
                                </TableRow>
                            ) : (
                                vehicles.data.map((vehicle) => (
                                    <TableRow
                                        key={vehicle.id}
                                        className={`transition-colors hover:bg-muted/30 ${vehicle.is_active ? '' : 'bg-slate-50/50 opacity-60'}`}
                                    >
                                        <TableCell className="px-5 py-4">{renderPlate(vehicle)}</TableCell>
                                        <TableCell className="px-5 py-4">{renderModel(vehicle)}</TableCell>
                                        <TableCell className="px-5 py-4">
                                            <Badge variant="outline" className="flex w-fit items-center border-slate-300 bg-slate-50 text-slate-700">
                                                {getTypeIcon(vehicle.type)} {vehicle.type_label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-sm">{formatCapacity(vehicle.capacity)}</TableCell>
                                        <TableCell className="px-5 py-4">
                                            <div className="flex flex-col items-start gap-2">
                                                {getStatusBadge(vehicle)}
                                                {renderMaintenanceTag(vehicle)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/vehicles/${vehicle.id}`}>
                                                    <Button variant="outline" size="sm" className="h-9">
                                                        <Eye className="mr-1 h-4 w-4" /> Ver
                                                    </Button>
                                                </Link>
                                                <RowMenu vehicle={vehicle} onDelete={() => handleDelete(vehicle)} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {vehicles.last_page > 1 && (
                    <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                        {vehicles.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                                    link.active
                                        ? 'border-rose-800 bg-rose-800 text-white'
                                        : link.url
                                          ? 'hover:bg-muted'
                                          : 'opacity-50'
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