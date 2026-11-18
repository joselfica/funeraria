import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Box, FlaskConical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface CategoryStats {
    disponibles: number;
    reservados: number;
    en_reparacion: number;
    vendidos: number;
}

interface Props {
    stats: {
        ataudes: CategoryStats;
        urnas: CategoryStats;
    };
}

type StateKey = 'disponibles' | 'reservados' | 'en_reparacion';

/** Estados que cuentan como stock. Los vendidos se muestran aparte. */
const STOCK_STATES: {
    key: StateKey;
    value: string;
    bar: string;
    chip: string;
}[] = [
    {
        key: 'disponibles',
        value: 'disponible',
        bar: 'bg-emerald-500',
        chip: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
    },
    {
        key: 'reservados',
        value: 'reservado',
        bar: 'bg-purple-500',
        chip: 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-950 dark:text-purple-300',
    },
    {
        key: 'en_reparacion',
        value: 'en_reparacion',
        bar: 'bg-amber-500',
        chip: 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300',
    },
];

/** Etiqueta con concordancia de género y número: "1 reservado", "2 reservadas". */
function stateLabel(key: StateKey | 'vendidos', count: number, feminine: boolean): string {
    const plural = count === 1 ? '' : 's';
    const vowel = feminine ? 'a' : 'o';

    switch (key) {
        case 'disponibles':
            return `disponible${plural}`;
        case 'reservados':
            return `reservad${vowel}${plural}`;
        case 'en_reparacion':
            return 'en reparación';
        case 'vendidos':
            return `vendid${vowel}${plural}`;
    }
}

export default function InventoryHub({ stats }: Props) {
    const categories = [
        {
            key: 'ataud',
            title: 'Ataúdes',
            description: 'Para velatorio e inhumación',
            icon: <Box className="h-8 w-8" />,
            stats: stats.ataudes,
            feminine: false,
            newLabel: 'Nuevo Ataúd',
        },
        {
            key: 'urna',
            title: 'Urnas',
            description: 'Para cenizas de cremación',
            icon: <FlaskConical className="h-8 w-8" />,
            stats: stats.urnas,
            feminine: true,
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
                    {categories.map((c) => {
                        const { disponibles, vendidos } = c.stats;
                        // El stock excluye los vendidos: ya no están en bodega.
                        const enInventario = STOCK_STATES.reduce((sum, s) => sum + c.stats[s.key], 0);
                        const todoLibre = enInventario > 0 && disponibles === enInventario;

                        return (
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

                                    <div className="space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-900/40">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold leading-none text-emerald-700 dark:text-emerald-400">
                                                {disponibles}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {enInventario === 0
                                                    ? 'Sin unidades en inventario'
                                                    : `${stateLabel('disponibles', disponibles, c.feminine)} de ${enInventario} en inventario`}
                                            </span>
                                        </div>

                                        <div
                                            className="flex h-2 gap-0.5 overflow-hidden rounded bg-slate-200 dark:bg-slate-800"
                                            role="img"
                                            aria-label={`${disponibles} de ${enInventario} unidades disponibles`}
                                        >
                                            {STOCK_STATES.map((s) =>
                                                c.stats[s.key] > 0 ? (
                                                    <div key={s.key} className={s.bar} style={{ flex: c.stats[s.key] }} />
                                                ) : null,
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-1.5">
                                            {STOCK_STATES.map((s) => {
                                                const count = c.stats[s.key];
                                                if (count === 0) return null;

                                                return (
                                                    <Link
                                                        key={s.key}
                                                        href={`/inventory/${c.key}?condition=${s.value}`}
                                                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${s.chip}`}
                                                    >
                                                        {count} {stateLabel(s.key, count, c.feminine)}
                                                    </Link>
                                                );
                                            })}
                                        </div>

                                        {vendidos > 0 ? (
                                            <p className="text-xs text-muted-foreground">
                                                <Link
                                                    href={`/inventory/${c.key}?condition=no_disponible`}
                                                    className="underline-offset-2 hover:underline"
                                                >
                                                    {vendidos} {stateLabel('vendidos', vendidos, c.feminine)}
                                                </Link>
                                                , ya no cuenta{vendidos === 1 ? '' : 'n'} en el stock
                                            </p>
                                        ) : todoLibre ? (
                                            <p className="text-xs text-muted-foreground">
                                                Todas las unidades están libres
                                            </p>
                                        ) : null}
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
                        );
                    })}
                </div>
            </div>
        </>
    );
}