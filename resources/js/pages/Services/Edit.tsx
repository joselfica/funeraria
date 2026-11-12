import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface Client { id: number; name: string; rut: string; }
interface Deceased { id: number; full_name: string; rut: string | null; }
interface ServiceType { id: number; name: string; base_price: string; duration_hours: number; }

interface Service {
    id: number;
    uuid: string;
    code: string;
    status: string;
    client_id: number;
    deceased_id: number;
    service_type_id: number;
    scheduled_at: string;
    duration_hours: number;
    base_price: string;
    additional_charges: string;
    discount: string;
    total_price: string;
    client_notes: string | null;
    internal_notes: string | null;
}

interface Props {
    service: Service;
    clients: Client[];
    deceased: Deceased[];
    serviceTypes: ServiceType[];
}

interface FormData {
    client_id: string;
    deceased_id: string;
    service_type_id: string;
    scheduled_at: string;
    duration_hours: string;
    base_price: string;
    additional_charges: string;
    discount: string;
    client_notes: string;
    internal_notes: string;
}

export default function ServicesEdit({ service, clients, deceased, serviceTypes }: Props) {
    const formatDateTime = (dt: string) => {
        const d = new Date(dt);
        return d.toISOString().slice(0, 16);
    };

    const { data, setData, put, processing, errors } = useForm<FormData>({
        client_id: String(service.client_id),
        deceased_id: String(service.deceased_id),
        service_type_id: String(service.service_type_id),
        scheduled_at: formatDateTime(service.scheduled_at),
        duration_hours: String(service.duration_hours),
        base_price: service.base_price,
        additional_charges: service.additional_charges,
        discount: service.discount,
        client_notes: service.client_notes || '',
        internal_notes: service.internal_notes || '',
    });

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
        put(`/services/${service.id}`);
    };

    const total = (parseFloat(data.base_price) || 0) + (parseFloat(data.additional_charges) || 0) - (parseFloat(data.discount) || 0);
    const formatPrice = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

    return (
        <>
            <Head title={`Editar ${service.code}`} />

            <div className="p-4 md:p-6 max-w-4xl mx-auto">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <Link href="/services"><Button variant="outline" size="icon" className="shrink-0 mt-1"><ArrowLeft className="h-4 w-4" /></Button></Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">Editar Servicio</h1>
                            <p className="text-muted-foreground mt-1 font-mono text-sm">{service.code}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/40"><CardTitle>1. Contratante y Fallecido</CardTitle></CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="client_id">Cliente *</Label>
                                    <select id="client_id" value={data.client_id} onChange={(e) => setData('client_id', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm mt-1" required>
                                        {clients.map((c) => (<option key={c.id} value={c.id}>{c.name} ({c.rut})</option>))}
                                    </select>
                                    {errors.client_id && <p className="text-sm text-rose-600 mt-1">{errors.client_id}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="deceased_id">Fallecido *</Label>
                                    <select id="deceased_id" value={data.deceased_id} onChange={(e) => setData('deceased_id', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm mt-1" required>
                                        {deceased.map((d) => (<option key={d.id} value={d.id}>{d.full_name}</option>))}
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/40"><CardTitle>2. Tipo de Servicio y Programación</CardTitle></CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div>
                                <Label htmlFor="service_type_id">Tipo de servicio *</Label>
                                <select id="service_type_id" value={data.service_type_id} onChange={(e) => handleServiceTypeChange(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm mt-1" required>
                                    {serviceTypes.map((t) => (<option key={t.id} value={t.id}>{t.name} - {formatPrice(parseFloat(t.base_price))}</option>))}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="scheduled_at">Fecha y hora *</Label>
                                    <Input id="scheduled_at" type="datetime-local" value={data.scheduled_at} onChange={(e) => setData('scheduled_at', e.target.value)} className="mt-1" required />
                                    <p className="text-xs text-muted-foreground mt-1">Puede ser una fecha pasada si está regularizando un servicio ya realizado.</p>
                                    {errors.scheduled_at && <p className="text-sm text-rose-600 mt-1">{errors.scheduled_at}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="duration_hours">Duración (horas) *</Label>
                                    <Input id="duration_hours" type="number" min="1" value={data.duration_hours} onChange={(e) => setData('duration_hours', e.target.value)} className="mt-1" required />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/40"><CardTitle>3. Información Económica</CardTitle></CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="base_price">Precio base *</Label>
                                    <Input id="base_price" type="number" step="0.01" value={data.base_price} onChange={(e) => setData('base_price', e.target.value)} className="mt-1" required />
                                </div>
                                <div>
                                    <Label htmlFor="additional_charges">Cargos adicionales</Label>
                                    <Input id="additional_charges" type="number" step="0.01" value={data.additional_charges} onChange={(e) => setData('additional_charges', e.target.value)} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="discount">Descuento</Label>
                                    <Input id="discount" type="number" step="0.01" value={data.discount} onChange={(e) => setData('discount', e.target.value)} className="mt-1" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between border-t pt-4">
                                <span className="text-base md:text-lg font-medium text-slate-700 dark:text-slate-300">Total:</span>
                                <span className="text-xl md:text-2xl font-bold text-rose-800">{formatPrice(total)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/40"><CardTitle>4. Observaciones</CardTitle></CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div>
                                <Label htmlFor="client_notes">Mensaje del solicitante</Label>
                                <textarea id="client_notes" value={data.client_notes} onChange={(e) => setData('client_notes', e.target.value)} rows={3} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="internal_notes">Notas internas</Label>
                                <textarea id="internal_notes" value={data.internal_notes} onChange={(e) => setData('internal_notes', e.target.value)} rows={3} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1" />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <Link href="/services" className="w-full sm:w-auto"><Button type="button" variant="outline" className="w-full sm:w-auto">Cancelar</Button></Link>
                        <Button type="submit" disabled={processing} className="w-full sm:w-auto bg-rose-800 hover:bg-rose-900 text-white shadow-md">
                            {processing ? 'Guardando...' : 'Actualizar Servicio'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}