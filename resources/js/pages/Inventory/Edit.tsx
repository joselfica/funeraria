import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface FormData {
    category: 'ataud' | 'urna';
    code: string;
    name: string;
    description: string;
    material: string;
    procedencia: string;
    dimensions: string;
    price: string;
    stock: string;
    stock_minimum: string;
    is_active: boolean;
    size_cm: string;
    condition: string;
}

interface Item {
    id: number;
    uuid: string;
    category: 'ataud' | 'urna';
    code: string;
    name: string;
    description: string | null;
    material: string | null;
    procedencia: string | null;
    dimensions: string | null;
    price: string;
    stock: number;
    stock_minimum: number;
    is_active: boolean;
    size_cm: number | null;
    condition: string;
}

interface Props {
    item: Item;
    conditions: Array<{ value: string; label: string }>;
}

export default function InventoryEdit({ item, conditions }: Props) {
    const { data, setData, put, processing, errors } = useForm<FormData>({
        category: item.category,
        code: item.code,
        name: item.name,
        description: item.description || '',
        material: item.material || '',
        procedencia: item.procedencia || '',
        dimensions: item.dimensions || '',
        price: item.price,
        stock: String(item.stock),
        stock_minimum: String(item.stock_minimum),
        is_active: item.is_active,
        size_cm: item.size_cm != null ? String(item.size_cm) : '',
        condition: item.condition || 'nuevo',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/inventory/${item.id}`);
    };

    return (
        <>
            <Head title="Editar Item" />
            <div className="p-4 md:p-6 max-w-3xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">Editar Item</h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">Actualizar información de <span className="font-mono font-semibold">{item.code}</span></p>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/40">
                        <CardTitle>Información del Item</CardTitle>
                        <CardDescription>Modifica los datos necesarios.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="category">Categoría *</Label>
                                    <select id="category" value={data.category} onChange={(e) => setData('category', e.target.value as 'ataud' | 'urna')} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm mt-1 focus:ring-2 focus:ring-rose-800/20">
                                        <option value="ataud">Ataúd</option>
                                        <option value="urna">Urna</option>
                                    </select>
                                    {errors.category && <p className="text-sm text-destructive mt-1">{errors.category}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="code">Código (SKU) *</Label>
                                    <Input id="code" value={data.code} onChange={(e) => setData('code', e.target.value)} className="mt-1" required />
                                    {errors.code && <p className="text-sm text-destructive mt-1">{errors.code}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="material">Material</Label>
                                    <Input id="material" value={data.material} onChange={(e) => setData('material', e.target.value)} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="procedencia">Procedencia / Distribuidor *</Label>
                                    <select id="procedencia" value={data.procedencia} onChange={(e) => setData('procedencia', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm mt-1 focus:ring-2 focus:ring-rose-800/20" required>
                                        <option value="">Seleccione una opción</option>
                                        <option value="Talca">Talca</option>
                                        <option value="Santiago">Santiago</option>
                                    </select>
                                    {errors.procedencia && <p className="text-sm text-destructive mt-1">{errors.procedencia}</p>}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="name">Nombre *</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1" required />
                                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="dimensions">Medidas</Label>
                                    <Input id="dimensions" value={data.dimensions} onChange={(e) => setData('dimensions', e.target.value)} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="size_cm">Tamaño (cm)</Label>
                                    <Input id="size_cm" type="number" value={data.size_cm} onChange={(e) => setData('size_cm', e.target.value)} className="mt-1" />
                                    <p className="text-xs text-muted-foreground mt-1">Las urnas de 30, 40 y 60 cm son obligatorias por la Seremi.</p>
                                </div>
                            </div>

                            {/* 👇 NUEVO: Condición física */}
                            <div>
                                <Label htmlFor="condition">Condición física *</Label>
                                <select
                                    id="condition"
                                    value={data.condition}
                                    onChange={(e) => setData('condition', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm mt-1 focus:ring-2 focus:ring-rose-800/20"
                                    required
                                >
                                    {conditions.map((c) => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                                {errors.condition && <p className="text-sm text-destructive mt-1">{errors.condition}</p>}
                            </div>

                            <div>
                                <Label htmlFor="price">Precio (CLP) *</Label>
                                <Input id="price" type="number" step="0.01" value={data.price} onChange={(e) => setData('price', e.target.value)} className="mt-1" required />
                                {errors.price && <p className="text-sm text-destructive mt-1">{errors.price}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="stock">Stock actual *</Label>
                                    <Input id="stock" type="number" value={data.stock} onChange={(e) => setData('stock', e.target.value)} className="mt-1" required />
                                    {errors.stock && <p className="text-sm text-destructive mt-1">{errors.stock}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="stock_minimum">Stock mínimo *</Label>
                                    <Input id="stock_minimum" type="number" value={data.stock_minimum} onChange={(e) => setData('stock_minimum', e.target.value)} className="mt-1" required />
                                    {errors.stock_minimum && <p className="text-sm text-destructive mt-1">{errors.stock_minimum}</p>}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Descripción</Label>
                                <textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={3} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-rose-800/20" />
                            </div>

                            <div className="flex items-center gap-2">
                                <input id="is_active" type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-rose-800 focus:ring-rose-800" />
                                <Label htmlFor="is_active">Item activo</Label>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t">
                                <Link href="/inventory" className="w-full sm:w-auto"><Button type="button" variant="outline" className="w-full sm:w-auto">Cancelar</Button></Link>
                                <Button type="submit" disabled={processing} className="w-full sm:w-auto bg-rose-800 hover:bg-rose-900 text-white shadow-md">
                                    {processing ? 'Guardando...' : 'Actualizar Item'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}