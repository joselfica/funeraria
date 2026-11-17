import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ArrowLeft, Box, CalendarClock, CheckCircle2, FlaskConical, Pencil, Plus, Trash2, Truck, Unlock } from 'lucide-react';

type UnitStatus = 'disponible' | 'reservada' | 'en_servicio' | 'no_disponible';

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
    price: string | number;
    stock: number; // unidades disponibles (se recalcula solo)
    stock_minimum: number;
    is_active: boolean;
    needs_restock: boolean;
    category_label: string;
    is_seremi_required: boolean;
}

interface Unit {
    id: number;
    label: string;
    condition: string;
    condition_label: string;
    status: UnitStatus;
    reserved_until: string | null;
    reserved_note: string | null;
    service_id: number | null;
}

interface ConditionOption {
    value: string;
    label: string;
    color: string; // ej. 'bg-emerald-100 text-emerald-800 border-emerald-200'
}

interface Props {
    item: Item;
    units: Unit[];
    conditions: ConditionOption[];
}

type Filter = 'all' | UnitStatus;

const statusStyles: Record<UnitStatus, { label: string; className: string }> = {
    disponible: { label: 'Disponible', className: 'border-emerald-200 bg-emerald-100 text-emerald-800' },
    reservada: { label: 'Reservada', className: 'border-purple-200 bg-purple-100 text-purple-800' },
    en_servicio: { label: 'En servicio', className: 'border-blue-200 bg-blue-100 text-blue-800' },
    no_disponible: { label: 'No disponible', className: 'border-rose-200 bg-rose-100 text-rose-800' },
};

const selectClass =
    'h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:ring-2 focus:ring-rose-800/20 disabled:opacity-60';

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Valor para <input type="datetime-local"> en hora local. */
const toLocalInput = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative w-full max-w-md rounded-xl border bg-card p-5 shadow-xl">
                <h2 className="mb-4 text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                {children}
            </div>
        </div>
    );
}

export default function InventoryShow({ item, units, conditions }: Props) {
    const [filter, setFilter] = useState<Filter>('all');

    // Modal "Reservar"
    const [reserveTarget, setReserveTarget] = useState<Unit | null>(null);
    const [reserveDate, setReserveDate] = useState('');
    const [reserveNote, setReserveNote] = useState('');
    const [reserveError, setReserveError] = useState('');
    const [busy, setBusy] = useState(false);

    // Modal "Agregar unidades"
    const [addOpen, setAddOpen] = useState(false);
    const [addQuantity, setAddQuantity] = useState('1');
    const [addCondition, setAddCondition] = useState('nuevo');
    const [addError, setAddError] = useState('');

    const formatPrice = (price: string | number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(price));

    const conditionClass = (value: string) =>
        conditions.find((c) => c.value === value)?.color ?? 'bg-slate-100 text-slate-700 border-slate-200';

    const counts: Record<Filter, number> = {
        all: units.length,
        disponible: units.filter((u) => u.status === 'disponible').length,
        reservada: units.filter((u) => u.status === 'reservada').length,
        en_servicio: units.filter((u) => u.status === 'en_servicio').length,
        no_disponible: units.filter((u) => u.status === 'no_disponible').length,
    };

    const filters: Array<{ key: Filter; label: string }> = [
        { key: 'all', label: 'Todas' },
        { key: 'disponible', label: 'Disponibles' },
        { key: 'reservada', label: 'Reservadas' },
        { key: 'en_servicio', label: 'En servicio' },
        { key: 'no_disponible', label: 'No disponibles' },
    ];

    const visibleUnits = filter === 'all' ? units : units.filter((u) => u.status === filter);

    // Resumen por condición física (todas las unidades)
    const byCondition = conditions
        .map((c) => ({ ...c, count: units.filter((u) => u.condition === c.value).length }))
        .filter((c) => c.count > 0);

    const changeCondition = (unit: Unit, value: string) => {
        router.patch(`/inventory-units/${unit.id}/condition`, { condition: value }, { preserveScroll: true });
    };

    const releaseUnit = (unit: Unit) => {
        router.delete(`/inventory-units/${unit.id}/reserve`, { preserveScroll: true });
    };

    const retireUnit = (unit: Unit) => {
        if (confirm(`¿Dar de baja la unidad ${unit.label}?`)) {
            router.delete(`/inventory-units/${unit.id}`, { preserveScroll: true });
        }
    };

    const openReserve = (unit: Unit) => {
        setReserveTarget(unit);
        setReserveDate('');
        setReserveNote('');
        setReserveError('');
    };

    const closeReserve = () => setReserveTarget(null);

    const submitReserve = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reserveTarget) return;

        const parsed = new Date(reserveDate); // datetime-local se interpreta como hora local
        if (!reserveDate || isNaN(parsed.getTime())) {
            setReserveError('Indica una fecha y hora válidas.');
            return;
        }

        router.post(
            `/inventory-units/${reserveTarget.id}/reserve`,
            { reserved_until: parsed.toISOString(), reserved_note: reserveNote },
            {
                preserveScroll: true,
                onStart: () => setBusy(true),
                onFinish: () => setBusy(false),
                onSuccess: closeReserve,
                onError: (errors) => setReserveError(errors.reserved_until || errors.reserved_note || 'No se pudo reservar la unidad.'),
            },
        );
    };

    const submitAdd = (e: React.FormEvent) => {
        e.preventDefault();
        setAddError('');

        router.post(
            `/inventory/${item.id}/units`,
            { quantity: addQuantity, condition: addCondition },
            {
                preserveScroll: true,
                onStart: () => setBusy(true),
                onFinish: () => setBusy(false),
                onSuccess: () => {
                    setAddOpen(false);
                    setAddQuantity('1');
                },
                onError: (errors) => setAddError(errors.quantity || errors.condition || 'No se pudieron agregar las unidades.'),
            },
        );
    };

    const renderStatus = (u: Unit) => (
        <div className="flex flex-col gap-0.5">
            <Badge className={`w-fit ${statusStyles[u.status].className}`}>
                {u.status === 'reservada' && <CalendarClock className="mr-1 h-3 w-3" />}
                {statusStyles[u.status].label}
            </Badge>
            {u.status === 'reservada' && u.reserved_until && (
                <span className="text-[11px] font-medium text-purple-700 dark:text-purple-300">
                    Hasta {formatDateTime(u.reserved_until)}
                    {u.reserved_note ? ` · ${u.reserved_note}` : ''}
                </span>
            )}
            {u.status === 'en_servicio' && u.service_id && (
                <Link href={`/services/${u.service_id}`} className="text-[11px] font-medium text-blue-700 underline dark:text-blue-300">
                    Ver servicio #{u.service_id}
                </Link>
            )}
        </div>
    );

    return (
        <>
            <Head title={`Item ${item.code}`} />
            <div className="mx-auto max-w-4xl space-y-6 p-4 pb-12 md:p-6">
                {/* Encabezado */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <Link href={`/inventory/${item.category}`} aria-label="Volver al catálogo">
                            <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
                        </Link>
                        <div className="min-w-0">
                            <h1 className="break-words text-xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl">{item.name}</h1>
                            <p className="mt-1 font-mono text-sm text-muted-foreground">{item.code}</p>
                        </div>
                    </div>
                    <Link href={`/inventory/${item.id}/edit`} className="w-full sm:w-auto">
                        <Button className="w-full bg-rose-800 text-white shadow-md hover:bg-rose-900 sm:w-auto"><Pencil className="mr-1 h-4 w-4" /> Editar</Button>
                    </Link>
                </div>

                {item.needs_restock && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                        <div>
                            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Stock crítico</p>
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                                Quedan {item.stock} {item.stock === 1 ? 'unidad disponible' : 'unidades disponibles'}, por debajo del mínimo de {item.stock_minimum}.
                            </p>
                        </div>
                    </div>
                )}

                {/* Información del producto */}
                <Card className="border-t-4 border-t-rose-800/50 shadow-sm">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/40"><CardTitle>Información del Item</CardTitle></CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="flex flex-wrap gap-2">
                            <Badge className={`flex items-center gap-1.5 ${item.category === 'ataud' ? 'bg-rose-800 text-white' : 'bg-slate-700 text-white'}`}>
                                {item.category === 'ataud' ? <Box className="h-3 w-3" /> : <FlaskConical className="h-3 w-3" />} {item.category_label}
                            </Badge>
                            <Badge className={item.is_active ? 'border-emerald-200 bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}>
                                {item.is_active && <CheckCircle2 className="mr-1 h-3 w-3" />} {item.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                            {item.is_seremi_required && (
                                <Badge className="border-amber-200 bg-amber-100 text-amber-800">Obligatorio Seremi</Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-x-8 gap-y-4 pt-4 sm:grid-cols-2">
                            <div><p className="text-sm text-muted-foreground">Material</p><p className="font-medium">{item.material || '—'}</p></div>
                            <div>
                                <p className="text-sm text-muted-foreground">Procedencia</p>
                                {item.procedencia ? (
                                    <Badge variant="outline" className="mt-1 flex w-fit items-center gap-1.5 border-slate-300 bg-slate-50 text-slate-700"><Truck className="h-3 w-3" /> {item.procedencia}</Badge>
                                ) : (<p className="font-medium">—</p>)}
                            </div>
                            <div><p className="text-sm text-muted-foreground">Medidas</p><p className="font-medium">{item.dimensions || '—'}</p></div>
                            <div><p className="text-sm text-muted-foreground">Tamaño</p><p className="font-medium">{item.size_cm ? `${item.size_cm} cm` : '—'}</p></div>
                            <div><p className="text-sm text-muted-foreground">Precio</p><p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatPrice(item.price)}</p></div>
                            <div>
                                <p className="text-sm text-muted-foreground">Unidades disponibles</p>
                                <p className={item.needs_restock ? 'font-bold text-red-600' : 'font-medium'}>
                                    {item.stock} de {units.length} / mínimo {item.stock_minimum}
                                </p>
                            </div>
                        </div>

                        {units.length > 0 && (
                            <div className="border-t pt-4">
                                <p className="mb-2 text-sm text-muted-foreground">Condición física de las unidades</p>
                                <div className="flex flex-wrap gap-2">
                                    {byCondition.map((c) => (
                                        <Badge key={c.value} className={c.color}>{c.label} · {c.count}</Badge>
                                    ))}
                                    {counts.reservada > 0 && (
                                        <Badge className={statusStyles.reservada.className}>Reservadas · {counts.reservada}</Badge>
                                    )}
                                </div>
                            </div>
                        )}

                        {item.description && (
                            <div className="border-t pt-4">
                                <p className="mb-1 text-sm text-muted-foreground">Descripción</p>
                                <p className="whitespace-pre-line break-words text-sm">{item.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Unidades */}
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-col gap-3 bg-slate-50 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>Unidades ({units.length})</CardTitle>
                        <Button
                            type="button"
                            onClick={() => { setAddError(''); setAddOpen(true); }}
                            className="h-9 w-full bg-rose-800 text-white hover:bg-rose-900 sm:w-auto"
                        >
                            <Plus className="mr-1 h-4 w-4" /> Agregar unidades
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="flex flex-wrap gap-1.5" role="tablist">
                            {filters.map((f) => (
                                <button
                                    key={f.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={filter === f.key}
                                    onClick={() => setFilter(f.key)}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                        filter === f.key
                                            ? 'bg-rose-800 text-white'
                                            : 'bg-slate-100 text-muted-foreground hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {f.label} <span className="opacity-80">({counts[f.key]})</span>
                                </button>
                            ))}
                        </div>

                        {units.length === 0 ? (
                            <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                                Este item no tiene unidades. Agrega las primeras con «Agregar unidades».
                            </div>
                        ) : visibleUnits.length === 0 ? (
                            <div className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                                No hay unidades en este estado.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {visibleUnits.map((u) => (
                                    <div
                                        key={u.id}
                                        className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="rounded-md border bg-slate-50 px-1.5 py-0.5 font-mono text-xs font-semibold dark:bg-slate-900">{u.label}</span>
                                            {renderStatus(u)}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <select
                                                aria-label={`Condición de ${u.label}`}
                                                value={u.condition}
                                                disabled={u.status === 'en_servicio'}
                                                onChange={(e) => changeCondition(u, e.target.value)}
                                                className={selectClass}
                                            >
                                                {conditions.map((c) => (
                                                    <option key={c.value} value={c.value}>{c.label}</option>
                                                ))}
                                            </select>

                                            {u.status === 'disponible' && (
                                                <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => openReserve(u)}>
                                                    <CalendarClock className="mr-1 h-4 w-4" /> Reservar
                                                </Button>
                                            )}
                                            {u.status === 'reservada' && (
                                                <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => releaseUnit(u)}>
                                                    <Unlock className="mr-1 h-4 w-4" /> Liberar
                                                </Button>
                                            )}
                                            {u.service_id === null && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-9 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                    onClick={() => retireUnit(u)}
                                                    aria-label={`Dar de baja ${u.label}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal: reservar una unidad */}
            {reserveTarget && (
                <Modal title={`Reservar ${reserveTarget.label}`} onClose={closeReserve}>
                    <form onSubmit={submitReserve} className="space-y-4">
                        <div>
                            <Label htmlFor="reserved_until">Reservada hasta *</Label>
                            <Input
                                id="reserved_until"
                                type="datetime-local"
                                min={toLocalInput(new Date())}
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
                        {reserveError && <p className="text-sm text-destructive">{reserveError}</p>}
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button type="button" variant="outline" onClick={closeReserve}>Cancelar</Button>
                            <Button type="submit" disabled={busy} className="bg-rose-800 text-white hover:bg-rose-900">
                                {busy ? 'Reservando...' : 'Reservar unidad'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal: agregar unidades */}
            {addOpen && (
                <Modal title="Agregar unidades" onClose={() => setAddOpen(false)}>
                    <form onSubmit={submitAdd} className="space-y-4">
                        <div>
                            <Label htmlFor="add_quantity">Cantidad *</Label>
                            <Input
                                id="add_quantity"
                                type="number"
                                min={1}
                                max={200}
                                step={1}
                                value={addQuantity}
                                onChange={(e) => setAddQuantity(e.target.value)}
                                className="mt-1"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="add_condition">Condición inicial *</Label>
                            <select
                                id="add_condition"
                                value={addCondition}
                                onChange={(e) => setAddCondition(e.target.value)}
                                className={`${selectClass} mt-1 w-full`}
                            >
                                {conditions.map((c) => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Se crearán unidades individuales numeradas a continuación de las existentes ({item.code}-01, {item.code}-02, …).
                        </p>
                        {addError && <p className="text-sm text-destructive">{addError}</p>}
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={busy} className="bg-rose-800 text-white hover:bg-rose-900">
                                {busy ? 'Agregando...' : 'Agregar'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}