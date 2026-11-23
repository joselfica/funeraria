import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft, HandHeart, DollarSign, Package, Calendar,
    User, FileText, Pencil, Trash2, Download, Phone, IdCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    created_at: string;
}

interface Props {
    donation: Donation;
}

const formatPrice = (amount: number | string | null) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(amount ?? 0));

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

export default function DonationShow({ donation }: Props) {
    const handleDelete = () => {
        if (confirm(`¿Eliminar la donación de ${donation.beneficiary_name}?\n\nEsta acción se puede revertir desde la base de datos, pero no desde la interfaz.`)) {
            router.delete(`/donations/${donation.id}`);
        }
    };

    const isDinero = donation.type === 'dinero';

    return (
        <>
            <Head title={`Donación: ${donation.beneficiary_name}`} />

            <div className="mx-auto max-w-4xl space-y-6 p-4 pb-12 sm:p-6 lg:p-8">
                {/* Encabezado */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <Link href="/donations">
                            <Button variant="outline" size="icon" className="shrink-0 mt-1">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="min-w-0">
                            <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-100 sm:text-2xl">
                                {donation.beneficiary_name}
                                {isDinero ? (
                                    <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                                        <DollarSign className="mr-1 h-3 w-3" /> Dinero
                                    </Badge>
                                ) : (
                                    <Badge className="border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100">
                                        <Package className="mr-1 h-3 w-3" /> Especie
                                    </Badge>
                                )}
                            </h1>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(donation.donation_date)}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/donations/${donation.id}/edit`}>
                            <Button variant="outline"><Pencil className="mr-1 h-4 w-4" /> Editar</Button>
                        </Link>
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                        </Button>
                    </div>
                </div>

                {/* Monto / Descripción destacada */}
                <Card className="border-t-4 border-t-rose-800 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                        {isDinero ? (
                            <>
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                                    Monto donado
                                </p>
                                <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">
                                    {formatPrice(donation.amount)}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                                    Donación en especie
                                </p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                                    {donation.description}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Detalle */}
                <Card className="shadow-sm">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/40">
                        <CardTitle className="text-base">Detalle de la Donación</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-xs text-muted-foreground">Beneficiario</dt>
                                <dd className="font-medium">{donation.beneficiary_name}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted-foreground">RUT</dt>
                                <dd className="flex items-center gap-1.5 font-medium">
                                    <IdCard className="h-3.5 w-3.5 text-muted-foreground" />
                                    {donation.beneficiary_rut || '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted-foreground">Persona de contacto</dt>
                                <dd className="flex items-center gap-1.5 font-medium">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    {donation.contact_person || '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted-foreground">Fecha de la donación</dt>
                                <dd className="font-medium">{formatDate(donation.donation_date)}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-xs text-muted-foreground">Registrado por</dt>
                                <dd className="font-medium">
                                    {donation.creator?.name ?? 'Sistema'}{' '}
                                    <span className="text-xs text-muted-foreground">
                                        el {formatDateTime(donation.created_at)}
                                    </span>
                                </dd>
                            </div>
                        </dl>

                        {donation.notes && (
                            <div className="mt-6 border-t pt-4">
                                <p className="mb-1 text-xs text-muted-foreground">Notas adicionales</p>
                                <p className="whitespace-pre-line break-words text-sm">{donation.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Comprobante */}
                <Card className="shadow-sm">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/40">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-4 w-4" /> Comprobante
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {donation.receipt_path ? (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-slate-50 p-3 dark:bg-slate-900/40">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium">Documento adjunto</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {donation.receipt_path.split('/').pop()}
                                    </p>
                                </div>
                                <a
                                    href={`/donations/${donation.id}/receipt`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                                >
                                    <Download className="h-4 w-4" /> Descargar
                                </a>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Sin comprobante adjunto.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}