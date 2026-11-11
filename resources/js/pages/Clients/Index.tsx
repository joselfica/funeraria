import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Plus, Search, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
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

    const tabs: Array<{ key: Status; label: string; count: number }> = [
        { key: 'all', label: 'Todos', count: counts?.all ?? clients.total },
        { key: 'active', label: 'Activos', count: counts?.active ?? 0 },
        { key: 'inactive', label: 'Inactivos', count: counts?.inactive ?? 0 },
    ];

    return (
        <>
            <Head title="Clientes" />

            <div className="p-4 md:p-6 max-w-7xl mx-auto">
                {/* Encabezado */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Clientes</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {counts?.active ?? 0} activos de {counts?.all ?? clients.total} registrados
                        </p>
                    </div>
                    <Link href="/clients/create" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-rose-800 hover:bg-rose-900 text-white shadow-md">
                            <Plus className="mr-1 h-4 w-4" /> Nuevo cliente
                        </Button>
                    </Link>
                </div>

                {/* Filtros */}
                <div className="mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="inline-flex rounded-lg border bg-slate-50 dark:bg-slate-900 p-1 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => go({ status: tab.key })}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                                    status === tab.key
                                        ? 'bg-white dark:bg-slate-800 text-rose-800 dark:text-rose-400 shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {tab.label}
                                <span className="ml-1.5 text-xs opacity-70">{tab.count}</span>
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSearch} className="flex w-full gap-2 sm:w-auto">
                        <div className="relative w-full sm:w-80">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Buscar por nombre, RUT o email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                        </div>
                        <Button type="submit" variant="secondary">Buscar</Button>
                    </form>
                </div>

                {/* VISTA MÓVIL: Tarjetas */}
                <div className="md:hidden space-y-3">
                    {clients.data.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-card">No se encontraron clientes</div>
                    ) : (
                        clients.data.map((client) => (
                            <div key={client.id} className={`border rounded-xl bg-card p-4 space-y-3 shadow-sm ${!client.is_active ? 'opacity-70' : ''}`}>
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${client.is_active ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-500'}`}>
                                            {initials(client.name)}
                                        </div>
                                        <div className="min-w-0">
                                            <Link href={`/clients/${client.id}`} className="block truncate font-semibold hover:underline">{client.name}</Link>
                                            <span className="font-mono text-xs text-muted-foreground">{client.rut}</span>
                                        </div>
                                    </div>
                                    <Badge className={client.is_active ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600'}>
                                        {client.is_active ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-1 gap-1 text-sm">
                                    <p className="truncate text-muted-foreground">{client.email || 'Sin email'}</p>
                                    <p className="text-muted-foreground">{client.phone || 'Sin teléfono'}</p>
                                </div>
                                <div className="pt-2 border-t flex justify-end gap-1">
                                    <Link href={`/clients/${client.id}`}><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></Link>
                                    <Link href={`/clients/${client.id}/edit`}><Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button></Link>
                                    <Button variant="ghost" size="sm" onClick={() => handleToggle(client)}>
                                        {client.is_active ? <UserX className="h-4 w-4 text-rose-600" /> : <UserCheck className="h-4 w-4 text-emerald-600" />}
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* VISTA DESKTOP: Tabla */}
                <div className="hidden md:block overflow-hidden rounded-xl border bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                                <TableHead className="pl-4">Cliente</TableHead>
                                <TableHead>Contacto</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="pr-4 text-right">Acciones</TableHead>
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
                                    <TableRow key={client.id} className={client.is_active ? 'hover:bg-slate-50 dark:hover:bg-slate-900/30' : 'bg-slate-50/50 text-muted-foreground'}>
                                        <TableCell className="py-3 pl-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${client.is_active ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-500'}`}>
                                                    {initials(client.name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <Link href={`/clients/${client.id}`} className="block truncate font-medium text-foreground hover:underline">{client.name}</Link>
                                                    <span className="font-mono text-xs text-muted-foreground">{client.rut}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{client.email || <span className="text-muted-foreground">Sin email</span>}</div>
                                            <div className="text-xs text-muted-foreground">{client.phone || 'Sin teléfono'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={client.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'text-muted-foreground'}>
                                                <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${client.is_active ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`} />
                                                {client.is_active ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="pr-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link href={`/clients/${client.id}`}><Button variant="ghost" size="icon" title="Ver detalle"><Eye className="h-4 w-4" /></Button></Link>
                                                <Link href={`/clients/${client.id}/edit`}><Button variant="ghost" size="icon" title="Editar"><Pencil className="h-4 w-4" /></Button></Link>
                                                <Button variant="ghost" size="icon" title={client.is_active ? 'Desactivar' : 'Activar'} onClick={() => handleToggle(client)}>
                                                    {client.is_active ? <UserX className="h-4 w-4 text-rose-600" /> : <UserCheck className="h-4 w-4 text-emerald-600" />}
                                                </Button>
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
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">Mostrando {clients.from ?? 0}–{clients.to ?? 0} de {clients.total}</p>
                        {clients.last_page > 1 && (
                            <div className="flex flex-wrap gap-1">
                                {clients.links.map((link, i) => (
                                    <Link key={i} href={link.url || '#'} preserveScroll className={`rounded-md border px-3 py-1 text-sm ${link.active ? 'border-rose-800 bg-rose-800 text-white' : link.url ? 'hover:bg-slate-100 dark:hover:bg-slate-800' : 'pointer-events-none opacity-50'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}