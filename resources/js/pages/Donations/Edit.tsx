import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, HandHeart, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Donation {
    id: number;
    beneficiary_name: string;
    beneficiary_rut: string | null;
    contact_person: string | null;
    type: 'dinero' | 'especie';
    amount: string | number | null;
    description: string | null;
    donation_date: string;
    receipt_path: string | null;
    notes: string | null;
}

interface Props {
    donation: Donation;
}

export default function DonationEdit({ donation }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'put',
        beneficiary_name: donation.beneficiary_name,
        beneficiary_rut: donation.beneficiary_rut ?? '',
        contact_person: donation.contact_person ?? '',
        type: donation.type,
        amount: donation.amount ? String(donation.amount) : '',
        description: donation.description ?? '',
        donation_date: donation.donation_date.slice(0, 10),
        receipt: null as File | null,
        notes: donation.notes ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        // Enviamos como FormData para soportar el archivo opcional
        post(`/donations/${donation.id}`, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Editar Donación" />

            <div className="mx-auto max-w-3xl space-y-6 p-4 pb-12 sm:p-6 lg:p-8">
                <div className="flex items-start gap-3">
                    <Link href={`/donations/${donation.id}`}>
                        <Button variant="outline" size="icon" className="shrink-0 mt-1">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 sm:text-2xl">
                            Editar Donación
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {donation.beneficiary_name}
                        </p>
                    </div>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/40">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <HandHeart className="h-4 w-4 text-rose-800" /> Datos de la Donación
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={submit} className="space-y-4" encType="multipart/form-data">
                            <div>
                                <Label htmlFor="beneficiary_name">Beneficiario *</Label>
                                <Input
                                    id="beneficiary_name"
                                    value={data.beneficiary_name}
                                    onChange={(e) => setData('beneficiary_name', e.target.value)}
                                    required
                                    className="mt-1"
                                />
                                {errors.beneficiary_name && (
                                    <p className="mt-1 text-xs text-destructive">{errors.beneficiary_name}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="beneficiary_rut">RUT</Label>
                                    <Input
                                        id="beneficiary_rut"
                                        value={data.beneficiary_rut}
                                        onChange={(e) => setData('beneficiary_rut', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="contact_person">Persona de contacto</Label>
                                    <Input
                                        id="contact_person"
                                        value={data.contact_person}
                                        onChange={(e) => setData('contact_person', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 rounded-lg border bg-slate-50 p-3 dark:bg-slate-900/40 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="type">Tipo *</Label>
                                    <select
                                        id="type"
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value as 'dinero' | 'especie')}
                                        className="mt-1 h-10 w-full rounded-md border bg-white px-3 dark:bg-slate-950"
                                    >
                                        <option value="dinero">Dinero</option>
                                        <option value="especie">Especie</option>
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
                                <Label htmlFor="donation_date">Fecha *</Label>
                                <Input
                                    id="donation_date"
                                    type="date"
                                    value={data.donation_date}
                                    onChange={(e) => setData('donation_date', e.target.value)}
                                    required
                                    className="mt-1"
                                />
                                {errors.donation_date && (
                                    <p className="mt-1 text-xs text-destructive">{errors.donation_date}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="receipt">Reemplazar comprobante</Label>
                                <Input
                                    id="receipt"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) =>
                                        setData('receipt', e.target.files?.[0] ?? null)
                                    }
                                    className="mt-1"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Máx. 5 MB. PDF, JPG o PNG.
                                </p>
                                {donation.receipt_path && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Actual: {donation.receipt_path.split('/').pop()}. Si subes uno nuevo, el anterior será reemplazado.
                                    </p>
                                )}
                                {errors.receipt && (
                                    <p className="mt-1 text-xs text-destructive">{errors.receipt}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="notes">Notas</Label>
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                                <Link href={`/donations/${donation.id}`}>
                                    <Button type="button" variant="outline" className="w-full sm:w-auto">
                                        Cancelar
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-rose-800 text-white hover:bg-rose-900"
                                >
                                    <Save className="mr-1 h-4 w-4" />
                                    {processing ? 'Guardando...' : 'Guardar cambios'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}