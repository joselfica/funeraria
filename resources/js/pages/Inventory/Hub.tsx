import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Box, FlaskConical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface CategoryStats {
    total: number;
    disponibles: number;
}

interface Props {
    stats: {
        ataudes: CategoryStats;
        urnas: CategoryStats;
    };
}

export default function InventoryHub({ stats }: Props) {
    const categories = [
        {
            key: 'ataud',
            title: 'Ataúdes',
            description: 'Para velatorio e inhumación',
            icon: <Box className="h-8 w-8" />,
            stats: stats.ataudes,
            singular: 'Ataúd',
            newLabel: 'Nuevo Ataúd',
        },
        {
            key: 'urna',
            title: 'Urnas',
            description: 'Para cenizas de cremación',
            icon: <FlaskConical className="h-8 w-8" />,
            stats: stats.urnas,
            singular: 'Urna',
            newLabel: 'Nueva Urna',
        },
    ];

    return (
        <>
            <Head title="Inventario" />

            <div className="mx-auto max-w-5xl space-y-6 p-4 pb-12 sm:p-6 lg:p-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl">Inventario</h1>
                    <p className="mt-1 text-sm text-muted-foreground md:text-base">Selecciona una categoría para ver su catálogo.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {categories.map((c) => (
                        <Card key={c.key} className="shadow-sm">
                            <CardContent className="space-y-5 p-6">
                                <div className="flex items-center gap-4">
                                    <div className="shrink-0 rounded-xl bg-rose-100 p-3 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                                        {c.icon}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{c.title}</h2>
                                        <p className="text-sm text-muted-foreground">{c.description}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-900/40">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Stock total</p>
                                        <p className="text-2xl font-bold">{c.stats.total}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Disponibles</p>
                                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{c.stats.disponibles}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Link href={`/inventory/${c.key}`} className="flex-1">
                                        <Button className="h-10 w-full bg-rose-800 text-white shadow-md hover:bg-rose-900">
                                            Ver catálogo <ArrowRight className="ml-1.5 h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Link href={`/inventory/create/${c.key}`}>
                                        <Button variant="outline" className="h-10 w-full sm:w-auto">
                                            <Plus className="mr-1 h-4 w-4" /> {c.newLabel}
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}