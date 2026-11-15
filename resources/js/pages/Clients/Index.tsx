import { Head, Link, router } from '@inertiajs/react';
import { Eye, MoreVertical, Pencil, Plus, Search, UserCheck, UserX, Users, Mail, Phone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Client {
    id: number;
    uuid: string;
    rut: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    is_active: boolean;
}

type Status = 'all' | 'active' | 'inactive';

interface Props {
    clients: {
        data: Client[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
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

const initials = (name: string) =>
    name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

/**
 * Menú de tres puntos por fila. Se dibuja en un portal con posición fija para
 * que no lo recorte el scroll horizontal de la tabla.
 */
function RowMenu({ client, onToggle, large = false }: { client: Client; onToggle: () => void; large?: boolean }) {
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
                            <Link href={`/clients/${client.id}`} className={itemClass}>
                                <Eye className="h-4 w-4" /> Ver detalle
                            </Link>
                            <Link href={`/clients/${client.id}/edit`} className={itemClass}>
                                <Pencil className="h-4 w-4" /> Editar
                            </Link>
                            <button
                                type="button"
                                onClick={() => {
                                    setOpen(false);
                                    onToggle();
                                }}
                                className={`${itemClass} ${
                                    client.is_active
                                        ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                        : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                }`}
                            >
                                {client.is_active ? (
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

export default function ClientsIndex({ clients, filters, counts }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const status: Status = filters.status || 'all';

    const go = (params: { search?: string; status?: Status }) => {
        router.get('/clients', { search: params.search ?? search, status: params.status ?? status }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        go({ search });
    };

    const handleToggle = (client: Client) => {
        const action = client.is_active ? 'desactivar' : 'activar';
        if (confirm(`¿Deseas ${action} a ${client.name}?`)) {
            router.post(`/clients/${client.id}/toggle-active`, {}, { preserveScroll: true });
        }
    };

    const tabs: Array<{ key: Status; label: string; dot: string | null; count: number }> = [
        { key: 'all', label: 'Todos', dot: null, count: counts?.all ?? clients.total },
        { key: 'active', label: 'Activos', dot: 'bg-emerald-500', count: counts?.active ?? 0 },
        { key: 'inactive', label: 'Inactivos', dot: 'bg-slate-400', count: counts?.inactive ?? 0 },
    ];

    const renderAvatar = (client: Client, size: 'sm' | 'md' = 'md') => (
        <div
            className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${
                size === 'md' ? 'h-11 w-11 text-sm' : 'h-10 w-10 text-xs'
            } ${client.is_active ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}
        >
            {initials(client.name)}
        </div>
    );

    const renderStatusBadge = (client: Client) => (
        <Badge
            variant="outline"
            className={`w-fit ${
                client.is_active
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
                    : 'text-muted-foreground'
            }`}
        >
            <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${client.is_active ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`} />
            {client.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
    );

    return (
        <>
            <Head title="Clientes" />

            <div className="mx-auto max-w-7xl space-y-6 p-4 pb-12 sm:p-6 lg:p-8">
                {/* Encabezado */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="shrink-0 rounded-lg bg-rose-100 p-2 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                            <Users className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-3xl">Clientes</h1>
                            <p className="mt-1 text-sm text-muted-foreground md:text-base">
                                {counts?.active ?? 0} activos de {counts?.all ?? clients.total} registrados
                            </p>
                        </div>
                    </div>
                    <Link href="/clients/create" className="w-full sm:w-auto">
                        <Button className="h-10 w-full bg-rose-800 text-white shadow-md hover:bg-rose-900 sm:w-auto">
                            <Plus className="mr-1 h-4 w-4" /> Nuevo cliente
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
                            placeholder="Buscar por nombre, RUT o email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-10 bg-white pl-9 dark:bg-slate-950"
                        />
                    </div>
                    <Button type="submit" variant="secondary" className="h-10 w-full sm:w-auto">
                        Buscar
                    </Button>
                </form>

                {/* TARJETAS (móvil y tablet) */}
                <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
                    {clients.data.length === 0 ? (
                        <div className="rounded-xl border bg-card py-10 text-center text-muted-foreground sm:col-span-2">
                            No se encontraron clientes
                        </div>
                    ) : (
                        clients.data.map((client) => (
                            <div
                                key={client.id}
                                className={`flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm ${client.is_active ? '' : 'opacity-60'}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        {renderAvatar(client)}
                                        <div className="min-w-0">
                                            <Link href={`/clients/${client.id}`} className="block truncate font-semibold hover:underline">
                                                {client.name}
                                            </Link>
                                            <span className="font-mono text-xs text-muted-foreground">{client.rut}</span>
                                        </div>
                                    </div>
                                    {renderStatusBadge(client)}
                                </div>

                                <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/40">
                                    <p className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{client.email || 'Sin email'}</span>
                                    </p>
                                    <p className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="h-4 w-4 shrink-0" />
                                        <span>{client.phone || 'Sin teléfono'}</span>
                                    </p>
                                </div>

                                <div className="mt-auto flex items-center gap-2 border-t pt-4">
                                    <Link href={`/clients/${client.id}`} className="flex-1">
                                        <Button variant="outline" className="h-10 w-full">
                                            <Eye className="mr-1.5 h-4 w-4" /> Ver detalle
                                        </Button>
                                    </Link>
                                    <RowMenu client={client} onToggle={() => handleToggle(client)} large />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* TABLA (escritorio) */}
                <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-sm lg:block">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                                <TableHead className="h-12 px-5">Cliente</TableHead>
                                <TableHead className="h-12 px-5">Contacto</TableHead>
                                <TableHead className="h-12 px-5">Estado</TableHead>
                                <TableHead className="h-12 px-5 text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-16 text-center">
                                        <p className="font-medium">No se encontraron clientes</p>
                                        <p className="mt-1 text-sm text-muted-foreground">Prueba con otra búsqueda o cambia el filtro de estado.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                clients.data.map((client) => (
                                    <TableRow
                                        key={client.id}
                                        className={client.is_active ? 'hover:bg-slate-50 dark:hover:bg-slate-900/30' : 'bg-slate-50/50 text-muted-foreground opacity-60'}
                                    >
                                        <TableCell className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {renderAvatar(client, 'sm')}
                                                <div className="min-w-0">
                                                    <Link href={`/clients/${client.id}`} className="block truncate font-medium text-foreground hover:underline">
                                                        {client.name}
                                                    </Link>
                                                    <span className="font-mono text-xs text-muted-foreground">{client.rut}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <div className="text-sm">{client.email || <span className="text-muted-foreground">Sin email</span>}</div>
                                            <div className="mt-0.5 text-xs text-muted-foreground">{client.phone || 'Sin teléfono'}</div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">{renderStatusBadge(client)}</TableCell>
                                        <TableCell className="whitespace-nowrap px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/clients/${client.id}`}>
                                                    <Button variant="outline" size="sm" className="h-9">
                                                        <Eye className="mr-1 h-4 w-4" /> Ver
                                                    </Button>
                                                </Link>
                                                <RowMenu client={client} onToggle={() => handleToggle(client)} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Paginación */}
                {clients.total > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <p className="text-sm text-muted-foreground">Mostrando {clients.from ?? 0}–{clients.to ?? 0} de {clients.total}</p>
                        {clients.last_page > 1 && (
                            <div className="flex flex-wrap gap-1.5">
                                {clients.links.map((link, i) => (
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
                )}
            </div>
        </>
    );
}