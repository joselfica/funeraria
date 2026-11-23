import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    HandHeart, Plus, Calendar, DollarSign, Package,
    FileText, Search, X, User, Phone, Pencil, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface Creator {
    id: number;
    name: string;
}

interface Donation {
    id: number;
    uuid: string;
    beneficiary_name: string;
    beneficiary_rut: string | null;
    contact_person: string | null;
    type: 'dinero' | 'especie';
    amount: string | number | null;
    description: string | null;
    donation_date: string;
    receipt_path: string | null;
    notes: string | null;
    creator: Creator | null;
}

interface Props {
    donations: Donation[];
}

const formatPrice = (amount: number | string | null) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(amount ?? 0));

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

export default function DonationsIndex({ donations }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        beneficiary_name: '',
        beneficiary_rut: '',
        contact_person: '',
        type: 'dinero',
        amount: '',
        description: '',
        donation_date: new Date().toISOString().split('T')[0],
        receipt: null as File | null,
        notes: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/donations', {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
        });
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    // ──────────────────────────────────────────────────────────
    // Filtro local por nombre, RUT o contacto
    // ──────────────────────────────────────────────────────────
    const term = search.trim().toLowerCase();
    const visible = donations.filter((d) => {
        if (!term) return true;
        return (
            d.beneficiary_name.toLowerCase().includes(term) ||
            (d.beneficiary_rut ?? '').toLowerCase().includes(term) ||
            (d.contact_person ?? '').toLowerCase().includes(term)
        );
    });

    // ──────────────────────────────────────────────────────────
    // Resumen
    // ──────────────────────────────────────────────────────────
    const totalDinero = donations
        .filter((d) => d.type === 'dinero')
        .reduce((sum, d) => sum + Number(d.amount ?? 0), 0);
    const totalEspecie = donations.filter((d) => d.type === 'especie').length;

    const renderTypeBadge = (d: Donation) =>
        d.type === 'dinero' ? (
            <Badge className="flex w-fit items-center gap-1 border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                <DollarSign className="h-3 w-3" /> Dinero
            </Badge>
        ) : (
            <Badge className="flex w-fit items-center gap-1 border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100">
                <Package className="h-3 w-3" /> Especie
            </Badge>
        );

    return (
        <>
            <Head title="Donaciones" />

            <div className="mx-auto max-w-7xl space-y-6 p-4 pb-12 sm:p-6 lg:p-8">
                {/* ─────────────── ENCABEZADO ─────────────── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="shrink-0 rounded-lg bg-rose-100 p-2 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                            <HandHeart className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl">
                                Registro de Donaciones
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground md:text-base">
                                Trazabilidad de aportes a equipos deportivos e instituciones.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="h-10 w-full bg-rose-800 text-white shadow-md hover:bg-rose-900 sm:w-auto"
                    >
                        <Plus className="mr-1 h-4 w-4" /> Nueva Donación
                    </Button>
                </div>

                {/* ─────────────── RESUMEN RÁPIDO ─────────────── */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
                            <DollarSign className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Total en dinero</p>
                            <p className="truncate text-lg font-bold">{formatPrice(totalDinero)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
                            <Package className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Donaciones en especie</p>
                            <p className="truncate text-lg font-bold">{totalEspecie}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600">
                            <HandHeart className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Total de donaciones</p>
                            <p className="truncate text-lg font-bold">{donations.length}</p>
                        </div>
                    </div>
                </div>

                {/* ─────────────── BÚSQUEDA ─────────────── */}
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/40">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por beneficiario, RUT o contacto..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-10 bg-white pl-9 dark:bg-slate-950"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-800"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ─────────────── TARJETAS (móvil y tablet) ─────────────── */}
                <div className="grid grid-cols-1 gap-4 lg:hidden">
                    {visible.length === 0 ? (
                        <div className="rounded-xl border bg-card py-10 text-center text-muted-foreground">
                            <HandHeart className="mx-auto mb-2 h-12 w-12 text-slate-300" />
                            No hay donaciones para mostrar.
                        </div>
                    ) : (
                        visible.map((d) => (
                            <div
                                key={d.id}
                                className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold">{d.beneficiary_name}</p>
                                        {d.beneficiary_rut && (
                                            <p className="text-xs text-muted-foreground">{d.beneficiary_rut}</p>
                                        )}
                                    </div>
                                    {renderTypeBadge(d)}
                                </div>

                                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                                    <p className="text-xs text-muted-foreground">Detalle</p>
                                    <p className="mt-0.5 font-bold">
                                        {d.type === 'dinero' ? formatPrice(d.amount) : d.description}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> {formatDate(d.donation_date)}
                                    </span>
                                    {d.contact_person && (
                                        <span className="inline-flex items-center gap-1">
                                            <User className="h-3 w-3" /> {d.contact_person}
                                        </span>
                                    )}
                                    {d.creator && <span>Registrado por {d.creator.name}</span>}
                                </div>

                                {d.receipt_path && (
                                    <a
                                        href={`/storage/${d.receipt_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex w-fit items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                    >
                                        <FileText className="h-3.5 w-3.5" /> Ver comprobante
                                    </a>
                                )}

                                <div className="flex gap-2 pt-1">
                                    <Link href={`/donations/${d.id}`} className="flex-1">
                                        <Button variant="outline" className="w-full">
                                            <Eye className="mr-1 h-4 w-4" /> Ver detalle
                                        </Button>
                                    </Link>
                                    <Link href={`/donations/${d.id}/edit`} className="flex-1">
                                        <Button variant="outline" className="w-full">
                                            <Pencil className="mr-1 h-4 w-4" /> Editar
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* ─────────────── TABLA (escritorio) ─────────────── */}
                <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-sm lg:block">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/40">
                            <TableRow>
                                <TableHead className="h-12 px-5">Fecha</TableHead>
                                <TableHead className="h-12 px-5">Beneficiario</TableHead>
                                <TableHead className="h-12 px-5">Tipo</TableHead>
                                <TableHead className="h-12 px-5">Detalle / Monto</TableHead>
                                <TableHead className="h-12 px-5">Registrado por</TableHead>
                                <TableHead className="h-12 px-5 text-right">Comprobante</TableHead>
                                <TableHead className="h-12 px-5 text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visible.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                        <HandHeart className="mx-auto mb-2 h-12 w-12 text-slate-300" />
                                        No hay donaciones para mostrar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                visible.map((d) => (
                                    <TableRow key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                        <TableCell className="px-5 py-4 font-medium">
                                            {formatDate(d.donation_date)}
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <p className="font-semibold">{d.beneficiary_name}</p>
                                            {d.contact_person && (
                                                <p className="text-xs text-muted-foreground">{d.contact_person}</p>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-5 py-4">{renderTypeBadge(d)}</TableCell>
                                        <TableCell className="px-5 py-4">
                                            {d.type === 'dinero' ? (
                                                <span className="font-bold">{formatPrice(d.amount)}</span>
                                            ) : (
                                                <span>{d.description}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                                            {d.creator?.name ?? '—'}
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-right">
                                            {d.receipt_path ? (
                                                <a
                                                    href={`/storage/${d.receipt_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                                >
                                                    <FileText className="h-3.5 w-3.5" /> Ver
                                                </a>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Link href={`/donations/${d.id}`}>
                                                    <Button variant="ghost" size="sm" aria-label="Ver" title="Ver">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/donations/${d.id}/edit`}>
                                                    <Button variant="ghost" size="sm" aria-label="Editar" title="Editar">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* ─────────────── MODAL DE REGISTRO ─────────────── */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Registrar donación"
                >
                    <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
                    <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border bg-card p-5 shadow-xl">
                        <div className="mb-4 flex items-start justify-between gap-2">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
                                <HandHeart className="h-5 w-5 text-rose-800" /> Registrar Donación
                            </h2>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-md p-1 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                                aria-label="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="beneficiary_name">Beneficiario (Equipo / Institución) *</Label>
                                    <Input
                                        id="beneficiary_name"
                                        value={data.beneficiary_name}
                                        onChange={(e) => setData('beneficiary_name', e.target.value)}
                                        placeholder="Ej: Club Deportivo Temuco"
                                        required
                                        className="mt-1"
                                    />
                                    {errors.beneficiary_name && (
                                        <p className="mt-1 text-xs text-destructive">{errors.beneficiary_name}</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="beneficiary_rut">RUT Beneficiario</Label>
                                        <Input
                                            id="beneficiary_rut"
                                            value={data.beneficiary_rut}
                                            onChange={(e) => setData('beneficiary_rut', e.target.value)}
                                            placeholder="12.345.678-9"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="contact_person">Persona de Contacto</Label>
                                        <Input
                                            id="contact_person"
                                            value={data.contact_person}
                                            onChange={(e) => setData('contact_person', e.target.value)}
                                            placeholder="Ej: Juan Pérez"
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 rounded-lg border bg-slate-50 p-3 dark:bg-slate-900/40 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="type">Tipo *</Label>
                                    <select
                                        id="type"
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value)}
                                        className="mt-1 h-10 w-full rounded-md border bg-white px-3 dark:bg-slate-950"
                                    >
                                        <option value="dinero">Dinero</option>
                                        <option value="especie">Especie (Material)</option>
                                    </select>
                                </div>
                                {data.type === 'dinero' ? (
                                    <div>
                                        <Label htmlFor="amount">Monto ($) *</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            placeholder="Ej: 500000"
                                            required
                                            className="mt-1"
                                        />
                                        {errors.amount && (
                                            <p className="mt-1 text-xs text-destructive">{errors.amount}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <Label htmlFor="description">¿Qué se donó? *</Label>
                                        <Input
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Ej: 2 juegos de camisetas"
                                            required
                                            className="mt-1"
                                        />
                                        {errors.description && (
                                            <p className="mt-1 text-xs text-destructive">{errors.description}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="donation_date">Fecha de Donación *</Label>
                                <Input
                                    id="donation_date"
                                    type="date"
                                    value={data.donation_date}
                                    onChange={(e) => setData('donation_date', e.target.value)}
                                    required
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="receipt">Comprobante (PDF o Imagen)</Label>
                                <Input
                                    id="receipt"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) =>
                                        setData('receipt', e.target.files ? e.target.files[0] : null)
                                    }
                                    className="mt-1"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Máx. 5 MB. PDF, JPG o PNG.
                                </p>
                                {errors.receipt && (
                                    <p className="mt-1 text-xs text-destructive">{errors.receipt}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="notes">Notas Adicionales</Label>
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    placeholder="Detalles sobre el acuerdo..."
                                />
                            </div>

                            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" onClick={closeModal}>
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-rose-800 text-white hover:bg-rose-900"
                                >
                                    {processing ? 'Guardando...' : 'Guardar Donación'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}