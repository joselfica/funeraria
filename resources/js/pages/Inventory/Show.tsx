import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    ArrowLeft,
    Box,
    CalendarClock,
    CheckCircle2,
    FlaskConical,
    Pencil,
    Truck,
    Unlock,
} from 'lucide-react';

interface Item {
    id: number;
    uuid: string;
    category: 'ataud' | 'urna';
    category_label: string;
    code: string;
    name: string;
    description: string | null;
    material: string | null;
    procedencia: string | null;
    dimensions: string | null;
    size_cm: number | null;
    price: string | number;
    alert_threshold: number;
    is_active: boolean;
    is_seremi_required: boolean;
    condition: string | null;
    condition_label: string | null;
    condition_color: string | null;
    reserved_until: string | null;
    reserved_note: string | null;
    service_id: number | null;
}

interface ConditionOption {
    value: string;
    label: string;
    color: string;
}

interface Props {
    item: Item;
    conditions: ConditionOption[];
}

const conditionUrl = (id: number) => `/inventory/${id}/condition`;

const formatPrice = (price: string | number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(price));

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const selectClass =
    'h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:ring-2 focus:ring-rose-800/20 disabled:opacity-60';

export default function InventoryShow({ item, conditions }: Props) {
    const [busy, setBusy] = useState(false);
    const [reserveOpen, setReserveOpen] = useState(false);
    const [reserveDate, setReserveDate] = useState('');
    const [reserveNote, setReserveNote] = useState('');
    const [reserveError, setReserveError] = useState('');

    const isReserved = item.condition === 'reservado' && !!item.reserved_until;

    const changeCondition = (value: string) => {
        router.patch(conditionUrl(item.id), { condition: value }, { preserveScroll: true });
    };

    const openReserve = () => {
        setReserveDate('');
        setReserveNote('');
        setReserveError('');
        setReserveOpen(true);
    };

    const closeReserve = () => setReserveOpen(false);

    const submitReserve = (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = new Date(reserveDate);
        if (!reserveDate || isNaN(parsed.getTime())) {
            setReserveError('Indica una fecha y hora válidas.');
            return;
        }

        router.patch(
            conditionUrl(item.id),
            {
                condition: 'reservado',
                reserved_until: parsed.toISOString(),
                reserved_note: reserveNote,
            },
            {
                preserveScroll: true,
                onStart: () => setBusy(true),
                onFinish: () => setBusy(false),
                onSuccess: closeReserve,
                onError: (errors) =>
                    setReserveError(
                        errors.reserved_until ||
                            errors.reserved_note ||
                            'No se pudo reservar el item.',
                    ),
            },
        );
    };

    const release = () => {
        router.patch(conditionUrl(item.id), { condition: 'nuevo' }, { preserveScroll: true });
    };

    return (
        <>
            <Head title={`Item ${item.code}`} />
            <div className="mx-auto max-w-4xl space-y-6 p-4 pb-12 md:p-6">
                {/* Encabezado */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <Link href={`/inventory/${item.category}`} aria-label="Volver al catálogo">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="min-w-0">
                            <h1 className="break-words text-xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl">
                                {item.name}
                            </h1>
                            <p className="mt-1 font-mono text-sm text-muted-foreground">
                                {item.code}
                            </p>
                        </div>
                    </div>
                    <Link href={`/inventory/${item.id}/edit`} className="w-full sm:w-auto">
                        <Button className="w-full bg-rose-800 text-white shadow-md hover:bg-rose-900 sm:w-auto">
                            <Pencil className="mr-1 h-4 w-4" /> Editar
                        </Button>
                    </Link>
                </div>

                {/* Aviso de reserva activa */}
                {isReserved && (
                    <div className="flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/30">
                        <CalendarClock className="h-5 w-5 shrink-0 text-purple-500" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-purple-800 dark:text-purple-300">
                                Reservado hasta {formatDateTime(item.reserved_until!)}
                            </p>
                            {item.reserved_note && (
                                <p className="text-sm text-purple-700 dark:text-purple-400">
                                    {item.reserved_note}
                                </p>
                            )}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={release}>
                            <Unlock className="mr-1 h-4 w-4" /> Liberar
                        </Button>
                    </div>
                )}

                {/* Aviso servicio activo */}
                {item.service_id && (
                    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-500" />
                        <div>
                            <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                                En servicio
                            </p>
                            <Link
                                href={`/services/${item.service_id}`}
                                className="text-sm font-medium text-blue-700 underline dark:text-blue-300"
                            >
                                Ver servicio #{item.service_id}
                            </Link>
                        </div>
                    </div>
                )}

                {/* Información del item */}
                <Card className="border-t-4 border-t-rose-800/50 shadow-sm">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/40">
                        <CardTitle>Información del Item</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="flex flex-wrap gap-2">
                            <Badge
                                className={`flex items-center gap-1.5 ${
                                    item.category === 'ataud'
                                        ? 'bg-rose-800 text-white'
                                        : 'bg-slate-700 text-white'
                                }`}
                            >
                                {item.category === 'ataud' ? (
                                    <Box className="h-3 w-3" />
                                ) : (
                                    <FlaskConical className="h-3 w-3" />
                                )}{' '}
                                {item.category_label}
                            </Badge>
                            <Badge
                                className={
                                    item.is_active
                                        ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-100 text-slate-600'
                                }
                            >
                                {item.is_active && <CheckCircle2 className="mr-1 h-3 w-3" />}{' '}
                                {item.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                            {item.is_seremi_required && (
                                <Badge className="border-amber-200 bg-amber-100 text-amber-800">
                                    Obligatorio Seremi
                                </Badge>
                            )}
                            {item.condition_label && (
                                <Badge
                                    className={
                                        item.condition_color ??
                                        'border-slate-200 bg-slate-100 text-slate-700'
                                    }
                                >
                                    {item.condition_label}
                                </Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-x-8 gap-y-4 pt-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm text-muted-foreground">Material</p>
                                <p className="font-medium">{item.material || '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Procedencia</p>
                                {item.procedencia ? (
                                    <Badge
                                        variant="outline"
                                        className="mt-1 flex w-fit items-center gap-1.5 border-slate-300 bg-slate-50 text-slate-700"
                                    >
                                        <Truck className="h-3 w-3" /> {item.procedencia}
                                    </Badge>
                                ) : (
                                    <p className="font-medium">—</p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Medidas</p>
                                <p className="font-medium">{item.dimensions || '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tamaño</p>
                                <p className="font-medium">
                                    {item.size_cm ? `${item.size_cm} cm` : '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Precio</p>
                                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                    {formatPrice(item.price)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Condición física</p>
                                <select
                                    aria-label="Cambiar condición"
                                    value={item.condition ?? ''}
                                    disabled={!!item.service_id || busy}
                                    onChange={(e) => changeCondition(e.target.value)}
                                    className={`${selectClass} mt-1 w-full`}
                                >
                                    {conditions.map((c) => (
                                        <option key={c.value} value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {item.description && (
                            <div className="border-t pt-4">
                                <p className="mb-1 text-sm text-muted-foreground">Descripción</p>
                                <p className="whitespace-pre-line break-words text-sm">
                                    {item.description}
                                </p>
                            </div>
                        )}

                        {!isReserved && !item.service_id && (
                            <div className="border-t pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={openReserve}
                                    className="w-full sm:w-auto"
                                >
                                    <CalendarClock className="mr-1 h-4 w-4" /> Reservar
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal reservar */}
            {reserveOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Reservar item"
                >
                    <div className="absolute inset-0 bg-black/50" onClick={closeReserve} />
                    <div className="relative w-full max-w-md rounded-xl border bg-card p-5 shadow-xl">
                        <h2 className="mb-4 text-lg font-bold text-slate-800 dark:text-slate-100">
                            Reservar {item.code}
                        </h2>
                        <form onSubmit={submitReserve} className="space-y-4">
                            <div>
                                <Label htmlFor="reserved_until">Reservada hasta *</Label>
                                <Input
                                    id="reserved_until"
                                    type="datetime-local"
                                    value={reserveDate}
                                    onChange={(e) => setReserveDate(e.target.value)}
                                    className="mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="reserved_note">Nota (opcional)</Label>
                                <Input
                                    id="reserved_note"
                                    value={reserveNote}
                                    onChange={(e) => setReserveNote(e.target.value)}
                                    placeholder="Ej: velorio familia Pérez"
                                    maxLength={255}
                                    className="mt-1"
                                />
                            </div>
                            {reserveError && (
                                <p className="text-sm text-destructive">{reserveError}</p>
                            )}
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" onClick={closeReserve}>
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={busy}
                                    className="bg-rose-800 text-white hover:bg-rose-900"
                                >
                                    {busy ? 'Reservando...' : 'Reservar'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}