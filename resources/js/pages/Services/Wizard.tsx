import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ChevronLeft, ChevronRight, Package, DollarSign } from 'lucide-react';

interface Client {
    id: number;
    name: string;
    rut: string;
}

interface Props {
    branches: Array<{ id: number; name: string }>;
    serviceTypes: Array<{ id: number; name: string; base_price: string; duration_hours: number }>;
    beneficiaryTypes: Array<{ value: string; label: string }>;
    availableItems: Array<{ id: number; code: string; name: string; category: string; stock: number; price: string }>;
    existingClients: Client[];
}

export default function ServicesWizard({
    branches,
    serviceTypes,
    beneficiaryTypes,
    availableItems,
    existingClients,
}: Props) {
    const [step, setStep] = useState(1);
    const [clientMode, setClientMode] = useState<'existing' | 'new'>('new');

    const { data, setData, post, processing, errors } = useForm({
        // Cliente
        existing_client_id: '',
        client_rut: '',
        client_name: '',
        client_phone: '',
        client_email: '',
        client_address: '',

        // Fallecido
        deceased_full_name: '',
        deceased_rut: '',
        deceased_death_date: '',
        deceased_death_certificate: '',

        // Resto de campos (Paso 3)
        branch_id: '',
        service_type_id: '',
        beneficiary_type: 'particular',
        scheduled_at: '',
        duration_hours: '48',
        base_price: '0',
        origin_location: '',
        destination_location: '',
        burial_at: '',
        inventory_item_id: '',
        initial_payment_amount: '',
        payment_method: 'efectivo',
        payment_reference: '',
    });

    const handleServiceTypeChange = (value: string) => {
        setData('service_type_id', value);
        const selected = serviceTypes.find(t => String(t.id) === value);
        if (selected) {
            setData('base_price', selected.base_price);
            setData('duration_hours', String(selected.duration_hours));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/services/quick-store');
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 3)); // Ahora son 3 pasos
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const formatPrice = (value: number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

    return (
        <>
            <Head title="Nuevo Expediente" />

            <div className="p-6 max-w-3xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold">Nuevo Expediente Funerario</h1>
                    <p className="text-muted-foreground mt-2">Completa los datos en 3 simples pasos</p>
                </div>

                {/* Barra de Progreso (3 pasos) */}
                <div className="flex items-center justify-between mb-8 relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10" />
                    <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 transition-all duration-300" 
                        style={{ width: `${((step - 1) / 2) * 100}%` }}
                    />
                    
                    {[1, 2, 3].map((i) => (
                        <div 
                            key={i} 
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                                step >= i ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-muted'
                            }`}
                        >
                            {step > i ? <Check className="w-5 h-5" /> : i}
                        </div>
                    ))}
                </div>

                {Object.keys(errors).length > 0 && (
                    <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                        <p className="font-bold mb-1">Revisa los siguientes campos:</p>
                        <ul className="list-disc list-inside">
                            {Object.entries(errors).map(([key, error]) => (
                                <li key={key}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {step === 1 && 'Paso 1: Datos del Cliente'}
                                {step === 2 && 'Paso 2: Datos del Fallecido'}
                                {step === 3 && 'Paso 3: Servicio, Recursos y Abono'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 min-h-[350px]">
                            
                            {/* PASO 1: CLIENTE */}
                            {step === 1 && (
                                <>
                                    {/* Toggle: Cliente existente / Nuevo cliente */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit mb-4">
            <button
                type="button"
                onClick={() => setClientMode('existing')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    clientMode === 'existing'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
            >
                Cliente existente
            </button>
            <button
                type="button"
                onClick={() => setClientMode('new')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    clientMode === 'new'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
            >
                Nuevo cliente
            </button>
        </div>

                                    {/* CLIENTE EXISTENTE */}
                                    {clientMode === 'existing' && (
                                        <div>
                                            <Label>Seleccionar Cliente *</Label>
                                            <select
                                                value={data.existing_client_id}
                                                onChange={(e) => setData('existing_client_id', e.target.value)}
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                            >
                                                <option value="">Seleccionar cliente...</option>
                                                {existingClients.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name} — {c.rut}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Selecciona un cliente ya registrado para vincularlo a este servicio.
                                            </p>
                                        </div>
                                    )}

                                    {/* CLIENTE NUEVO */}
                                    {clientMode === 'new' && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>RUT del Cliente *</Label>
                                                    <Input
                                                        value={data.client_rut}
                                                        onChange={(e) => setData('client_rut', e.target.value)}
                                                        placeholder="12.345.678-9"
                                                    />
                                                    {errors.client_rut && <p className="text-sm text-destructive mt-1">{errors.client_rut}</p>}
                                                </div>
                                                <div>
                                                    <Label>Nombre Completo *</Label>
                                                    <Input
                                                        value={data.client_name}
                                                        onChange={(e) => setData('client_name', e.target.value)}
                                                        placeholder="Juan Pérez González"
                                                    />
                                                    {errors.client_name && <p className="text-sm text-destructive mt-1">{errors.client_name}</p>}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Teléfono</Label>
                                                    <Input
                                                        value={data.client_phone}
                                                        onChange={(e) => setData('client_phone', e.target.value)}
                                                        placeholder="+56912345678"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Email</Label>
                                                    <Input
                                                        type="email"
                                                        value={data.client_email}
                                                        onChange={(e) => setData('client_email', e.target.value)}
                                                        placeholder="juan@email.cl"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label>Dirección</Label>
                                                <Input
                                                    value={data.client_address}
                                                    onChange={(e) => setData('client_address', e.target.value)}
                                                    placeholder="Av. Principal 1234, Temuco"
                                                />
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
                                            <Input
                                                value={data.deceased_full_name}
                                                onChange={(e) => setData('deceased_full_name', e.target.value)}
                                                placeholder="Juan Pérez González"
                                            />
                                            {errors.deceased_full_name && <p className="text-sm text-destructive mt-1">{errors.deceased_full_name}</p>}
                                        </div>
                                        <div>
                                            <Label>RUT del Fallecido</Label>
                                            <Input
                                                value={data.deceased_rut}
                                                onChange={(e) => setData('deceased_rut', e.target.value)}
                                                placeholder="12.345.678-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Fecha de Fallecimiento *</Label>
                                            <Input
                                                type="date"
                                                value={data.deceased_death_date}
                                                onChange={(e) => setData('deceased_death_date', e.target.value)}
                                            />
                                            {errors.deceased_death_date && <p className="text-sm text-destructive mt-1">{errors.deceased_death_date}</p>}
                                        </div>
                                        <div>
                                            <Label>N° Certificado de Defunción</Label>
                                            <Input
                                                value={data.deceased_death_certificate}
                                                onChange={(e) => setData('deceased_death_certificate', e.target.value)}
                                                placeholder="CERT-2026-001"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* PASO 3: TODO EN UNO */}
                            {step === 3 && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
                                        <div>
                                            <Label>Sucursal *</Label>
                                            <select value={data.branch_id} onChange={e => setData('branch_id', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" required>
                                                <option value="">Seleccionar...</option>
                                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                            {errors.branch_id && <p className="text-sm text-destructive mt-1">{errors.branch_id}</p>}
                                        </div>
                                        <div>
                                            <Label>Tipo de Beneficiario *</Label>
                                            <select 
                                                value={data.beneficiary_type} 
                                                onChange={e => setData('beneficiary_type', e.target.value)}
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                                            >
                                                {beneficiaryTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </select>
                                            {/* Texto de ayuda contextual */}
                                            {['afp', 'ips', 'dipreca', 'capredena'].includes(data.beneficiary_type) && (
                                                <p className="text-xs text-emerald-600 mt-1">
                                                    ✓ Esta institución cubre hasta $600.000 de la cuota mortuoria.
                                                    La familia paga la diferencia.
                                                </p>
                                            )}
                                            {data.beneficiary_type === 'municipal' && (
                                                <p className="text-xs text-amber-600 mt-1">
                                                    ⚠️ La municipalidad evalúa con asistente social (demora ~3 meses).
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2">
                                            <Label>Tipo de Servicio *</Label>
                                            <select value={data.service_type_id} onChange={e => handleServiceTypeChange(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" required>
                                                <option value="">Seleccionar...</option>
                                                {serviceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                            {errors.service_type_id && <p className="text-sm text-destructive mt-1">{errors.service_type_id}</p>}
                                        </div>
                                        <div>
                                            <Label>Fecha y Hora *</Label>
                                            <Input type="datetime-local" value={data.scheduled_at} onChange={e => setData('scheduled_at', e.target.value)} required />
                                            {errors.scheduled_at && <p className="text-sm text-destructive mt-1">{errors.scheduled_at}</p>}
                                        </div>
                                    </div>

                                    {/* Nuevos campos de ubicación */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="origin_location">Lugar de origen del fallecido</Label>
                                            <Input
                                                id="origin_location"
                                                value={data.origin_location}
                                                onChange={(e) => setData('origin_location', e.target.value)}
                                                placeholder="Hospital, domicilio, SML, etc."
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                De dónde se retira el cuerpo
                                            </p>
                                            {errors.origin_location && <p className="text-sm text-destructive mt-1">{errors.origin_location}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="destination_location">Cementerio / Crematorio de destino</Label>
                                            <Input
                                                id="destination_location"
                                                value={data.destination_location}
                                                onChange={(e) => setData('destination_location', e.target.value)}
                                                placeholder="Cementerio Parque, Crematorio, etc."
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                A dónde se lleva el cuerpo
                                            </p>
                                            {errors.destination_location && <p className="text-sm text-destructive mt-1">{errors.destination_location}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="burial_at">Fecha y hora del entierro/cremación</Label>
                                        <Input
                                            id="burial_at"
                                            type="datetime-local"
                                            value={data.burial_at}
                                            onChange={(e) => setData('burial_at', e.target.value)}
                                        />
                                        {errors.burial_at && <p className="text-sm text-destructive mt-1">{errors.burial_at}</p>}
                                    </div>

                                    {/* ASIGNAR URNA O ATAÚD */}
                                    <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Package className="w-4 h-4 text-primary" />
                                            <Label className="text-primary font-bold">Asignar Urna o Ataúd</Label>
                                        </div>
                                        <select 
                                            value={data.inventory_item_id} 
                                            onChange={e => setData('inventory_item_id', e.target.value)} 
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                        >
                                            <option value="">No asignar ahora</option>
                                            <optgroup label="Ataúdes (cuerpo completo)">
                                                {availableItems.filter(i => i.category === 'ataud').map(item => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.code} - {item.name} ({formatPrice(Number(item.price))}) - Stock: {item.stock}
                                                    </option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Urnas (cenizas)">
                                                {availableItems.filter(i => i.category === 'urna').map(item => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.code} - {item.name} ({formatPrice(Number(item.price))}) - Stock: {item.stock}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        </select>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Si selecciona un item, se descontará del stock inmediatamente.
                                        </p>
                                        {errors.inventory_item_id && <p className="text-sm text-destructive mt-1">{errors.inventory_item_id}</p>}
                                    </div>

                                    {/* REGISTRAR PAGO */}
                                    <div className="p-4 border border-emerald-500/20 rounded-lg bg-emerald-500/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DollarSign className="w-4 h-4 text-emerald-500" />
                                            <Label className="text-emerald-600 font-bold">Registrar Abono Inicial</Label>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <Label className="text-xs">Monto</Label>
                                                <Input 
                                                    type="number" 
                                                    value={data.initial_payment_amount} 
                                                    onChange={e => setData('initial_payment_amount', e.target.value)} 
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Medio</Label>
                                                <select value={data.payment_method} onChange={e => setData('payment_method', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                                                    <option value="efectivo">Efectivo</option>
                                                    <option value="transferencia">Transferencia</option>
                                                    <option value="tarjeta_debito">Tarjeta Débito</option>
                                                    <option value="tarjeta_credito">Tarjeta Crédito</option>
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="text-xs">Referencia</Label>
                                                <Input value={data.payment_reference} onChange={e => setData('payment_reference', e.target.value)} placeholder="Opcional" />
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Total a pagar: <strong>{formatPrice(Number(data.base_price))}</strong>
                                        </p>
                                    </div>
                                </>
                            )}

                        </CardContent>
                    </Card>

                    <div className="flex justify-between mt-6">
                        <Link href="/services">
                            <Button type="button" variant="ghost">Cancelar</Button>
                        </Link>
                        
                        <div className="flex gap-2">
                            {step > 1 && (
                                <Button type="button" variant="outline" onClick={prevStep}>
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                                </Button>
                            )}
                            
                            {step < 3 ? (
                                <Button type="button" onClick={nextStep}>
                                    Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            ) : (
                                <Button type="submit" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
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