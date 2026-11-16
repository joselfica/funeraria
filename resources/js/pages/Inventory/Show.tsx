import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Box, FlaskConical, Truck, Pencil, AlertTriangle, CheckCircle2 } from 'lucide-react';

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
    size_cm: number | null;
    price: string;
    stock: number;
    stock_minimum: number;
    is_active: boolean;
    needs_restock: boolean;
    category_label: string;
    is_seremi_required: boolean;
    condition: string;
    condition_label: string;
}

interface Props {
    item: Item;
}

/** Colores por condición física del item. */
const conditionColors: Record<string, string> = {
    nuevo: 'border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    usado: 'border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100',
    reacondicionado: 'border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-100',
    dañado: 'border-rose-200 bg-rose-100 text-rose-800 hover:bg-rose-100',
};

export default function InventoryShow({ item }: Props) {
    const formatPrice = (price: string) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(parseFloat(price));

    return (
        <>
            <Head title={`Item ${item.code}`} />
            <div className="p-4 md:p-6 max-w-3xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-start gap-3">
                        <Link href="/inventory"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-3xl font-bold break-words text-slate-800 dark:text-slate-100">{item.name}</h1>
                            <p className="text-muted-foreground mt-1 font-mono text-sm">{item.code}</p>
                        </div>
                    </div>
                    <Link href={`/inventory/${item.id}/edit`} className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-rose-800 hover:bg-rose-900 text-white shadow-md"><Pencil className="h-4 w-4 mr-1" /> Editar</Button>
                    </Link>
                </div>

                {item.needs_restock && (
                    <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                        <div>
                            <p className="text-amber-800 dark:text-amber-300 font-bold text-sm">Stock crítico</p>
                            <p className="text-amber-700 dark:text-amber-400 text-sm">Este item está por debajo del mínimo requerido.</p>
                        </div>
                    </div>
                )}

                <Card className="shadow-sm border-t-4 border-t-rose-800/50">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/40"><CardTitle>Información del Item</CardTitle></CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="flex flex-wrap gap-2">
                            <Badge className={`flex items-center gap-1.5 ${item.category === 'ataud' ? 'bg-rose-800 text-white' : 'bg-slate-700 text-white'}`}>
                                {item.category === 'ataud' ? <Box className="h-3 w-3" /> : <FlaskConical className="h-3 w-3" />} {item.category_label}
                            </Badge>
                            <Badge className={item.is_active ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600'}>
                                {item.is_active ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null} {item.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                            <Badge className={conditionColors[item.condition] ?? 'border-slate-200 bg-slate-100 text-slate-700'}>
                                {item.condition_label}
                            </Badge>
                            {item.is_seremi_required && (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200">Obligatorio Seremi</Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-4">
                            <div><p className="text-sm text-muted-foreground">Material</p><p className="font-medium">{item.material || '—'}</p></div>
                            <div>
                                <p className="text-sm text-muted-foreground">Procedencia</p>
                                {item.procedencia ? (
                                    <Badge variant="outline" className="flex items-center gap-1.5 w-fit mt-1 border-slate-300 bg-slate-50 text-slate-700"><Truck className="h-3 w-3" /> {item.procedencia}</Badge>
                                ) : (<p className="font-medium">—</p>)}
                            </div>
                            <div><p className="text-sm text-muted-foreground">Medidas</p><p className="font-medium">{item.dimensions || '—'}</p></div>
                            <div><p className="text-sm text-muted-foreground">Tamaño</p><p className="font-medium">{item.size_cm ? `${item.size_cm} cm` : '—'}</p></div>
                            <div>
                                <p className="text-sm text-muted-foreground">Condición física</p>
                                <Badge className={`mt-1 ${conditionColors[item.condition] ?? 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                                    {item.condition_label}
                                </Badge>
                            </div>
                            <div><p className="text-sm text-muted-foreground">Precio</p><p className="font-bold text-lg text-slate-800 dark:text-slate-100">{formatPrice(item.price)}</p></div>
                            <div>
                                <p className="text-sm text-muted-foreground">Stock</p>
                                <p className={item.needs_restock ? 'text-red-600 font-bold' : 'font-medium'}>{item.stock} / mínimo {item.stock_minimum}</p>
                            </div>
                        </div>

                        {item.description && (
                            <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-1">Descripción</p>
                                <p className="whitespace-pre-line break-words text-sm">{item.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}