import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    Handshake,
    Info,
    Package,
    Truck,
    UserCheck,
} from 'lucide-react';

interface Client {
    id: number;
    name: string;
    rut: string;
}

interface ServiceTypeOption {
    value: string;
    label: string;
    base_price: number;
    duration_hours: number;
}

interface AvailableItem {
    id: number;
    code: string;
    name: string;
    category: string;
    price: string;
}

/**
 * Convenio institucional disponible para aplicar al servicio.
 * `discount_percentage` llega como string ("10.00") porque el modelo
 * Agreement lo castea como decimal:2, pero se normaliza a Number() al usar.
 */
interface Agreement {
    id: number;
    name: string;
    discount_percentage: number | string;
}

interface Props {
    branches: Array<{ id: number; name: string }>;
    serviceTypes: ServiceTypeOption[];
    beneficiaryTypes: Array<{ value: string; label: string }>;
    availableItems: AvailableItem[];
    existingClients: Client[];
    availableVehicles: Array<{ id: number; plate: string; type: string; brand: string | null; model: string | null }>;
    availableEmployees: Array<{ id: number; name: string }>;
    /** Convenios activos (vienen filtrados por Agreement::active() en el backend). */
    agreements: Agreement[];
}

export default function ServicesWizard({
    branches,
    serviceTypes,
    beneficiaryTypes,
    availableItems,
    existingClients,
    availableVehicles,
    availableEmployees,
    agreements,
}: Props) {
    const [step, setStep] = useState(1);
    const [clientMode, setClientMode] = useState<'existing' | 'new'>('new');

    const { data, setData, post, processing, errors } = useForm({
        existing_client_id: '',
        client_rut: '',
        client_name: '',
        client_phone: '',
        client_email: '',
        client_address: '',
        deceased_full_name: '',
        deceased_rut: '',
        deceased_death_date: '',
        deceased_death_time: '',
        deceased_death_location: '',
        deceased_cause_of_death: '',
        deceased_death_certificate: '',
        branch_id: '',
        service_type: '',
        beneficiary_type: 'particular',
        scheduled_at: '',
        duration_hours: '48',
        total_amount: '',
        amount_paid: '',
        origin_location: '',
        destination_location: '',
        burial_at: '',
        inventory_item_id: '',
        vehicle_id: '',
        driver_id: '',
        payment_method: 'efectivo',
        payment_reference: '',
        // ─────────────────────────────────────────────────────────────
        // CONVENIO (opcional)
        // ─────────────────────────────────────────────────────────────
        // Se envía vacío por defecto. Si el usuario elige uno, se manda el
        // id. El backend lo valida con `nullable|exists:agreements,id`.
        agreement_id: '',
    });

    const handleServiceTypeChange = (value: string) => {
        setData('service_type', value);
        const selected = serviceTypes.find((t) => t.value === value);
        if (selected) {
            if (data.duration_hours === '48' || data.duration_hours === '') {
                setData('duration_hours', String(selected.duration_hours));
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // ─────────────────────────────────────────────────────────────
        // Envío: se manda el monto FINAL (con descuento aplicado) como
        // `total_amount`, no el bruto. Así el backend no necesita
        // recalcular el descuento: solo valida que `amount_paid` sea al
        // menos el 50% de `total_amount` y guarda ambos valores.
        //
        // `agreement_id` se envía vacío (""), lo que Laravel convierte a
        // null gracias a la regla `nullable`. El backend lo guarda como
        // null si no hay convenio.
        // ─────────────────────────────────────────────────────────────
        post('/services/quick-store', {
            preserveScroll: true,
            transform: (payload) => ({
                ...payload,
                // Se sobreescribe `total_amount` con el total final
                // (bruto - descuento) para que el backend reciba el monto
                // que efectivamente se cobrará.
                total_amount: String(finalTotal),
                // Normaliza cadenas vacías a null para el backend.
                agreement_id: payload.agreement_id === '' ? null : payload.agreement_id,
            }),
        });
    };

    const nextStep = () => setStep((s) => Math.min(s + 1, 3));
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const formatPrice = (value: number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

    // ─────────────────────────────────────────────────────────────
    // CÁLCULO DE MONTOS CON CONVENIO
    // ─────────────────────────────────────────────────────────────
    //
    // - baseTotal: monto BRUTO ingresado por el cajero (sin descuento).
    // - selectedAgreement: convenio elegido (o undefined si no hay).
    // - discountPercentage: % de descuento del convenio (0 si no hay).
    // - discountAmount: descuento en pesos (redondeado).
    // - finalTotal: monto FINAL que se cobrará al cliente.
    // - amountPaid: abono ingresado.
    // - suggestedDeposit: 50% del monto FINAL (regla del backend).
    // - balance: saldo pendiente tras el abono.
    //
    // Importante: el `suggestedDeposit` se calcula sobre `finalTotal`,
    // no sobre `baseTotal`, porque el backend valida el 50% contra el
    // `total_amount` que recibe (que es el final con descuento).
    // ─────────────────────────────────────────────────────────────
    const baseTotal = Number(data.total_amount) || 0;
    const selectedAgreement = agreements.find((a) => a.id === Number(data.agreement_id));
    const discountPercentage = selectedAgreement ? Number(selectedAgreement.discount_percentage) : 0;
    const discountAmount = Math.round(baseTotal * (discountPercentage / 100));
    const finalTotal = Math.max(baseTotal - discountAmount, 0);

    const amountPaid = Number(data.amount_paid) || 0;
    const suggestedDeposit = Math.round(finalTotal * 0.5);
    const balance = Math.max(finalTotal - amountPaid, 0);

    // Deja solo dígitos (quita puntos, comas, signos, etc.)
    const handleNumberChange = (field: 'total_amount' | 'amount_paid', value: string) => {
        setData(field, value.replace(/\D/g, ''));
    };

    return (
        <>
            <Head title="Nuevo Expediente" />

            <div className="p-4 md:p-6 max-w-3xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">Nuevo Expediente Funerario</h1>
                    <p className="text-muted-foreground mt-2">Completa los datos en 3 simples pasos</p>
                </div>

                {/* Barra de Progreso */}
                <div className="flex items-center justify-between mb-8 relative px-2">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-800 -z-10" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-rose-800 -z-10 transition-all duration-300" style={{ width: `${((step - 1) / 2) * 100}%` }} />

                    {[1, 2, 3].map((i) => (
                        <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${step >= i ? 'bg-rose-800 text-white border-rose-800' : 'bg-background border-slate-300 text-slate-400'}`}>
                            {step > i ? <Check className="w-5 h-5" /> : i}
                        </div>
                    ))}
                </div>

                {Object.keys(errors).length > 0 && (
                    <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-sm text-rose-800 dark:text-rose-300 flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <div>
                            <p className="font-bold mb-1">Revisa los siguientes campos:</p>
                            <ul className="list-disc list-inside">
                                {Object.entries(errors).map(([key, error]) => (
                                    <li key={key}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <Card className="shadow-sm">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/40">
                            <CardTitle>
                                {step === 1 && 'Paso 1: Datos del Cliente'}
                                {step === 2 && 'Paso 2: Datos del Fallecido'}
                                {step === 3 && 'Paso 3: Servicio, Recursos y Abono'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 min-h-[350px] pt-6">

                            {/* PASO 1: CLIENTE */}
                            {step === 1 && (
                                <>
                                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit mb-4">
                                        <button type="button" onClick={() => setClientMode('existing')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${clientMode === 'existing' ? 'bg-white dark:bg-slate-700 text-rose-800 dark:text-rose-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                                            Cliente existente
                                        </button>
                                        <button type="button" onClick={() => setClientMode('new')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${clientMode === 'new' ? 'bg-white dark:bg-slate-700 text-rose-800 dark:text-rose-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                                            Nuevo cliente
                                        </button>
                                    </div>

                                    {clientMode === 'existing' && (
                                        <div>
                                            <Label>Seleccionar Cliente *</Label>
                                            <select value={data.existing_client_id} onChange={(e) => setData('existing_client_id', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm mt-1">
                                                <option value="">Seleccionar cliente...</option>
                                                {existingClients.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name} — {c.rut}</option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-muted-foreground mt-1">Selecciona un cliente ya registrado para vincularlo a este servicio.</p>
                                        </div>
                                    )}

                                    {clientMode === 'new' && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>RUT del Cliente *</Label>
                                                    <Input value={data.client_rut} onChange={(e) => setData('client_rut', e.target.value)} placeholder="12.345.678-9" className="mt-1" />
                                                    {errors.client_rut && <p className="text-sm text-rose-600 mt-1">{errors.client_rut}</p>}
                                                </div>
                                                <div>
                                                    <Label>Nombre Completo *</Label>
                                                    <Input value={data.client_name} onChange={(e) => setData('client_name', e.target.value)} placeholder="Juan Pérez González" className="mt-1" />
                                                    {errors.client_name && <p className="text-sm text-rose-600 mt-1">{errors.client_name}</p>}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Teléfono</Label>
                                                    <Input value={data.client_phone} onChange={(e) => setData('client_phone', e.target.value)} placeholder="+56912345678" className="mt-1" />
                                                </div>
                                                <div>
                                                    <Label>Email</Label>
                                                    <Input type="email" value={data.client_email} onChange={(e) => setData('client_email', e.target.value)} placeholder="juan@email.cl" className="mt-1" />
                                                </div>
                                            </div>
                                            <div>
                                                <Label>Dirección</Label>
                                                <Input value={data.client_address} onChange={(e) => setData('client_address', e.target.value)} placeholder="Av. Principal 1234, Temuco" className="mt-1" />
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {/* PASO 2: FALLECIDO */}
                            {step === 2 && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Nombre del Fallecido *</Label>
                                            <Input value={data.deceased_full_name} onChange={(e) => setData('deceased_full_name', e.target.value)} placeholder="Juan Pérez González" className="mt-1" />
                                            {errors.deceased_full_name && <p className="text-sm text-rose-600 mt-1">{errors.deceased_full_name}</p>}
                                        </div>
                                        <div>
                                            <Label>RUT del Fallecido *</Label>
                                            <Input value={data.deceased_rut} onChange={(e) => setData('deceased_rut', e.target.value)} placeholder="12.345.678-9" className="mt-1" required />
                                            {errors.deceased_rut && <p className="text-sm text-rose-600 mt-1">{errors.deceased_rut}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Fecha de Fallecimiento *</Label>
                                            <Input type="date" value={data.deceased_death_date} onChange={(e) => setData('deceased_death_date', e.target.value)} className="mt-1" required />
                                            {errors.deceased_death_date && <p className="text-sm text-rose-600 mt-1">{errors.deceased_death_date}</p>}
                                        </div>
                                        <div>
                                            <Label>Hora de Fallecimiento</Label>
                                            <Input type="time" value={data.deceased_death_time} onChange={(e) => setData('deceased_death_time', e.target.value)} className="mt-1" />
                                            {errors.deceased_death_time && <p className="text-sm text-rose-600 mt-1">{errors.deceased_death_time}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Lugar del Fallecimiento</Label>
                                            <Input value={data.deceased_death_location} onChange={(e) => setData('deceased_death_location', e.target.value)} placeholder="Hospital, domicilio, etc." className="mt-1" />
                                            {errors.deceased_death_location && <p className="text-sm text-rose-600 mt-1">{errors.deceased_death_location}</p>}
                                        </div>
                                        <div>
                                            <Label>Causa del Fallecimiento</Label>
                                            <Input value={data.deceased_cause_of_death} onChange={(e) => setData('deceased_cause_of_death', e.target.value)} placeholder="Ej: Paro cardíaco" className="mt-1" />
                                            {errors.deceased_cause_of_death && <p className="text-sm text-rose-600 mt-1">{errors.deceased_cause_of_death}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <Label>N° Certificado de Defunción</Label>
                                        <Input value={data.deceased_death_certificate} onChange={(e) => setData('deceased_death_certificate', e.target.value)} placeholder="CERT-2026-001" className="mt-1" />
                                    </div>
                                </>
                            )}

                            {/* PASO 3: TODO EN UNO */}
                            {step === 3 && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <div>
                                            <Label>Sucursal *</Label>
                                            <select value={data.branch_id} onChange={e => setData('branch_id', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm mt-1" required>
                                                <option value="">Seleccionar...</option>
                                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                            {errors.branch_id && <p className="text-sm text-rose-600 mt-1">{errors.branch_id}</p>}
                                        </div>
                                        <div>
                                            <Label>Previsión / Beneficio *</Label>
                                            <select value={data.beneficiary_type} onChange={e => setData('beneficiary_type', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm mt-1">
                                                {beneficiaryTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </select>
                                            <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                                                <Info className="h-3 w-3 mt-0.5 shrink-0" /> Solo informativo. No altera el valor del servicio.
                                            </p>
                                            {data.beneficiary_type === 'municipalidad' && (
                                                <p className="text-xs text-amber-600 mt-1 flex items-start gap-1">
                                                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> La municipalidad evalúa con asistente social (demora ~3 meses).
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* ─────────────────────────────────────────────
                                        CONVENIO INSTITUCIONAL (opcional)
                                    ─────────────────────────────────────────────
                                        Si el cliente pertenece a un convenio activo (club
                                        deportivo, municipalidad, empresa, etc.), aquí se
                                        selecciona para aplicar el descuento correspondiente.
                                        El descuento se refleja en el resumen de pago más abajo,
                                        y el `total_amount` que se envía al backend ya viene
                                        con el descuento aplicado (ver handleSubmit).
                                    */}
                                    <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Handshake className="w-4 h-4 text-rose-800" />
                                            <Label className="text-rose-800 font-bold">Convenio Institucional (Opcional)</Label>
                                        </div>
                                        <select
                                            value={data.agreement_id}
                                            onChange={e => setData('agreement_id', e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                        >
                                            <option value="">Sin convenio (Precio normal)</option>
                                            {agreements.map(a => (
                                                <option key={a.id} value={a.id}>
                                                    {a.name} — {Number(a.discount_percentage)}% de descuento
                                                </option>
                                            ))}
                                        </select>
                                        {agreements.length === 0 && (
                                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                <Info className="h-3 w-3" /> No hay convenios activos registrados.
                                            </p>
                                        )}
                                        {selectedAgreement && (
                                            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Se aplicará un descuento del {discountPercentage}% al total.
                                            </p>
                                        )}
                                        {errors.agreement_id && <p className="text-sm text-rose-600 mt-1">{errors.agreement_id}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2">
                                            <Label>Tipo de Servicio *</Label>
                                            <select value={data.service_type} onChange={e => handleServiceTypeChange(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm mt-1" required>
                                                <option value="">Seleccionar...</option>
                                                {serviceTypes.map((type) => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.service_type && <p className="text-sm text-rose-600 mt-1">{errors.service_type}</p>}
                                        </div>
                                        <div>
                                            <Label>Fecha y Hora de Inicio *</Label>
                                            <Input type="datetime-local" value={data.scheduled_at} onChange={e => setData('scheduled_at', e.target.value)} className="mt-1" required />
                                            {errors.scheduled_at && <p className="text-sm text-rose-600 mt-1">{errors.scheduled_at}</p>}
                                        </div>
                                    </div>

                                    {/* Duración editable */}
                                    <div>
                                        <Label htmlFor="duration_hours">Duración del servicio (horas) *</Label>
                                        <Input
                                            id="duration_hours"
                                            type="number"
                                            min="1"
                                            value={data.duration_hours}
                                            onChange={(e) => setData('duration_hours', e.target.value)}
                                            className="mt-1"
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Puedes ajustar la duración si el servicio es más corto o más largo.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="origin_location">Lugar de origen del fallecido</Label>
                                            <Input id="origin_location" value={data.origin_location} onChange={(e) => setData('origin_location', e.target.value)} placeholder="Hospital, domicilio, SML, etc." className="mt-1" />
                                            <p className="text-xs text-muted-foreground mt-1">De dónde se retira el cuerpo</p>
                                            {errors.origin_location && <p className="text-sm text-rose-600 mt-1">{errors.origin_location}</p>}
                                        </div>
                                        <div>
                                            <Label htmlFor="destination_location">Cementerio / Crematorio de destino</Label>
                                            <Input id="destination_location" value={data.destination_location} onChange={(e) => setData('destination_location', e.target.value)} placeholder="Cementerio Parque, Crematorio, etc." className="mt-1" />
                                            <p className="text-xs text-muted-foreground mt-1">A dónde se lleva el cuerpo</p>
                                            {errors.destination_location && <p className="text-sm text-rose-600 mt-1">{errors.destination_location}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="burial_at">Fecha y hora del entierro/cremación</Label>
                                        <Input
                                            id="burial_at"
                                            type="datetime-local"
                                            value={data.burial_at}
                                            onChange={(e) => setData('burial_at', e.target.value)}
                                            className="mt-1"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Si el cuerpo queda retenido, puedes dejarlo vacío y completarlo después.
                                        </p>
                                        {errors.burial_at && <p className="text-sm text-rose-600 mt-1">{errors.burial_at}</p>}
                                    </div>

                                    {/* ASIGNAR URNA O ATAÚD */}
                                    <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Package className="w-4 h-4 text-rose-800" />
                                            <Label className="text-rose-800 font-bold">Asignar Urna o Ataúd</Label>
                                        </div>
                                        <select value={data.inventory_item_id} onChange={e => setData('inventory_item_id', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                            <option value="">No asignar ahora</option>
                                            <optgroup label="Ataúdes">
                                                {availableItems.filter(i => i.category === 'ataud').map(item => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.code} - {item.name} ({formatPrice(Number(item.price))})
                                                    </option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Urnas">
                                                {availableItems.filter(i => i.category === 'urna').map(item => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.code} - {item.name} ({formatPrice(Number(item.price))})
                                                    </option>
                                                ))}
                                            </optgroup>
                                        </select>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Al asignar, se marcará una unidad específica como "En servicio".
                                        </p>
                                        {errors.inventory_item_id && <p className="text-sm text-rose-600 mt-1">{errors.inventory_item_id}</p>}
                                    </div>

                                    {/* ASIGNAR VEHÍCULO Y CHOFER */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Truck className="w-4 h-4 text-rose-800" />
                                                <Label className="text-rose-800 font-bold">Vehículo</Label>
                                            </div>
                                            <select value={data.vehicle_id} onChange={e => setData('vehicle_id', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                                <option value="">No asignar ahora</option>
                                                {availableVehicles.map(v => (
                                                    <option key={v.id} value={v.id}>{v.plate} - {v.type} {v.brand ? `(${v.brand})` : ''}</option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-muted-foreground mt-1">Vehículo disponible para el traslado.</p>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <UserCheck className="w-4 h-4 text-rose-800" />
                                                <Label className="text-rose-800 font-bold">Chofer</Label>
                                            </div>
                                            <select value={data.driver_id} onChange={e => setData('driver_id', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                                <option value="">No asignar ahora</option>
                                                {availableEmployees.map(emp => (
                                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-muted-foreground mt-1">Conductor responsable del servicio.</p>
                                        </div>
                                    </div>

                                    {/* REGISTRAR PAGO */}
                                    <div className="p-4 border border-emerald-200 dark:border-emerald-900 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DollarSign className="w-4 h-4 text-emerald-600" />
                                            <Label className="text-emerald-700 dark:text-emerald-400 font-bold">Registrar Abono Inicial</Label>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs">Total Bruto del servicio *</Label>
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={data.total_amount}
                                                    onChange={e => handleNumberChange('total_amount', e.target.value)}
                                                    placeholder="Ej: 1200000"
                                                    className="mt-1 bg-white dark:bg-slate-950"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Monto total acordado antes de aplicar convenio.
                                                </p>
                                                {errors.total_amount && <p className="text-sm text-rose-600 mt-1">{errors.total_amount}</p>}
                                            </div>
                                            <div>
                                                <Label className="text-xs">Abono inicial *</Label>
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={data.amount_paid}
                                                    onChange={e => handleNumberChange('amount_paid', e.target.value)}
                                                    placeholder="Ej: 600000"
                                                    className="mt-1 bg-white dark:bg-slate-950"
                                                />
                                                {finalTotal > 0 && (
                                                    <p className={`text-xs mt-1 font-medium ${amountPaid >= suggestedDeposit ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        Mínimo requerido (50%): {formatPrice(suggestedDeposit)}
                                                    </p>
                                                )}
                                                {errors.amount_paid && <p className="text-sm text-rose-600 mt-1">{errors.amount_paid}</p>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <Label className="text-xs">Medio</Label>
                                                <select value={data.payment_method} onChange={e => setData('payment_method', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-slate-950 px-3 text-sm mt-1">
                                                    <option value="efectivo">Efectivo</option>
                                                    <option value="transferencia">Transferencia</option>
                                                    <option value="tarjeta_debito">Tarjeta Débito</option>
                                                    <option value="tarjeta_credito">Tarjeta Crédito</option>
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="text-xs">Referencia</Label>
                                                <Input value={data.payment_reference} onChange={e => setData('payment_reference', e.target.value)} placeholder="Opcional" className="mt-1 bg-white dark:bg-slate-950" />
                                            </div>
                                        </div>

                                        {/* ─────────────────────────────────────────────
                                            RESUMEN DE PAGO CON DESGLOSE DE CONVENIO
                                        ─────────────────────────────────────────────
                                            Si hay convenio seleccionado, se muestra:
                                              - Subtotal (bruto)
                                              - Descuento (monto y %)
                                              - Total a pagar (final, con descuento)
                                              - Abono ingresado
                                              - Saldo pendiente (sobre el total final)
                                        */}
                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border mt-4 shadow-sm">
                                            <p className="font-medium text-slate-700 dark:text-slate-200 mb-2">Resumen de Pago</p>

                                            <div className="flex justify-between text-sm">
                                                <span>Subtotal:</span>
                                                <span className="font-medium">{formatPrice(baseTotal)}</span>
                                            </div>

                                            {selectedAgreement && (
                                                <div className="flex justify-between text-sm text-emerald-600 mt-1">
                                                    <span>Descuento ({discountPercentage}% · {selectedAgreement.name}):</span>
                                                    <span className="font-medium">-{formatPrice(discountAmount)}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between text-base font-bold border-t pt-2 mt-2 text-slate-800 dark:text-slate-100">
                                                <span>Total a Pagar:</span>
                                                <span className="text-rose-800 dark:text-rose-400">{formatPrice(finalTotal)}</span>
                                            </div>

                                            <div className="flex justify-between text-sm text-slate-500 mt-2">
                                                <span>Abono ingresado:</span>
                                                <span>{formatPrice(amountPaid)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-slate-500 border-t pt-1 mt-1">
                                                <span>Saldo pendiente:</span>
                                                <span className="font-bold">{formatPrice(balance)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-6">
                        <Link href="/services" className="w-full sm:w-auto">
                            <Button type="button" variant="ghost" className="w-full sm:w-auto">Cancelar</Button>
                        </Link>

                        <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                            {step > 1 && (
                                <Button type="button" variant="outline" onClick={prevStep} className="w-full sm:w-auto">
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                                </Button>
                            )}

                            {step < 3 ? (
                                <Button type="button" onClick={nextStep} className="w-full sm:w-auto bg-rose-800 hover:bg-rose-900 text-white">
                                    Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            ) : (
                                <Button type="submit" disabled={processing} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {processing ? 'Guardando...' : 'Guardar y Crear Todo'}
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}