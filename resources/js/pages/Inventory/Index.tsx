import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Package, Box, FlaskConical, Truck, AlertTriangle, Plus, Eye, Pencil, Trash2, MoreVertical } from 'lucide-react';
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

interface Item {
    id: number;
    uuid: string;
    category: 'ataud' | 'urna';
    code: string;
    name: string;
    material: string | null;
    procedencia: string | null;
    price: string;
    stock: number;
    stock_minimum: number;
    is_active: boolean;
    needs_restock: boolean;
    category_description: string;
}

interface Counts {
    all: number;
    ataud: number;
    urna: number;
    low_stock: number;
}

interface Props {
    items: {
        data: Item[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        search: string;
        category: string;
        procedencia: string;
        low_stock: boolean;
    };
    /** Opcional: si el controlador lo envía, los chips muestran contadores. */
    counts?: Counts;
}

/**
 * Menú de tres puntos por fila. Se dibuja en un portal con posición fija para
 * que no lo recorte el scroll horizontal de la tabla.
 */
function RowMenu({ item, onDelete, large = false }: { item: Item; onDelete: () => void; large?: boolean }) {
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
                            <Link href={`/inventory/${item.id}`} className={itemClass}>
                                <Eye className="h-4 w-4" /> Ver detalle
                            </Link>
                            <Link href={`/inventory/${item.id}/edit`} className={itemClass}>
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

export default function InventoryIndex({ items, filters, counts }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [procedencia, setProcedencia] = useState(filters.procedencia || '');

    const activeCategory = filters.category || '';
    const lowStock = !!filters.low_stock;

    /** Aplica filtros conservando los que no cambian. */
    const go = (params: Partial<{ search: string; category: string; procedencia: string; low_stock: boolean }>) => {
        router.get(
            '/inventory',
            {
                search: params.search ?? filters.search,
                category: params.category ?? activeCategory,
                procedencia: params.procedencia ?? filters.procedencia,
                low_stock: params.low_stock ?? lowStock,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        go({ search, procedencia });
    };

    const handleDelete = (item: Item) => {
        if (confirm(`¿Eliminar "${item.name}"?`)) {
            router.delete(`/inventory/${item.id}`);
        }
    };

    const formatPrice = (price: string) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(parseFloat(price));
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'ataud': return <Box className="h-3.5 w-3.5" />;
            case 'urna': return <FlaskConical className="h-3.5 w-3.5" />;
            default: return <Package className="h-3.5 w-3.5" />;
        }
    };

    const chips: Array<{ key: string; label: string; dot: string | null; count?: number }> = [
        { key: '', label: 'Todos', dot: null, count: counts?.all },
        { key: 'ataud', label: 'Ataúdes', dot: 'bg-rose-700', count: counts?.ataud },
        { key: 'urna', label: 'Urnas', dot: 'bg-slate-500', count: counts?.urna },
    ];

    const renderCategory = (item: Item) => (
        <Badge className={`flex w-fit items-center gap-1.5 ${item.category === 'ataud' ? 'bg-rose-800 text-white hover:bg-rose-900' : 'bg-slate-700 text-white hover:bg-slate-800'}`}>
            {getCategoryIcon(item.category)}
            <span>{item.category === 'ataud' ? 'Ataúd' : 'Urna'}</span>
        </Badge>
    );

    const renderOrigin = (item: Item) =>
        item.procedencia ? (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Truck className="h-3 w-3" /> {item.procedencia}
            </span>
        ) : (
            <span className="inline-flex w-fit items-center rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground">
                Sin procedencia
            </span>
        );

    /** Código y nombre, con etiqueta si el item está inactivo. */
    const renderProduct = (item: Item) => (
        <div className="min-w-0">
            <div className="flex items-center gap-2">
                <span className="rounded-md border bg-slate-50 px-1.5 py-0.5 font-mono text-xs tracking-wide text-muted-foreground dark:bg-slate-900">
                    {item.code}
                </span>
                {!item.is_active && <Badge variant="secondary" className="text-[10px]">Inactivo</Badge>}
            </div>
            <p className="mt-1.5 font-semibold text-slate-800 dark:text-slate-100">{item.name}</p>
        </div>
    );

    /** Stock actual contra el mínimo, con aviso cuando hay que reponer. */
    const renderStock = (item: Item) => (
        <div className="space-y-1">
            <p className={`flex items-baseline gap-1 ${item.needs_restock ? 'font-bold text-red-600' : 'font-semibold text-slate-800 dark:text-slate-100'}`}>
                <span className="text-lg leading-none">{item.stock}</span>
                <span className="text-xs font-normal text-muted-foreground">mín. {item.stock_minimum}</span>
            </p>
            {item.needs_restock && (
                <span className="inline-flex w-fit items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                    <AlertTriangle className="h-3 w-3" /> Reponer
                </span>
            )}
        </div>
    );

    return (
        <>
            <Head title="Inventario" />

            <div className="mx-auto max-w-7xl space-y-6 p-4 pb-12 sm:p-6 lg:p-8">
                {/* Encabezado */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="shrink-0 rounded-lg bg-rose-100 p-2 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                            <Package className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl">Inventario</h1>
                            <p className="mt-1 text-sm text-muted-foreground md:text-base">
                                {items.total} {items.total === 1 ? 'item' : 'items'}
                            </p>
                        </div>
                    </div>
                    <Link href="/inventory/create" className="w-full sm:w-auto">
                        <Button className="h-10 w-full bg-rose-800 text-white shadow-md hover:bg-rose-900 sm:w-auto">
                            <Plus className="mr-1 h-4 w-4" /> Nuevo Item
                        </Button>
                    </Link>
                </div>

                {/* Chips de categoría + stock bajo */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1.5 dark:bg-slate-900" role="tablist">
                        {chips.map((chip) => {
                            const active = activeCategory === chip.key;
                            return (
                                <button
                                    key={chip.key || 'all'}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => go({ category: chip.key })}
                                    className={`flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                                        active
                                            ? 'bg-rose-800 text-white shadow-sm'
                                            : 'text-muted-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-slate-800'
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

                    <button
                        type="button"
                        aria-pressed={lowStock}
                        onClick={() => go({ low_stock: !lowStock })}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                            lowStock
                                ? 'border-red-600 bg-red-600 text-white shadow-sm'
                                : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300'
                        }`}
                    >
                        <AlertTriangle className="h-4 w-4" />
                        Stock bajo
                        {counts?.low_stock !== undefined && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${lowStock ? 'bg-white/20 text-white' : 'bg-white text-red-700 dark:bg-slate-800'}`}>
                                {counts.low_stock}
                            </span>
                        )}
                    </button>
                </div>

                {/* Búsqueda */}
                <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/40 sm:flex-row sm:items-center">
                    <Input
                        placeholder="Buscar por código, nombre o material..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-10 w-full bg-white dark:bg-slate-950 sm:max-w-md sm:flex-1"
                    />
                    <select
                        value={procedencia}
                        onChange={(e) => setProcedencia(e.target.value)}
                        className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm dark:bg-slate-950 sm:w-auto"
                    >
                        <option value="">Todas las procedencias</option>
                        <option value="Talca">Talca</option>
                        <option value="Santiago">Santiago</option>
                    </select>
                    <Button type="submit" variant="secondary" className="h-10 w-full sm:w-auto">
                        Buscar
                    </Button>
                </form>

                {/* ====== TARJETAS (móvil y tablet) ====== */}
                <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
                    {items.data.length === 0 ? (
                        <div className="rounded-xl border bg-card py-10 text-center text-muted-foreground sm:col-span-2">
                            <Package className="mx-auto mb-2 h-12 w-12 text-slate-300" />
                            No hay items para mostrar
                        </div>
                    ) : (
                        items.data.map((item) => (
                            <div
                                key={item.id}
                                className={`flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm ${item.is_active ? '' : 'opacity-60'}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    {renderProduct(item)}
                                    {renderCategory(item)}
                                </div>

                                <div>{renderOrigin(item)}</div>

                                <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Material</p>
                                        <p className="text-sm font-medium">{item.material || '—'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Precio</p>
                                        <p className="text-sm font-bold">{formatPrice(item.price)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Stock</p>
                                        {renderStock(item)}
                                    </div>
                                </div>

                                <div className="mt-auto flex items-center gap-2 border-t pt-4">
                                    <Link href={`/inventory/${item.id}`} className="flex-1">
                                        <Button variant="outline" className="h-10 w-full">
                                            <Eye className="mr-1.5 h-4 w-4" /> Ver detalle
                                        </Button>
                                    </Link>
                                    <RowMenu item={item} onDelete={() => handleDelete(item)} large />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* ====== TABLA (escritorio) ====== */}
                <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-sm lg:block">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                            <TableRow>
                                <TableHead className="h-12 px-5">Producto</TableHead>
                                <TableHead className="h-12 px-5">Categoría</TableHead>
                                <TableHead className="h-12 px-5">Material</TableHead>
                                <TableHead className="h-12 px-5">Precio</TableHead>
                                <TableHead className="h-12 px-5">Stock</TableHead>
                                <TableHead className="h-12 px-5 text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                        <Package className="mx-auto mb-2 h-12 w-12 text-slate-300" />
                                        No hay items para mostrar
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.data.map((item) => (
                                    <TableRow key={item.id} className={item.is_active ? 'hover:bg-slate-50 dark:hover:bg-slate-900/30' : 'bg-slate-50/50 opacity-60'}>
                                        <TableCell className="px-5 py-4">{renderProduct(item)}</TableCell>
                                        <TableCell className="px-5 py-4">
                                            <div className="flex flex-col items-start gap-2">
                                                {renderCategory(item)}
                                                {renderOrigin(item)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-sm">{item.material || '—'}</TableCell>
                                        <TableCell className="px-5 py-4 font-semibold">{formatPrice(item.price)}</TableCell>
                                        <TableCell className="px-5 py-4">{renderStock(item)}</TableCell>
                                        <TableCell className="whitespace-nowrap px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/inventory/${item.id}`}>
                                                    <Button variant="outline" size="sm" className="h-9">
                                                        <Eye className="mr-1 h-4 w-4" /> Ver
                                                    </Button>
                                                </Link>
                                                <RowMenu item={item} onDelete={() => handleDelete(item)} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {items.last_page > 1 && (
                    <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                        {items.links.map((link, i) => (
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