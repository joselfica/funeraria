import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    current_location: string;
    cemetery: string;
    niche_location: string;
    notes: string;
}

export default function DeceasedCreate() {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        full_name: '',
        rut: '',
        gender: '',
        birth_date: '',
        death_date: '',
        death_time: '',
        death_certificate_number: '',
        death_certificate_office: '',
        death_certificate_date: '',
        cause_of_death: '',
        death_location: '',
        current_location: '',
        cemetery: '',
        niche_location: '',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/deceased');
    };

    return (
        <>
            <Head title="Nuevo Fallecido" />

            <div className="p-6 max-w-4xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Registrar Fallecido</h1>
                    <p className="text-muted-foreground mt-1">
                        Los datos personales y sensibles están protegidos por encriptación.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Datos personales */}
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Datos Personales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="full_name">Nombre completo *</Label>
                                    <Input
                                        id="full_name"
                                        value={data.full_name}
                                        onChange={(e) => setData('full_name', e.target.value)}
                                        placeholder="Juan Pérez González"
                                        required
                                    />
                                    {errors.full_name && <p className="text-sm text-destructive mt-1">{errors.full_name}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="rut">RUT</Label>
                                    <Input
                                        id="rut"
                                        value={data.rut}
                                        onChange={(e) => setData('rut', e.target.value)}
                                        placeholder="12.345.678-9"
                                    />
                                    {errors.rut && <p className="text-sm text-destructive mt-1">{errors.rut}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="gender">Género</Label>
                                    <select
                                        id="gender"
                                        value={data.gender}
                                        onChange={(e) => setData('gender', e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
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
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fallecimiento */}
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Datos del Fallecimiento</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="death_date">Fecha de fallecimiento *</Label>
                                    <Input
                                        id="death_date"
                                        type="date"
                                        value={data.death_date}
                                        onChange={(e) => setData('death_date', e.target.value)}
                                        required
                                    />
                                    {errors.death_date && <p className="text-sm text-destructive mt-1">{errors.death_date}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="death_time">Hora de fallecimiento</Label>
                                    <Input
                                        id="death_time"
                                        type="time"
                                        value={data.death_time}
                                        onChange={(e) => setData('death_time', e.target.value)}
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
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    🔒 Este campo se almacena encriptado en la base de datos
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="death_location">Lugar del fallecimiento</Label>
                                <Input
                                    id="death_location"
                                    value={data.death_location}
                                    onChange={(e) => setData('death_location', e.target.value)}
                                    placeholder="Hospital Clínico, domicilio, etc."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Certificado de defunción */}
                    <Card>
                        <CardHeader>
                            <CardTitle>3. Certificado de Defunción</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="death_certificate_number">Número de certificado</Label>
                                    <Input
                                        id="death_certificate_number"
                                        value={data.death_certificate_number}
                                        onChange={(e) => setData('death_certificate_number', e.target.value)}
                                        placeholder="CERT-2026-0001"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="death_certificate_date">Fecha de emisión</Label>
                                    <Input
                                        id="death_certificate_date"
                                        type="date"
                                        value={data.death_certificate_date}
                                        onChange={(e) => setData('death_certificate_date', e.target.value)}
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
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ubicación */}
                    <Card>
                        <CardHeader>
                            <CardTitle>4. Ubicación Actual</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="current_location">Ubicación actual del cuerpo</Label>
                                <Input
                                    id="current_location"
                                    value={data.current_location}
                                    onChange={(e) => setData('current_location', e.target.value)}
                                    placeholder="Funeraria Cristo Rey - Sucursal Centro"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="cemetery">Cementerio / Crematorio</Label>
                                    <Input
                                        id="cemetery"
                                        value={data.cemetery}
                                        onChange={(e) => setData('cemetery', e.target.value)}
                                        placeholder="Cementerio General"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="niche_location">Ubicación de nicho</Label>
                                    <Input
                                        id="niche_location"
                                        value={data.niche_location}
                                        onChange={(e) => setData('niche_location', e.target.value)}
                                        placeholder="Nicho 45, Fila 3"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notas */}
                    <Card>
                        <CardHeader>
                            <CardTitle>5. Observaciones</CardTitle>
                        </CardHeader>
                        <CardContent>
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

                    <div className="flex justify-end gap-2">
                        <Link href="/deceased">
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : 'Guardar Registro'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}