import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
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
    price: string;
    stock: number;
    stock_minimum: number;
    is_active: boolean;
    needs_restock: boolean;
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
                        <option value="ataud">Ataúdes</option>
                        <option value="urna">Urnas</option>
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
                                            <Badge variant={item.category === 'ataud' ? 'default' : 'secondary'}>
                                                {item.category === 'ataud' ? 'Ataúd' : 'Urna'}
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
                                        <TableCell className="text-right space-x-2">
                                            <Link href={`/inventory/${item.id}`}>
                                                <Button variant="ghost" size="sm">Ver</Button>
                                            </Link>
                                            <Link href={`/inventory/${item.id}/edit`}>
                                                <Button variant="ghost" size="sm">Editar</Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(item)}
                                            >
                                                Eliminar
                                            </Button>
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