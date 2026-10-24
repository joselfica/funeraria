import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Client {
    id: number;
    name: string;
    rut: string;
}

interface Deceased {
    id: number;
    full_name: string;
    rut: string | null;
}

interface ServiceType {
    id: number;
    name: string;
    base_price: string;
    duration_hours: number;
}

interface Props {
    clients: Client[];
    deceased: Deceased[];
    serviceTypes: ServiceType[];
    branches: Array<{ id: number; name: string; code: string }>;
    beneficiaryTypes: Array<{ value: string; label: string }>;
}

interface FormData {
    client_id: string;
    deceased_id: string;
    service_type_id: string;
    branch_id: string;
    beneficiary_type: string;
    scheduled_at: string;
    duration_hours: string;
    base_price: string;
    additional_charges: string;
    discount: string;
    client_notes: string;
    internal_notes: string;
}

export default function ServicesCreate({ clients, deceased, serviceTypes, branches, beneficiaryTypes }: Props) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        client_id: '',
        deceased_id: '',
        service_type_id: '',
        branch_id: '',
        beneficiary_type: 'particular',
        scheduled_at: '',
        duration_hours: '24',
        base_price: '0',
        additional_charges: '0',
        discount: '0',
        client_notes: '',
        internal_notes: '',
    });

    // Auto-completar precio y duración al elegir tipo de servicio
    const handleServiceTypeChange = (value: string) => {
        setData('service_type_id', value);
        const selectedType = serviceTypes.find((t) => String(t.id) === value);
        if (selectedType) {
            setData('base_price', selectedType.base_price);
            setData('duration_hours', String(selectedType.duration_hours));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/services');
    };

    const total = 
        (parseFloat(data.base_price) || 0) 
        + (parseFloat(data.additional_charges) || 0) 
        - (parseFloat(data.discount) || 0);

    const formatPrice = (value: number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

    return (
        <AppLayout>
            <Head title="Nuevo Servicio" />

            <div className="p-6 max-w-4xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Nuevo Servicio Funerario</h1>
                    <p className="text-muted-foreground mt-1">
                        Registre una nueva solicitud de servicio
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Cliente y fallecido */}
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Contratante y Fallecido</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="client_id">Cliente contratante *</Label>
                                    <select
                                        id="client_id"
                                        value={data.client_id}
                                        onChange={(e) => setData('client_id', e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                                        required
                                    >
                                        <option value="">Seleccionar cliente...</option>
                                        {clients.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.rut})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.client_id && (
                                        <p className="text-sm text-destructive mt-1">{errors.client_id}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="deceased_id">Fallecido *</Label>
                                    <select
                                        id="deceased_id"
                                        value={data.deceased_id}
                                        onChange={(e) => setData('deceased_id', e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                                        required
                                    >
                                        <option value="">Seleccionar fallecido...</option>
                                        {deceased.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {d.full_name} {d.rut && `(${d.rut})`}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.deceased_id && (
                                        <p className="text-sm text-destructive mt-1">{errors.deceased_id}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Si el fallecido no está registrado, créelo primero desde el módulo de Fallecidos.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sucursal y tipo de beneficiario */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="branch_id">Sucursal *</Label>
                            <select
                                id="branch_id"
                                value={data.branch_id}
                                onChange={(e) => setData('branch_id', e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                                required
                            >
                                <option value="">Seleccionar sucursal...</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                                ))}
                            </select>
                            {errors.branch_id && <p className="text-sm text-destructive mt-1">{errors.branch_id}</p>}
                        </div>

                        <div>
                            <Label htmlFor="beneficiary_type">Tipo de Beneficiario *</Label>
                            <select
                                id="beneficiary_type"
                                value={data.beneficiary_type}
                                onChange={(e) => setData('beneficiary_type', e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                                required
                            >
                                <option value="">Seleccionar tipo...</option>
                                {beneficiaryTypes.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            {errors.beneficiary_type && <p className="text-sm text-destructive mt-1">{errors.beneficiary_type}</p>}
                        </div>
                    </div>

                    {/* Tipo de servicio y programación */}
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Tipo de Servicio y Programación</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="service_type_id">Tipo de servicio *</Label>
                                <select
                                    id="service_type_id"
                                    value={data.service_type_id}
                                    onChange={(e) => handleServiceTypeChange(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                                    required
                                >
                                    <option value="">Seleccionar tipo...</option>
                                    {serviceTypes.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} - {formatPrice(parseFloat(t.base_price))}
                                        </option>
                                    ))}
                                </select>
                                {errors.service_type_id && (
                                    <p className="text-sm text-destructive mt-1">{errors.service_type_id}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="scheduled_at">Fecha y hora del servicio *</Label>
                                    <Input
                                        id="scheduled_at"
                                        type="datetime-local"
                                        value={data.scheduled_at}
                                        onChange={(e) => setData('scheduled_at', e.target.value)}
                                        required
                                    />
                                    {errors.scheduled_at && (
                                        <p className="text-sm text-destructive mt-1">{errors.scheduled_at}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="duration_hours">Duración (horas) *</Label>
                                    <Input
                                        id="duration_hours"
                                        type="number"
                                        min="1"
                                        value={data.duration_hours}
                                        onChange={(e) => setData('duration_hours', e.target.value)}
                                        required
                                    />
                                    {errors.duration_hours && (
                                        <p className="text-sm text-destructive mt-1">{errors.duration_hours}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Precios */}
                    <Card>
                        <CardHeader>
                            <CardTitle>3. Información Económica</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="base_price">Precio base *</Label>
                                    <Input
                                        id="base_price"
                                        type="number"
                                        step="0.01"
                                        value={data.base_price}
                                        readOnly
                                        className="bg-muted cursor-not-allowed"
                                        required
                                    />
                                    {errors.base_price && (
                                        <p className="text-sm text-destructive mt-1">{errors.base_price}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="additional_charges">Cargos adicionales</Label>
                                    <Input
                                        id="additional_charges"
                                        type="number"
                                        step="0.01"
                                        value={data.additional_charges}
                                        onChange={(e) => setData('additional_charges', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="discount">Descuento</Label>
                                    <Input
                                        id="discount"
                                        type="number"
                                        step="0.01"
                                        value={data.discount}
                                        onChange={(e) => setData('discount', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t pt-4">
                                <span className="text-lg font-medium">Total a pagar:</span>
                                <span className="text-2xl font-bold">{formatPrice(total)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notas */}
                    <Card>
                        <CardHeader>
                            <CardTitle>4. Observaciones</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="client_notes">Mensaje del solicitante</Label>
                                <textarea
                                    id="client_notes"
                                    value={data.client_notes}
                                    onChange={(e) => setData('client_notes', e.target.value)}
                                    rows={3}
                                    placeholder="Observaciones visibles para el cliente..."
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <Label htmlFor="internal_notes">Notas internas (solo Admin)</Label>
                                <textarea
                                    id="internal_notes"
                                    value={data.internal_notes}
                                    onChange={(e) => setData('internal_notes', e.target.value)}
                                    rows={3}
                                    placeholder="Notas privadas del equipo..."
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                        <Link href="/services">
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : 'Crear Servicio'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}