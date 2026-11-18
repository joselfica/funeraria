import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Package,
    Box,
    FlaskConical,
    Truck,
    Plus,
    Eye,
    Pencil,
    Trash2,
    MoreVertical,
    ArrowLeft,
    CheckCircle2,
} from 'lucide-react';
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
    price: string | number;
    is_active: boolean;
    category_label: string;
    condition: string | null;
    condition_label: string | null;
    condition_color: string | null;
}

interface ConditionOption {
    value: string;
    label: string;
    color: string;
}

interface Props {
    items: {
        data: Item[];
        total: number;
    };
    category: 'ataud' | 'urna';
    filters: {
        search: string;
        category?: string;
        procedencia: string;
        low_stock: boolean;
    };
    conditions: ConditionOption[];
}

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

    const itemClass =
        'flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800';

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

export default function InventoryIndex({ items, category, filters, conditions }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [procedencia, setProcedencia] = useState(filters.procedencia || '');
    const [savingId, setSavingId] = useState<number | null>(null);

    const isAtaud = category === 'ataud';
    const categoryTitle = isAtaud ? 'Catálogo de Ataúdes' : 'Catálogo de Urnas';
    const baseUrl = `/inventory/${category}`;

    const go = (params: Partial<{ search: string; procedencia: string }>) => {
        router.get(
            baseUrl,
            {
                search: params.search ?? filters.search,
                procedencia: params.procedencia ?? filters.procedencia,
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

    const changeCondition = (item: Item, value: string) => {
        if (value === item.condition) return;
        setSavingId(item.id);
        router.patch(
            `/inventory/${item.id}/condition`,
            { condition: value },
            {
                preserveScroll: true,
                onFinish: () => setSavingId(null),
            },
        );
    };

    const formatPrice = (price: string | number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(
            Number(price),
        );
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'ataud':
                return <Box className="h-3.5 w-3.5" />;
            case 'urna':
                return <FlaskConical className="h-3.5 w-3.5" />;
            default:
                return <Package className="h-3.5 w-3.5" />;
        }
    };

    const renderCategory = (item: Item) => (
        <Badge
            className={`flex w-fit items-center gap-1.5 ${
                item.category === 'ataud'
                    ? 'bg-rose-800 text-white hover:bg-rose-900'
                    : 'bg-slate-700 text-white hover:bg-slate-800'
            }`}
        >
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

    const renderProduct = (item: Item) => (
        <div className="min-w-0">
            <div className="flex items-center gap-2">
                <span className="rounded-md border bg-slate-50 px-1.5 py-0.5 font-mono text-xs tracking-wide text-muted-foreground dark:bg-slate-900">
                    {item.code}
                </span>
                {!item.is_active && (
                    <Badge variant="secondary" className="text-[10px]">
                        Inactivo
                    </Badge>
                )}
            </div>
            <p className="mt-1.5 font-semibold text-slate-800 dark:text-slate-100">{item.name}</p>
        </div>
    );

    const renderConditionSelect = (item: Item) => {
        const currentCondition = conditions.find((c) => c.value === item.condition);
        const defaultColor = 'bg-slate-100 text-slate-700 border-slate-300';
        const colorClass = currentCondition?.color ?? defaultColor;

        return (
            <div className="flex items-center gap-2">
                <div className="relative inline-block w-full max-w-[140px]">
                    <select
                        aria-label={`Condición de ${item.code}`}
                        value={item.condition ?? ''}
                        disabled={savingId === item.id}
                        onChange={(e) => changeCondition(item, e.target.value)}
                        className={`h-8 w-full cursor-pointer appearance-none rounded-full border pl-3 pr-8 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-rose-800/20 disabled:opacity-60 ${colorClass} ${
                            savingId === item.id ? 'animate-pulse' : ''
                        }`}
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                            backgroundPosition: 'right 0.4rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '0.85em 0.85em',
                        }}
                    >
                        {conditions.map((c) => (
                            <option key={c.value} value={c.value} className="bg-white text-slate-800 font-normal">
                                {c.label}
                            </option>
                        ))}
                    </select>
                </div>
                {savingId === item.id && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 animate-spin text-emerald-500" />
                )}
            </div>
        );
    };

    return (
        <>
            <Head title={categoryTitle} />

            <div className="mx-auto max-w-7xl space-y-6 p-4 pb-12 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/inventory" aria-label="Volver al Hub de inventario">
                            <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="shrink-0 rounded-lg bg-rose-100 p-2 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                            {isAtaud ? (
                                <Box className="h-6 w-6 md:h-8 md:w-8" />
                            ) : (
                                <FlaskConical className="h-6 w-6 md:h-8 md:w-8" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl">
                                {categoryTitle}
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground md:text-base">
                                {items.total} {items.total === 1 ? 'modelo' : 'modelos'} registrados
                            </p>
                        </div>
                    </div>
                    <Link href={`/inventory/create/${category}`} className="w-full sm:w-auto">
                        <Button className="h-10 w-full bg-rose-800 text-white shadow-md hover:bg-rose-900 sm:w-auto">
                            <Plus className="mr-1 h-4 w-4" /> {isAtaud ? 'Nuevo Ataúd' : 'Nueva Urna'}
                        </Button>
                    </Link>
                </div>

                <form
                    onSubmit={handleSearch}
                    className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/40 sm:flex-row sm:items-center"
                >
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
                                className={`flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm ${
                                    item.is_active ? '' : 'opacity-60'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    {renderProduct(item)}
                                    {renderCategory(item)}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {renderOrigin(item)}
                                </div>

                                <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Material</p>
                                        <p className="text-sm font-medium">{item.material || '—'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Precio</p>
                                        <p className="text-sm font-bold">{formatPrice(item.price)}</p>
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <p className="text-xs text-muted-foreground">Condición</p>
                                        {renderConditionSelect(item)}
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
                                <TableHead className="h-12 px-5">Condición</TableHead>
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
                                    <TableRow
                                        key={item.id}
                                        className={
                                            item.is_active
                                                ? 'hover:bg-slate-50 dark:hover:bg-slate-900/30'
                                                : 'bg-slate-50/50 opacity-60'
                                        }
                                    >
                                        <TableCell className="px-5 py-4">{renderProduct(item)}</TableCell>
                                        <TableCell className="px-5 py-4">
                                            <div className="flex flex-col items-start gap-2">
                                                {renderCategory(item)}
                                                {renderOrigin(item)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-sm">
                                            {item.material || '—'}
                                        </TableCell>
                                        <TableCell className="px-5 py-4 font-semibold">
                                            {formatPrice(item.price)}
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            {renderConditionSelect(item)}
                                        </TableCell>
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
            </div>
        </>
    );
}