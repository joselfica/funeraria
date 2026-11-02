import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Package, Box, FlaskConical } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
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
        low_stock: boolean;
    };
}

export default function InventoryIndex({ items, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'ataud':
                return <Box className="h-4 w-4" />;
            case 'urna':
                return <FlaskConical className="h-4 w-4" />;
            default:
                return <Package className="h-4 w-4" />;
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/inventory', { search, category, low_stock: filters.low_stock }, { preserveState: true });
    };

    const handleDelete = (item: Item) => {
        if (confirm(`¿Eliminar "${item.name}"?`)) {
            router.delete(`/inventory/${item.id}`);
        }
    };

    const formatPrice = (price: string) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
        }).format(parseFloat(price));
    };

    return (
        <AppLayout>
            <Head title="Inventario" />

            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Inventario</h1>
                        <p className="text-muted-foreground mt-1">
                            Total: {items.total} items
                        </p>
                    </div>
                    <Link href="/inventory/create">
                        <Button>Nuevo Item</Button>
                    </Link>
                </div>

                <div className="flex items-center gap-6 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Box className="h-4 w-4 text-muted-foreground" />
                        <span>Ataúdes: <strong>{items.data.filter(i => i.category === 'ataud').length}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-muted-foreground" />
                        <span>Urnas: <strong>{items.data.filter(i => i.category === 'urna').length}</strong></span>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                    <Input
                        placeholder="Buscar por código, nombre o material..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-md"
                    />
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="rounded-md border border-input bg-transparent px-3 text-sm"
                    >
                        <option value="">Todas las categorías</option>
                        <option value="ataud">Ataúdes (cuerpo completo)</option>
                        <option value="urna">Urnas (cenizas)</option>
                    </select>
                    <Button type="submit" variant="secondary">
                        Buscar
                    </Button>
                </form>

                <div className="border rounded-lg overflow-hidden bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Material</TableHead>
                                <TableHead>Precio</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        No hay items en el inventario
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-mono text-sm">{item.code}</TableCell>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={item.category === 'ataud' ? 'default' : 'secondary'}
                                                className="flex items-center gap-1.5 w-fit"
                                            >
                                                {getCategoryIcon(item.category)}
                                                <span>{item.category === 'ataud' ? 'Ataúd' : 'Urna'}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{item.material || '—'}</TableCell>
                                        <TableCell>{formatPrice(item.price)}</TableCell>
                                        <TableCell>
                                            <span className={item.needs_restock ? 'text-destructive font-bold' : ''}>
                                                {item.stock} / min {item.stock_minimum}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={item.is_active ? 'default' : 'secondary'}>
                                                {item.is_active ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <TableActions
                                                viewHref={`/inventory/${item.id}`}
                                                editHref={`/inventory/${item.id}/edit`}
                                                onDelete={() => handleDelete(item)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {items.last_page > 1 && (
                    <div className="mt-4 flex justify-center gap-1">
                        {items.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`px-3 py-1 rounded border text-sm ${
                                    link.active
                                        ? 'bg-primary text-primary-foreground'
                                        : link.url
                                        ? 'hover:bg-accent'
                                        : 'opacity-50 cursor-not-allowed'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}