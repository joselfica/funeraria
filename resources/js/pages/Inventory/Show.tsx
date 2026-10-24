import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Item {
    id: number;
    uuid: string;
    category: 'ataud' | 'urna';
    code: string;
    name: string;
    description: string | null;
    material: string | null;
    dimensions: string | null;
    price: string;
    stock: number;
    stock_minimum: number;
    is_active: boolean;
    needs_restock: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    item: Item;
}

export default function InventoryShow({ item }: Props) {
    const formatPrice = (price: string) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(parseFloat(price));

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('es-CL', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

    return (
        <AppLayout>
            <Head title={item.name} />

            <div className="p-6 max-w-3xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{item.name}</h1>
                        <p className="text-muted-foreground mt-1 font-mono text-sm">{item.code}</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/inventory">
                            <Button variant="outline">Volver</Button>
                        </Link>
                        <Link href={`/inventory/${item.id}/edit`}>
                            <Button>Editar</Button>
                        </Link>
                    </div>
                </div>

                {item.needs_restock && (
                    <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                        <p className="text-destructive font-medium">
                            ⚠️ Stock bajo — Este item necesita reposición
                        </p>
                    </div>
                )}

                <Card className="mb-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Información del Item</CardTitle>
                        <div className="flex gap-2">
                            <Badge variant={item.category === 'ataud' ? 'default' : 'secondary'}>
                                {item.category === 'ataud' ? 'Ataúd' : 'Urna'}
                            </Badge>
                            <Badge variant={item.is_active ? 'default' : 'secondary'}>
                                {item.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <dl className="divide-y">
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Código</dt>
                                <dd className="col-span-2 font-mono">{item.code}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Material</dt>
                                <dd className="col-span-2">{item.material || '—'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Medidas</dt>
                                <dd className="col-span-2">{item.dimensions || '—'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Precio</dt>
                                <dd className="col-span-2 font-medium">{formatPrice(item.price)}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Stock</dt>
                                <dd className={`col-span-2 ${item.needs_restock ? 'text-destructive font-bold' : ''}`}>
                                    {item.stock} unidades (mínimo: {item.stock_minimum})
                                </dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Descripción</dt>
                                <dd className="col-span-2">{item.description || '—'}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Metadatos</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2 text-muted-foreground">
                        <div className="flex justify-between">
                            <span>Creado:</span>
                            <span>{formatDate(item.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Última actualización:</span>
                            <span>{formatDate(item.updated_at)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}