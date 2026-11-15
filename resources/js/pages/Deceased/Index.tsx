import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Search, UserCheck, UserX, Eye, Pencil, MoreVertical,
    Plus, Cross, CheckCircle2, AlertTriangle, FileText, MapPin,
} from 'lucide-react';

interface Deceased {
    id: number;
    uuid: string;
    full_name: string;
    rut: string | null;
    gender: string | null;
    death_date: string;
    death_certificate_number: string | null;
    current_location: string | null;
    is_active: boolean;
}

type Status = 'all' | 'active' | 'inactive';

interface Props {
    deceased: {
        data: Deceased[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        search: string;
        status: Status;
    };
    counts: {
        all: number;
        active: number;
        inactive: number;
    };
}

/**
 * death_date es una fecha sin hora. Se toman solo los 10 primeros caracteres
 * (YYYY-MM-DD) para que la zona horaria del navegador no la corra un día.
 */
const parseDate = (date: string) => {
    const [y, m, d] = date.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
};

/**
 * Menú de tres puntos por fila. Se dibuja en un portal con posición fija para
 * que no lo recorte el scroll horizontal de la tabla.
 */
function RowMenu({ item, onToggle, large = false }: { item: Deceased; onToggle: () => void; large?: boolean }) {
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
                            <Link href={`/deceased/${item.id}`} className={itemClass}>
                                <Eye className="h-4 w-4" /> Ver detalle
                            </Link>
                            <Link href={`/deceased/${item.id}/edit`} className={itemClass}>
                                <Pencil className="h-4 w-4" /> Editar
                            </Link>
                            <button
                                type="button"
                                onClick={() => {
                                    setOpen(false);
                                    onToggle();
                                }}
                                className={`${itemClass} ${
                                    item.is_active
                                        ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                        : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                }`}
                            >
                                {item.is_active ? (
                                    <>
                                        <UserX className="h-4 w-4" /> Desactivar
                                    </>
                                ) : (
                                    <>
                                        <UserCheck className="h-4 w-4" /> Activar
                                    </>
                                )}
                            </button>
                        </div>
                    </>,
                    document.body,
                )}
        </>
    );
}

export default function DeceasedIndex({ deceased, filters, counts }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const status: Status = filters.status || 'all';

    // Función para cambiar de pestaña o buscar
    const go = (params: { search?: string; status?: Status }) => {
        router.get('/deceased', {
            search: params.search ?? search,
            status: params.status ?? status,
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        go({ search });
    };

    const handleToggle = (item: Deceased) => {
        const action = item.is_active ? 'desactivar' : 'activar';
        if (confirm(`¿Deseas ${action} el registro de ${item.full_name}?`)) {
            router.post(`/deceased/${item.id}/toggle-active`, {}, { preserveScroll: true });
        }
    };

    const tabs: Array<{ key: Status; label: string; dot: string | null; count: number }> = [
        { key: 'all', label: 'Todos', dot: null, count: counts?.all ?? deceased.total },
        { key: 'active', label: 'Activos', dot: 'bg-emerald-500', count: counts?.active ?? 0 },
        { key: 'inactive', label: 'Inactivos', dot: 'bg-slate-400', count: counts?.inactive ?? 0 },
    ];

    // Calendario (mismo tamaño y estilo que en Servicios)
    const renderDate = (item: Deceased) => {
        const d = parseDate(item.death_date);
        return (
            <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                <span className="text-xs font-bold uppercase text-rose-800 dark:text-rose-400">
                    {d.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '')}
                </span>
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {d.getDate()}
                </span>
                <span className="text-[10px] text-muted-foreground">
                    {d.getFullYear()}
                </span>
            </div>
        );
    };

    const renderStatus = (item: Deceased) => (
        <Badge className={`w-fit ${item.is_active
            ? 'border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
            : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-100'
        }`}>
            {item.is_active ? (
                <><CheckCircle2 className="mr-1 h-3 w-3" /> Activo</>
            ) : (
                <><AlertTriangle className="mr-1 h-3 w-3" /> Inactivo</>
            )}
        </Badge>
    );

    return (
        <>
            <Head title="Fallecidos" />

            <div className="mx-auto max-w-7xl space-y-6 p-4 pb-12 sm:p-6 lg:p-8">
                {/* Encabezado */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="shrink-0 rounded-lg bg-rose-100 p-2 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                            <Cross className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl">
                                Registro de Fallecidos
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground md:text-base">
                                {counts?.active ?? 0} activos de {counts?.all ?? deceased.total} registrados
                            </p>
                        </div>
                    </div>
                    <Link href="/deceased/create" className="w-full sm:w-auto">
                        <Button className="h-10 w-full bg-rose-800 text-white shadow-md hover:bg-rose-900 sm:w-auto">
                            <Plus className="mr-1 h-4 w-4" /> Nuevo Registro
                        </Button>
                    </Link>
                </div>

                {/* Chips de estado */}
                <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1.5 dark:bg-slate-900 sm:inline-flex" role="tablist">
                    {tabs.map((tab) => {
                        const active = status === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => go({ status: tab.key })}
                                className={`flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-rose-800 text-white shadow-sm'
                                        : 'text-muted-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-slate-800'
                                }`}
                            >
                                {tab.dot && <span className={`h-2 w-2 rounded-full ${tab.dot}`} />}
                                {tab.label}
                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                        active ? 'bg-white/20 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Búsqueda */}
                <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/40 sm:flex-row sm:items-center">
                    <div className="relative w-full sm:max-w-md sm:flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre, RUT o certificado..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-10 bg-white pl-9 dark:bg-slate-950"
                        />
                    </div>
                    <Button type="submit" variant="secondary" className="h-10 w-full sm:w-auto">Buscar</Button>
                </form>

                {/* ───────── TARJETAS (móvil y tablet) ───────── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
                    {deceased.data.length === 0 ? (
                        <div className="rounded-xl border bg-card py-10 text-center text-muted-foreground sm:col-span-2">
                            <Cross className="mx-auto mb-2 h-12 w-12 text-slate-300" />
                            No hay registros de fallecidos
                        </div>
                    ) : (
                        deceased.data.map((item) => (
                            <div
                                key={item.id}
                                className={`flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm ${item.is_active ? '' : 'opacity-60'}`}
                            >
                                <div className="flex items-start gap-3">
                                    {renderDate(item)}
                                    <div className="min-w-0 flex-1">
                                        <p className="break-words font-bold text-slate-800 dark:text-slate-100">{item.full_name}</p>
                                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{item.rut || 'Sin RUT'}</p>
                                        <div className="mt-2">{renderStatus(item)}</div>
                                    </div>
                                </div>

                                <div className="space-y-2.5 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/40">
                                    <p className="flex items-start gap-2">
                                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span className="break-words">
                                            <span className="text-xs text-muted-foreground">Certificado: </span>
                                            {item.death_certificate_number || '—'}
                                        </span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span className="break-words">
                                            <span className="text-xs text-muted-foreground">Ubicación: </span>
                                            {item.current_location || '—'}
                                        </span>
                                    </p>
                                </div>

                                <div className="mt-auto flex items-center gap-2 border-t pt-4">
                                    <Link href={`/deceased/${item.id}`} className="flex-1">
                                        <Button variant="outline" className="h-10 w-full">
                                            <Eye className="mr-1.5 h-4 w-4" /> Ver detalle
                                        </Button>
                                    </Link>
                                    <RowMenu item={item} onToggle={() => handleToggle(item)} large />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* ───────── TABLA (escritorio) ───────── */}
                <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-sm lg:block">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                                <TableHead className="h-12 w-[110px] px-5">Fallecimiento</TableHead>
                                <TableHead className="h-12 px-5">Fallecido</TableHead>
                                <TableHead className="h-12 px-5">Certificado</TableHead>
                                <TableHead className="h-12 px-5">Ubicación Actual</TableHead>
                                <TableHead className="h-12 px-5">Estado</TableHead>
                                <TableHead className="h-12 px-5 text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deceased.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                        <Cross className="mx-auto mb-2 h-12 w-12 text-slate-300" />
                                        No hay registros de fallecidos
                                    </TableCell>
                                </TableRow>
                            ) : (
                                deceased.data.map((item) => (
                                    <TableRow key={item.id} className={!item.is_active ? 'bg-slate-50/50 opacity-60' : 'hover:bg-slate-50 dark:hover:bg-slate-900/30'}>
                                        <TableCell className="px-5 py-4">{renderDate(item)}</TableCell>

                                        {/* Datos del fallecido */}
                                        <TableCell className="px-5 py-4">
                                            <p className="font-bold text-slate-800 dark:text-slate-100">{item.full_name}</p>
                                            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{item.rut || 'Sin RUT'}</p>
                                        </TableCell>

                                        <TableCell className="px-5 py-4 text-sm">
                                            {item.death_certificate_number || '—'}
                                        </TableCell>

                                        <TableCell className="px-5 py-4 text-sm">
                                            {item.current_location || '—'}
                                        </TableCell>

                                        <TableCell className="px-5 py-4">{renderStatus(item)}</TableCell>

                                        {/* Acciones */}
                                        <TableCell className="whitespace-nowrap px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/deceased/${item.id}`}>
                                                    <Button variant="outline" size="sm" className="h-9">
                                                        <Eye className="mr-1 h-4 w-4" /> Ver
                                                    </Button>
                                                </Link>
                                                <RowMenu item={item} onToggle={() => handleToggle(item)} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Paginación */}
                {deceased.last_page > 1 && (
                    <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                        {deceased.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                preserveScroll
                                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                                    link.active
                                        ? 'border-rose-800 bg-rose-800 text-white'
                                        : link.url
                                            ? 'hover:bg-slate-100 dark:hover:bg-slate-800'
                                            : 'pointer-events-none opacity-50'
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