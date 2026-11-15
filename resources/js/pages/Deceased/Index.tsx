import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { 
    Search, UserCheck, UserX, Eye, Pencil, MoreVertical, 
    Plus, Cross, CheckCircle2, AlertTriangle
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

export default function DeceasedIndex({ deceased, filters, counts }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const status: Status = filters.status || 'all';

    // Función para cambiar de pestaña o buscar
    const go = (params: { search?: string; status?: Status }) => {
        router.get('/deceased', {
            search: params.search ?? search,
            status: params.status ?? status,
        }, { preserveState: true, replace: true });
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

    const formatDate = (date: string) => new Date(date).toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });

    const tabs: Array<{ key: Status; label: string; count: number }> = [
        { key: 'all', label: 'Todos', count: counts?.all ?? deceased.total },
        { key: 'active', label: 'Activos', count: counts?.active ?? 0 },
        { key: 'inactive', label: 'Inactivos', count: counts?.inactive ?? 0 },
    ];

    return (
        <>
            <Head title="Fallecidos" />

            <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
                {/* Encabezado */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <div className="p-2 bg-rose-100 text-rose-800 rounded-lg">
                                <Cross className="h-6 w-6 md:h-8 md:w-8" />
                            </div>
                            Registro de Fallecidos
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm md:text-base">
                            Administra los expedientes de fallecidos de la funeraria
                        </p>
                    </div>
                    <Link href="/deceased/create" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-rose-800 hover:bg-rose-900 text-white shadow-md">
                            <Plus className="h-4 w-4 mr-2" /> Nuevo Registro
                        </Button>
                    </Link>
                </div>

                {/* Filtros y Pestañas */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="inline-flex rounded-lg border bg-slate-50 dark:bg-slate-900 p-1 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => go({ status: tab.key })}
                                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                                    status === tab.key
                                        ? 'bg-white dark:bg-slate-800 text-rose-800 dark:text-rose-400 shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {tab.label}
                                <span className="ml-2 text-xs opacity-70">{tab.count}</span>
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSearch} className="flex w-full gap-2 sm:w-auto">
                        <div className="relative w-full sm:w-80">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar por nombre, RUT o certificado..." 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)} 
                                className="pl-9" 
                            />
                        </div>
                        <Button type="submit" variant="secondary">Buscar</Button>
                    </form>
                </div>

                {/* Tabla */}
                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                                <TableHead className="w-[100px]">Fallecimiento</TableHead>
                                <TableHead>Fallecido</TableHead>
                                <TableHead>Certificado</TableHead>
                                <TableHead>Ubicación Actual</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deceased.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        <Cross className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                                        No hay registros de fallecidos
                                    </TableCell>
                                </TableRow>
                            ) : (
                                deceased.data.map((item) => (
                                    <TableRow key={item.id} className={!item.is_active ? 'bg-slate-50/50 opacity-60' : 'hover:bg-slate-50 dark:hover:bg-slate-900/30'}>
                                        
                                        {/* Fecha destacada */}
                                        <TableCell>
                                            <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg p-2 w-16">
                                                <span className="text-xs font-bold text-rose-800 dark:text-rose-400 uppercase">
                                                    {new Date(item.death_date).toLocaleDateString('es-CL', { month: 'short' }).replace('.', '')}
                                                </span>
                                                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                                    {new Date(item.death_date).getDate()}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(item.death_date).getFullYear()}
                                                </span>
                                            </div>
                                        </TableCell>
                                        
                                        {/* Datos del fallecido */}
                                        <TableCell>
                                            <p className="font-bold text-slate-800 dark:text-slate-100">{item.full_name}</p>
                                            <p className="text-xs font-mono text-muted-foreground">{item.rut || 'Sin RUT'}</p>
                                        </TableCell>

                                        <TableCell className="text-sm">
                                            {item.death_certificate_number || '—'}
                                        </TableCell>

                                        <TableCell className="text-sm">
                                            {item.current_location || '—'}
                                        </TableCell>

                                        {/* Estado */}
                                        <TableCell>
                                            <Badge className={item.is_active 
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100'
                                            }>
                                                {item.is_active ? (
                                                    <><CheckCircle2 className="h-3 w-3 mr-1" /> Activo</>
                                                ) : (
                                                    <><AlertTriangle className="h-3 w-3 mr-1" /> Inactivo</>
                                                )}
                                            </Badge>
                                        </TableCell>

                                        {/* Acciones */}
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link href={`/deceased/${item.id}`}>
                                                    <Button variant="ghost" size="icon" title="Ver detalle">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/deceased/${item.id}/edit`}>
                                                    <Button variant="ghost" size="icon" title="Editar">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleToggle(item)}>
                                                            {item.is_active ? (
                                                                <>
                                                                    <UserX className="mr-2 h-4 w-4 text-rose-600" />
                                                                    Desactivar
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UserCheck className="mr-2 h-4 w-4 text-emerald-600" />
                                                                    Activar
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
                    <div className="flex flex-wrap justify-center gap-1 mt-4">
                        {deceased.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`px-3 py-1 rounded-lg border text-sm transition-colors ${
                                    link.active 
                                        ? 'bg-rose-800 text-white border-rose-800' 
                                        : link.url 
                                            ? 'hover:bg-slate-100 dark:hover:bg-slate-800' 
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