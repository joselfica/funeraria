import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    CheckCircle2,
    Handshake,
    Mail,
    Pencil,
    Phone,
    Plus,
    Power,
    PowerOff,
    Search,
    User,
    XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Agreement {
    id: number;
    name: string;
    rut: string | null;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    discount_percentage: number | string;
    is_active: boolean;
    notes: string | null;
}

export default function AgreementsIndex({ agreements }: { agreements: Agreement[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAgreement, setEditingAgreement] = useState<Agreement | null>(null);
    const [search, setSearch] = useState('');

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        rut: '',
        contact_person: '',
        phone: '',
        email: '',
        discount_percentage: '10',
        notes: '',
    });

    const openCreateModal = () => {
        setEditingAgreement(null);
        clearErrors();
        reset();
        setData('discount_percentage', '10');
        setIsModalOpen(true);
    };

    const openEditModal = (agreement: Agreement) => {
        setEditingAgreement(agreement);
        clearErrors();
        setData({
            name: agreement.name,
            rut: agreement.rut || '',
            contact_person: agreement.contact_person || '',
            phone: agreement.phone || '',
            email: agreement.email || '',
            discount_percentage: String(Number(agreement.discount_percentage)),
            notes: agreement.notes || '',
        });
        setIsModalOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAgreement) {
            put(`/agreements/${editingAgreement.id}`, {
                preserveScroll: true,
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post('/agreements', {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const toggleStatus = (agreement: Agreement) => {
        router.patch(`/agreements/${agreement.id}/toggle-active`, {}, { preserveScroll: true });
    };

    const filteredAgreements = agreements.filter((a) => {
        const term = search.trim().toLowerCase();
        if (!term) return true;

        return (
            a.name.toLowerCase().includes(term) ||
            (a.rut?.toLowerCase().includes(term) ?? false) ||
            (a.contact_person?.toLowerCase().includes(term) ?? false)
        );
    });

    const activeCount = agreements.filter((a) => a.is_active).length;
    const inactiveCount = agreements.length - activeCount;

    return (
        <>
            <Head title="Convenios" />

            <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
                {/* ─────────────── ENCABEZADO ─────────────── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="shrink-0 rounded-lg bg-rose-100 p-2 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                            <Handshake className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 sm:text-2xl md:text-3xl">
                                Convenios Institucionales
                            </h1>
                            <p className="mt-0.5 text-sm text-muted-foreground md:text-base">
                                Gestiona los descuentos y acuerdos comerciales con instituciones externas.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={openCreateModal}
                        className="w-full bg-rose-800 text-white shadow-sm hover:bg-rose-900 sm:w-auto"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Convenio
                    </Button>
                </div>

                {/* ─────────────── RESUMEN RÁPIDO ─────────────── */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Total
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">
                            {agreements.length}
                        </p>
                    </div>
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Activos
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-2xl font-bold text-emerald-600">
                            <CheckCircle2 className="h-5 w-5" /> {activeCount}
                        </p>
                    </div>
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Inactivos
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-2xl font-bold text-slate-400">
                            <XCircle className="h-5 w-5" /> {inactiveCount}
                        </p>
                    </div>
                </div>

                {/* ─────────────── BUSCADOR ─────────────── */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, RUT o contacto..."
                        className="w-full bg-white pl-9 dark:bg-slate-950 sm:max-w-md"
                    />
                </div>

                {/* ─────────────── VISTA MÓVIL ─────────────── */}
                <div className="space-y-3 md:hidden">
                    {filteredAgreements.length === 0 ? (
                        <div className="rounded-xl border bg-card py-10 text-center text-muted-foreground">
                            <Handshake className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                            <p>{agreements.length === 0 ? 'No hay convenios registrados.' : 'Sin resultados para tu búsqueda.'}</p>
                        </div>
                    ) : (
                        filteredAgreements.map((agreement) => (
                            <div
                                key={agreement.id}
                                className={`space-y-3 rounded-xl border bg-card p-4 shadow-sm ${agreement.is_active ? '' : 'bg-slate-50/60 opacity-80'}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-bold text-slate-800 dark:text-slate-100">
                                            {agreement.name}
                                        </p>
                                        {agreement.rut && (
                                            <p className="font-mono text-xs text-muted-foreground">{agreement.rut}</p>
                                        )}
                                    </div>
                                    {agreement.is_active ? (
                                        <Badge className="shrink-0 border-emerald-200 bg-emerald-100 text-emerald-800">
                                            Activo
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="shrink-0 border-rose-200 bg-rose-50 text-rose-700">
                                            Inactivo
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950/20">
                                    <span className="text-xs text-emerald-700 dark:text-emerald-400">Descuento</span>
                                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                        {Number(agreement.discount_percentage)}%
                                    </span>
                                </div>

                                {(agreement.contact_person || agreement.phone || agreement.email) && (
                                    <div className="space-y-1 border-t pt-2 text-xs text-muted-foreground">
                                        {agreement.contact_person && (
                                            <p className="flex items-center gap-1.5">
                                                <User className="h-3 w-3" /> {agreement.contact_person}
                                            </p>
                                        )}
                                        {agreement.phone && (
                                            <p className="flex items-center gap-1.5">
                                                <Phone className="h-3 w-3" /> {agreement.phone}
                                            </p>
                                        )}
                                        {agreement.email && (
                                            <p className="flex items-center gap-1.5">
                                                <Mail className="h-3 w-3" /> {agreement.email}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditModal(agreement)}
                                        className="w-full"
                                    >
                                        <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => toggleStatus(agreement)}
                                        className={`w-full text-white shadow-sm ${
                                            agreement.is_active
                                                ? 'bg-rose-600 hover:bg-rose-700'
                                                : 'bg-emerald-600 hover:bg-emerald-700'
                                        }`}
                                    >
                                        {agreement.is_active ? (
                                            <>
                                                <PowerOff className="mr-1.5 h-3.5 w-3.5" /> Desactivar
                                            </>
                                        ) : (
                                            <>
                                                <Power className="mr-1.5 h-3.5 w-3.5" /> Activar
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* ─────────────── VISTA DESKTOP ─────────────── */}
                <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/40">
                            <TableRow>
                                <TableHead>Institución</TableHead>
                                <TableHead>Contacto</TableHead>
                                <TableHead className="text-center">Descuento</TableHead>
                                <TableHead className="text-center">Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAgreements.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                                        <Handshake className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                                        {agreements.length === 0 ? 'No hay convenios registrados.' : 'Sin resultados para tu búsqueda.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAgreements.map((agreement) => (
                                    <TableRow
                                        key={agreement.id}
                                        className={
                                            agreement.is_active
                                                ? 'hover:bg-slate-50 dark:hover:bg-slate-900/30'
                                                : 'bg-slate-50/50 opacity-80'
                                        }
                                    >
                                        <TableCell>
                                            <p className="font-bold text-slate-800 dark:text-slate-100">
                                                {agreement.name}
                                            </p>
                                            {agreement.rut && (
                                                <p className="font-mono text-xs text-muted-foreground">{agreement.rut}</p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {agreement.contact_person && (
                                                <div className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
                                                    <User className="h-3 w-3 text-muted-foreground" /> {agreement.contact_person}
                                                </div>
                                            )}
                                            {agreement.phone && (
                                                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Phone className="h-3 w-3" /> {agreement.phone}
                                                </div>
                                            )}
                                            {agreement.email && (
                                                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Mail className="h-3 w-3" /> {agreement.email}
                                                </div>
                                            )}
                                            {!agreement.contact_person && !agreement.phone && !agreement.email && (
                                                <span className="text-xs text-muted-foreground">Sin contacto</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800">
                                                {Number(agreement.discount_percentage)}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {agreement.is_active ? (
                                                <Badge className="mx-auto flex w-fit items-center justify-center gap-1 border-emerald-200 bg-emerald-100 text-emerald-800">
                                                    <CheckCircle2 className="h-3 w-3" /> Activo
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="mx-auto flex w-fit items-center justify-center gap-1 border-rose-200 bg-rose-50 text-rose-700">
                                                    <XCircle className="h-3 w-3" /> Inactivo
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEditModal(agreement)}
                                                >
                                                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => toggleStatus(agreement)}
                                                    className={`text-white shadow-sm ${
                                                        agreement.is_active
                                                            ? 'bg-rose-600 hover:bg-rose-700'
                                                            : 'bg-emerald-600 hover:bg-emerald-700'
                                                    }`}
                                                >
                                                    {agreement.is_active ? (
                                                        <>
                                                            <PowerOff className="mr-1.5 h-3.5 w-3.5" /> Desactivar
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Power className="mr-1.5 h-3.5 w-3.5" /> Activar
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* ─────────────── MODAL DE REGISTRO / EDICIÓN ─────────────── */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border bg-card p-5 shadow-xl sm:rounded-xl sm:p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center gap-2">
                            <div className="rounded-lg bg-rose-100 p-2 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                                <Handshake className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-bold">
                                {editingAgreement ? 'Editar Convenio' : 'Registrar Nuevo Convenio'}
                            </h2>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <Label>Nombre de la Institución *</Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Ej: Club Deportivo Temuco"
                                    className="mt-1"
                                    required
                                />
                                {errors.name && <p className="mt-1 text-sm text-rose-600">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>RUT (Opcional)</Label>
                                    <Input
                                        value={data.rut}
                                        onChange={(e) => setData('rut', e.target.value)}
                                        placeholder="12.345.678-9"
                                        className="mt-1"
                                    />
                                    {errors.rut && <p className="mt-1 text-sm text-rose-600">{errors.rut}</p>}
                                </div>
                                <div>
                                    <Label>Descuento (%) *</Label>
                                    <Input
                                        type="number"
                                        value={data.discount_percentage}
                                        onChange={(e) => setData('discount_percentage', e.target.value)}
                                        min="0"
                                        max="100"
                                        className="mt-1"
                                        required
                                    />
                                    {errors.discount_percentage && (
                                        <p className="mt-1 text-sm text-rose-600">{errors.discount_percentage}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Persona de Contacto</Label>
                                    <Input
                                        value={data.contact_person}
                                        onChange={(e) => setData('contact_person', e.target.value)}
                                        placeholder="Nombre del dirigente"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Teléfono</Label>
                                    <Input
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="+56912345678"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Correo Electrónico</Label>
                                <Input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="contacto@club.cl"
                                    className="mt-1"
                                />
                                {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email}</p>}
                            </div>

                            <div>
                                <Label>Notas Adicionales</Label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    placeholder="Detalles del acuerdo..."
                                />
                            </div>

                            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-full sm:w-auto"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-rose-800 text-white hover:bg-rose-900 sm:w-auto"
                                >
                                    {processing
                                        ? 'Guardando...'
                                        : editingAgreement
                                          ? 'Guardar Cambios'
                                          : 'Guardar Convenio'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}