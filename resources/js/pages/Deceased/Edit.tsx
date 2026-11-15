import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Lock } from 'lucide-react';

interface FormData {
    full_name: string;
    rut: string;
    gender: string;
    birth_date: string;
    death_date: string;
    death_time: string;
    death_certificate_number: string;
    death_certificate_office: string;
    death_certificate_date: string;
    cause_of_death: string;
    death_location: string;
    cemetery: string;
    niche_location: string;
    notes: string;
    redirect_to: string;
}

interface Deceased {
    id: number;
    full_name: string;
    rut: string | null;
    gender: string | null;
    birth_date: string | null;
    death_date: string;
    death_time: string | null;
    death_certificate_number: string | null;
    death_certificate_office: string | null;
    death_certificate_date: string | null;
    cause_of_death: string | null;
    death_location: string | null;
    cemetery: string | null;
    niche_location: string | null;
    notes: string | null;
}

interface Props {
    deceased: Deceased;
    redirect_to?: string | null;
}

export default function DeceasedEdit({ deceased, redirect_to }: Props) {
    const { data, setData, put, processing, errors } = useForm<FormData>({
        full_name: deceased.full_name,
        rut: deceased.rut || '',
        gender: deceased.gender || '',
        birth_date: deceased.birth_date || '',
        death_date: deceased.death_date,
        death_time: deceased.death_time || '',
        death_certificate_number: deceased.death_certificate_number || '',
        death_certificate_office: deceased.death_certificate_office || '',
        death_certificate_date: deceased.death_certificate_date || '',
        cause_of_death: deceased.cause_of_death || '',
        death_location: deceased.death_location || '',
        cemetery: deceased.cemetery || '',
        niche_location: deceased.niche_location || '',
        notes: deceased.notes || '',
        redirect_to: redirect_to || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/deceased/${deceased.id}`);
    };

    return (
        <>
            <Head title={`Editar ${deceased.full_name}`} />

            <div className="p-4 md:p-6 max-w-4xl mx-auto">
                {/* HEADER */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <Link href="/deceased">
                            <Button variant="outline" size="icon" className="shrink-0 mt-1">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
                                Editar Registro
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {deceased.full_name}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 1. DATOS PERSONALES */}
                    <Card className="shadow-sm">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/40">
                            <CardTitle>1. Datos Personales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="full_name">Nombre completo *</Label>
                                    <Input
                                        id="full_name"
                                        value={data.full_name}
                                        onChange={(e) => setData('full_name', e.target.value)}
                                        placeholder="Juan Pérez González"
                                        className="mt-1"
                                        required
                                    />
                                    {errors.full_name && <p className="text-sm text-rose-600 mt-1">{errors.full_name}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="rut">RUT</Label>
                                    <Input
                                        id="rut"
                                        value={data.rut}
                                        onChange={(e) => setData('rut', e.target.value)}
                                        placeholder="12.345.678-9"
                                        className="mt-1"
                                    />
                                    {errors.rut && <p className="text-sm text-rose-600 mt-1">{errors.rut}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="gender">Género</Label>
                                    <select
                                        id="gender"
                                        value={data.gender}
                                        onChange={(e) => setData('gender', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm mt-1"
                                    >
                                        <option value="">Sin especificar</option>
                                        <option value="M">Masculino</option>
                                        <option value="F">Femenino</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="birth_date">Fecha de nacimiento</Label>
                                    <Input
                                        id="birth_date"
                                        type="date"
                                        value={data.birth_date}
                                        onChange={(e) => setData('birth_date', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. DATOS DEL FALLECIMIENTO */}
                    <Card className="shadow-sm">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/40">
                            <CardTitle>2. Datos del Fallecimiento</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="death_date">Fecha de fallecimiento *</Label>
                                    <Input
                                        id="death_date"
                                        type="date"
                                        value={data.death_date}
                                        onChange={(e) => setData('death_date', e.target.value)}
                                        className="mt-1"
                                        required
                                    />
                                    {errors.death_date && <p className="text-sm text-rose-600 mt-1">{errors.death_date}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="death_time">Hora de fallecimiento</Label>
                                    <Input
                                        id="death_time"
                                        type="time"
                                        value={data.death_time}
                                        onChange={(e) => setData('death_time', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="cause_of_death">Causa del fallecimiento</Label>
                                <textarea
                                    id="cause_of_death"
                                    value={data.cause_of_death}
                                    onChange={(e) => setData('cause_of_death', e.target.value)}
                                    rows={2}
                                    placeholder="Este dato se almacena encriptado..."
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1"
                                />
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <Lock className="h-3 w-3" /> Este campo se almacena encriptado en la base de datos
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="death_location">Lugar del fallecimiento</Label>
                                <Input
                                    id="death_location"
                                    value={data.death_location}
                                    onChange={(e) => setData('death_location', e.target.value)}
                                    placeholder="Hospital Clínico, domicilio, etc."
                                    className="mt-1"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. CERTIFICADO */}
                    <Card className="shadow-sm">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/40">
                            <CardTitle>3. Certificado de Defunción</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="death_certificate_number">Número de certificado</Label>
                                    <Input
                                        id="death_certificate_number"
                                        value={data.death_certificate_number}
                                        onChange={(e) => setData('death_certificate_number', e.target.value)}
                                        placeholder="CERT-2026-0001"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="death_certificate_date">Fecha de emisión</Label>
                                    <Input
                                        id="death_certificate_date"
                                        type="date"
                                        value={data.death_certificate_date}
                                        onChange={(e) => setData('death_certificate_date', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="death_certificate_office">Oficina emisora</Label>
                                <Input
                                    id="death_certificate_office"
                                    value={data.death_certificate_office}
                                    onChange={(e) => setData('death_certificate_office', e.target.value)}
                                    placeholder="Registro Civil Santiago"
                                    className="mt-1"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. UBICACIÓN */}
                    <Card className="shadow-sm">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/40">
                            <CardTitle>4. Ubicación</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="cemetery">Cementerio / Crematorio</Label>
                                    <Input
                                        id="cemetery"
                                        value={data.cemetery}
                                        onChange={(e) => setData('cemetery', e.target.value)}
                                        placeholder="Cementerio General"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="niche_location">Ubicación de nicho</Label>
                                    <Input
                                        id="niche_location"
                                        value={data.niche_location}
                                        onChange={(e) => setData('niche_location', e.target.value)}
                                        placeholder="Nicho 45, Fila 3"
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 5. NOTAS */}
                    <Card className="shadow-sm">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/40">
                            <CardTitle>5. Observaciones</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={3}
                                placeholder="Notas adicionales..."
                                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                            />
                        </CardContent>
                    </Card>

                    {/* BOTONES */}
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <Link href="/deceased" className="w-full sm:w-auto">
                            <Button type="button" variant="outline" className="w-full sm:w-auto">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="w-full sm:w-auto bg-rose-800 hover:bg-rose-900 text-white shadow-md">
                            {processing ? 'Guardando...' : 'Actualizar Registro'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}