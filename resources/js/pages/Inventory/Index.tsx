import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Package, Box, FlaskConical, Truck, AlertTriangle } from 'lucide-react';
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
}

export default function InventoryIndex({ items, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [procedencia, setProcedencia] = useState(filters.procedencia || '');

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'ataud': return <Box className="h-4 w-4" />;
            case 'urna': return <FlaskConical className="h-4 w-4" />;
            default: return <Package className="h-4 w-4" />;
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/inventory', { search, category, procedencia, low_stock: filters.low_stock }, { preserveState: true });
    };

    const handleDelete = (item: Item) => {
        if (confirm(`¿Eliminar "${item.name}"?`)) {
            router.delete(`/inventory/${item.id}`);
        }
    };

    const formatPrice = (price: string) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(parseFloat(price));
    };

    return (
        <>
            <Head title="Inventario" />

            <div className="p-4 md:p-6 max-w-7xl mx-auto">
                {/* Encabezado */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">Inventario</h1>
                        <p className="text-muted-foreground mt-1 text-sm md:text-base">
                            Total: <span className="font-semibold text-slate-700 dark:text-slate-300">{items.total}</span> items registrados
                        </p>
                    </div>
                    <Link href="/inventory/create" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-rose-800 hover:bg-rose-900 text-white shadow-md">
                            Nuevo Item
                        </Button>
                    </Link>
                </div>

                {/* Contadores */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                        <Box className="h-4 w-4" />
                        <span>Ataúdes: <strong>{items.data.filter(i => i.category === 'ataud').length}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                        <FlaskConical className="h-4 w-4" />
                        <span>Urnas: <strong>{items.data.filter(i => i.category === 'urna').length}</strong></span>
                    </div>
                </div>

                {/* Filtros */}
                <form onSubmit={handleSearch} className="mb-6 flex flex-col sm:flex-row flex-wrap gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <Input
                        placeholder="Buscar por código, nombre o material..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:max-w-md bg-white dark:bg-slate-950"
                    />
                    <div className="grid grid-cols-2 sm:flex gap-2">
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="rounded-md border border-input bg-white dark:bg-slate-950 px-3 py-2 text-sm h-9"
                        >
                            <option value="">Categorías</option>
                            <option value="ataud">Ataúdes</option>
                            <option value="urna">Urnas</option>
                        </select>
                        <select
                            value={procedencia}
                            onChange={(e) => setProcedencia(e.target.value)}
                            className="rounded-md border border-input bg-white dark:bg-slate-950 px-3 py-2 text-sm h-9"
                        >
                            <option value="">Procedencias</option>
                            <option value="Talca">Talca</option>
                            <option value="Santiago">Santiago</option>
                        </select>
                    </div>
                    <Button type="submit" variant="secondary" className="w-full sm:w-auto">
                        Buscar
                    </Button>
                </form>

                {/* ====== VISTA MÓVIL ====== */}
                <div className="md:hidden space-y-3">
                    {items.data.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-card">No hay items en el inventario</div>
                    ) : (
                        items.data.map((item) => (
                            <div key={item.id} className="border rounded-xl bg-card p-4 space-y-3 shadow-sm">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                        <p className="font-mono text-xs text-muted-foreground">{item.code}</p>
                                        <p className="font-semibold truncate text-slate-800 dark:text-slate-100">{item.name}</p>
                                    </div>
                                    <Badge className={item.is_active ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                                        {item.is_active ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Badge className={item.category === 'ataud' ? 'bg-rose-800 text-white' : 'bg-slate-700 text-white'}>
                                        {getCategoryIcon(item.category)}
                                        <span className="ml-1">{item.category === 'ataud' ? 'Ataúd' : 'Urna'}</span>
                                    </Badge>
                                    {item.procedencia ? (
                                        <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700 flex items-center gap-1">
                                            <Truck className="h-3 w-3" /> {item.procedencia}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground">Sin procedencia</Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Material</p>
                                        <p>{item.material || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Precio</p>
                                        <p className="font-medium">{formatPrice(item.price)}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-muted-foreground">Stock</p>
                                        <p className={item.needs_restock ? 'text-red-600 font-bold flex items-center gap-1' : 'text-slate-700 dark:text-slate-300'}>
                                            {item.needs_restock && <AlertTriangle className="h-3 w-3" />}
                                            {item.stock} / min {item.stock_minimum}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2 border-t flex justify-end">
                                    <TableActions viewHref={`/inventory/${item.id}`} editHref={`/inventory/${item.id}/edit`} onDelete={() => handleDelete(item)} />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* ====== VISTA DESKTOP ====== */}
                <div className="hidden md:block border rounded-xl overflow-hidden bg-card shadow-sm">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                            <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Material</TableHead>
                                <TableHead>Procedencia</TableHead>
                                <TableHead>Precio</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.data.length === 0 ? (
                                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No hay items</TableCell></TableRow>
                            ) : (
                                items.data.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                        <TableCell className="font-mono text-sm">{item.code}</TableCell>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>
                                            <Badge className={`flex items-center gap-1.5 w-fit ${item.category === 'ataud' ? 'bg-rose-800 text-white hover:bg-rose-900' : 'bg-slate-700 text-white'}`}>
                                                {getCategoryIcon(item.category)}
                                                <span>{item.category === 'ataud' ? 'Ataúd' : 'Urna'}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{item.material || '—'}</TableCell>
                                        <TableCell>
                                            {item.procedencia ? (
                                                <Badge variant="outline" className="flex items-center gap-1.5 w-fit border-slate-300 bg-slate-50 text-slate-700">
                                                    <Truck className="h-3 w-3" /> <span>{item.procedencia}</span>
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{formatPrice(item.price)}</TableCell>
                                        <TableCell>
                                            <span className={`flex items-center gap-1 ${item.needs_restock ? 'text-red-600 font-bold' : ''}`}>
                                                {item.needs_restock && <AlertTriangle className="h-3 w-3" />}
                                                {item.stock} / min {item.stock_minimum}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={item.is_active ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                                                {item.is_active ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <TableActions viewHref={`/inventory/${item.id}`} editHref={`/inventory/${item.id}/edit`} onDelete={() => handleDelete(item)} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {items.last_page > 1 && (
                    <div className="mt-6 flex flex-wrap justify-center gap-1">
                        {items.links.map((link, i) => (
                            <Link key={i} href={link.url || '#'} className={`px-3 py-1 rounded-lg border text-sm transition-colors ${link.active ? 'bg-rose-800 text-white border-rose-800' : link.url ? 'hover:bg-slate-100 dark:hover:bg-slate-800' : 'opacity-50'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}