import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
    CheckCircle2, Box, Package, AlertTriangle, Info,
    ArrowLeft, Pencil, FileText, Receipt, DollarSign, Calendar,
    User, Users, Truck, Plus, X, ShieldCheck, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface Client { id: number; name: string; rut: string; email: string | null; phone: string | null; }
interface Deceased { id: number; full_name: string; rut: string | null; death_date: string; }
interface User { id: number; name: string; }

interface Agreement {
    id: number;
    name: string;
    discount_percentage: number;
}

interface InventoryItem {
    id: number; code: string; name: string; category: string; material: string | null;
    price: string; pivot?: { quantity: number; unit_price: string; notes: string | null; };
}

interface Vehicle {
    id: number; plate: string; type: string; type_label: string; brand: string | null;
    model: string | null; status: string; pivot?: { departs_at: string | null; returns_at: string | null; notes: string | null; };
}

interface Payment {
    id: number; uuid: string; receipt_number: string; amount: string; payment_method: string;
    payment_method_label: string; reference: string | null; payment_date: string;
    notes: string | null; receipt_path: string | null; created_at: string;
}

interface Employee { id: number; name: string; email: string; roles: Array<{ name: string }>; }

interface ServiceAssignment {
    id: number; role_in_service: string; role_label: string; notes: string | null;
    user: { id: number; name: string; email: string };
}

interface Service {
    id: number; uuid: string; code: string; status: string; status_label: string;
    scheduled_at: string; ends_at: string | null; duration_hours: number;
    seremi_extension_granted: boolean; seremi_resolution_number: string | null;
    seremi_resolution_date: string | null; origin_location: string | null;
    destination_location: string | null; burial_at: string | null; base_price: string;
    additional_charges: string; discount: string; total_price: string;
    beneficiary_type: string; beneficiary_label: string;
    agreement: Agreement | null;
    client_notes: string | null; internal_notes: string | null;
    rejection_reason: string | null; approved_at: string | null;
    client: Client | null; deceased: Deceased | null; service_type: string; service_type_label: string;
    branch: { name: string; address?: string | null } | null;
    created_by: User | null; approved_by: User | null;
    inventory_items: InventoryItem[]; vehicles: Vehicle[]; payments: Payment[];
    assignments: ServiceAssignment[]; total_paid: number; balance: number;
    is_fully_paid: boolean; payment_status: string; created_at: string; updated_at: string;
}

interface Props {
    service: Service;
    availableItems: InventoryItem[];
    availableVehicles: Vehicle[];
    availableEmployees: Employee[];
    financials: { total_paid: number; balance: number; is_fully_paid: boolean; };
}

export default function ServicesShow({ service, availableItems, availableVehicles, availableEmployees, financials }: Props) {
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const [selectedItem, setSelectedItem] = useState('');
    const [itemNotes, setItemNotes] = useState('');

    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [vehicleNotes, setVehicleNotes] = useState('');

    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [employeeRole, setEmployeeRole] = useState('coordinator');
    const [employeeNotes, setEmployeeNotes] = useState('');

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('efectivo');
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
    const [paymentNotes, setPaymentNotes] = useState('');

    const handleApprove = () => { if (confirm(`¿Aprobar el servicio ${service.code}?`)) router.post(`/services/${service.uuid}/approve`); };
    const handleReject = () => {
        if (!rejectionReason.trim()) return alert('Debe indicar un motivo de rechazo');
        router.post(`/services/${service.uuid}/reject`, { rejection_reason: rejectionReason });
        setShowRejectModal(false);
    };
    const handleAssignItem = (e: React.FormEvent) => {
        e.preventDefault(); if (!selectedItem) return;
        router.post(`/services/${service.uuid}/assign-item`, { inventory_item_id: selectedItem, notes: itemNotes }, { onSuccess: () => { setSelectedItem(''); setItemNotes(''); } });
    };
    const handleRemoveItem = (itemId: number, itemName: string) => { if (confirm(`¿Quitar "${itemName}" del servicio? La unidad quedará disponible.`)) router.delete(`/services/${service.uuid}/items/${itemId}`); };
    const handleAssignVehicle = (e: React.FormEvent) => {
        e.preventDefault(); if (!selectedVehicle) return;
        router.post(`/services/${service.uuid}/assign-vehicle`, { vehicle_id: selectedVehicle, notes: vehicleNotes }, { onSuccess: () => { setSelectedVehicle(''); setVehicleNotes(''); } });
    };
    const handleRemoveVehicle = (vehicleId: number, plate: string) => { if (confirm(`¿Quitar el vehículo ${plate} del servicio?`)) router.delete(`/services/${service.uuid}/vehicles/${vehicleId}`); };
    const handleAssignEmployee = (e: React.FormEvent) => {
        e.preventDefault(); if (!selectedEmployee) return;
        router.post(`/services/${service.uuid}/assign-employee`, { user_id: selectedEmployee, role_in_service: employeeRole, notes: employeeNotes }, { onSuccess: () => { setSelectedEmployee(''); setEmployeeRole('coordinator'); setEmployeeNotes(''); } });
    };
    const handleRemoveEmployee = (assignmentId: number, name: string) => { if (confirm(`¿Quitar a ${name} del servicio?`)) router.delete(`/services/${service.uuid}/assignments/${assignmentId}`); };
    const handleRegisterPayment = (e: React.FormEvent) => {
        e.preventDefault(); if (!paymentAmount) return;
        router.post(`/services/${service.uuid}/payments`, { amount: paymentAmount, payment_method: paymentMethod, reference: paymentReference || null, payment_date: paymentDate, notes: paymentNotes || null }, { onSuccess: () => { setShowPaymentModal(false); setPaymentAmount(''); setPaymentMethod('efectivo'); setPaymentReference(''); setPaymentNotes(''); } });
    };

    const formatDate = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    const formatDateShort = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    const formatPrice = (price: string | number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(price));

    const getPaymentColor = (percentage: number) => {
        if (percentage >= 100) return 'bg-emerald-500';
        if (percentage >= 90) return 'bg-green-400';
        if (percentage >= 50) return 'bg-yellow-400';
        if (percentage >= 25) return 'bg-orange-500';
        return 'bg-rose-500';
    };
    const getPaymentText = (percentage: number) => {
        if (percentage >= 100) return 'text-emerald-600';
        if (percentage >= 90) return 'text-green-500';
        if (percentage >= 50) return 'text-yellow-600';
        if (percentage >= 25) return 'text-orange-600';
        return 'text-rose-600';
    };

    const canApprove = service.status === 'pending' || service.status === 'in_review' || service.status === 'with_observations';
    const canAssignResources = service.status === 'accepted' || service.status === 'in_progress';

    const total = parseFloat(service.total_price) || 0;
    const paid = financials.total_paid || 0;
    const percentage = total > 0 ? Math.min((paid / total) * 100, 100) : 0;

    // ───────── Datos para la tarjeta económica ─────────
    const precioBase = parseFloat(service.base_price) || 0;
    const cargosAdicionales = parseFloat(service.additional_charges) || 0;
    const manualDiscount = parseFloat(service.discount) || 0;
    const discountAmount = service.agreement
        ? (total * service.agreement.discount_percentage) / 100
        : manualDiscount;
    const totalPagar = total;
    const saldoPendiente = financials.balance;

    return (
        <>
            <Head title={service.code} />

            <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
                    <div className="flex items-start gap-3">
                        <Link href="/services"><Button variant="outline" size="icon" className="shrink-0 mt-1"><ArrowLeft className="h-4 w-4" /></Button></Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                                {service.code}
                                <Badge variant={service.status === 'accepted' ? 'default' : service.status === 'rejected' || service.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-sm">
                                    {service.status_label}
                                </Badge>
                                {financials.is_fully_paid && <Badge className="bg-emerald-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1"/> Pagado</Badge>}
                            </h1>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                                <span className="font-mono">{service.uuid}</span>
                                <span>•</span>
                                <span>Creado el {formatDate(service.created_at)}</span>
                                {service.created_by && (
                                    <>
                                        <span>•</span>
                                        <span>Por <strong>{service.created_by.name}</strong></span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={`/services/${service.uuid}/edit`} className="flex-1 sm:flex-initial">
                            <Button variant="outline" className="w-full sm:w-auto"><Pencil className="h-4 w-4 mr-1" /> Editar</Button>
                        </Link>
                        <a href={`/services/${service.uuid}/contract`} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-initial">
                            <Button variant="outline" className="w-full sm:w-auto"><FileText className="h-4 w-4 mr-1" /> Contrato</Button>
                        </a>
                        {financials.is_fully_paid && (
                            <a href={`/services/${service.uuid}/paz-y-salvo`} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-initial">
                                <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"><Receipt className="h-4 w-4 mr-1" /> Paz y Salvo</Button>
                            </a>
                        )}
                    </div>
                </div>

                {canApprove && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-sm text-rose-800 dark:text-rose-300 font-medium">Este servicio está pendiente de aprobación.</p>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button onClick={handleApprove} className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white">Aprobar Servicio</Button>
                            <Button variant="destructive" onClick={() => setShowRejectModal(true)} className="flex-1 sm:flex-initial">Rechazar</Button>
                        </div>
                    </div>
                )}

                {service.status === 'rejected' && service.rejection_reason && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                        <div>
                            <p className="text-rose-800 font-bold">Servicio Rechazado</p>
                            <p className="text-rose-700 text-sm mt-1">Motivo: {service.rejection_reason}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* COLUMNA IZQUIERDA */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* CONTRATANTE Y FALLECIDO */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="shadow-sm">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><User className="h-4 w-4"/> Cliente</CardTitle>
                                    {service.client?.id && <Link href={`/clients/${service.client.id}/edit?from=/services/${service.uuid}`}><Button variant="ghost" size="sm" className="h-6 px-2 text-xs">Editar</Button></Link>}
                                </CardHeader>
                                <CardContent>
                                    <p className="font-bold text-lg">{service.client?.name || 'Sin cliente'}</p>
                                    <p className="text-sm text-muted-foreground">{service.client?.rut || '—'}</p>
                                    {service.client?.phone && <p className="text-sm mt-1">{service.client.phone}</p>}
                                    {service.client?.email && <p className="text-sm">{service.client.email}</p>}
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4"/> Fallecido</CardTitle>
                                    {service.deceased?.id && <Link href={`/deceased/${service.deceased.id}/edit?from=/services/${service.uuid}`}><Button variant="ghost" size="sm" className="h-6 px-2 text-xs">Editar</Button></Link>}
                                </CardHeader>
                                <CardContent>
                                    <p className="font-bold text-lg">{service.deceased?.full_name || 'Sin fallecido'}</p>
                                    {service.deceased?.rut && <p className="text-sm text-muted-foreground">{service.deceased.rut}</p>}
                                    <p className="text-sm mt-1 text-muted-foreground">Fallecimiento: {formatDateShort(service.deceased?.death_date || null)}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* PROGRAMACIÓN */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/40">
                                <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-5 w-5 text-rose-800" /> Programación del Servicio</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                    <div><dt className="text-muted-foreground text-xs">Tipo de servicio</dt><dd className="font-medium mt-0.5">{service.service_type_label ?? 'Sin tipo'}</dd></div>
                                    <div><dt className="text-muted-foreground text-xs">Sucursal</dt><dd className="font-medium mt-0.5">{service.branch?.name ?? 'Sin sucursal'}</dd></div>
                                    <div><dt className="text-muted-foreground text-xs">Inicio</dt><dd className="font-medium mt-0.5">{formatDate(service.scheduled_at)}</dd></div>
                                    <div><dt className="text-muted-foreground text-xs">Fin estimado</dt><dd className="font-medium mt-0.5">{formatDate(service.ends_at)}</dd></div>
                                    <div><dt className="text-muted-foreground text-xs">Duración</dt><dd className="font-medium mt-0.5">{service.duration_hours} horas {service.seremi_extension_granted && <Badge variant="secondary" className="ml-1 text-[10px]">Ext. Seremi</Badge>}</dd></div>
                                    <div><dt className="text-muted-foreground text-xs">Lugar de origen</dt><dd className="font-medium mt-0.5">{service.origin_location || '—'}</dd></div>
                                    <div className="sm:col-span-2"><dt className="text-muted-foreground text-xs">Destino</dt><dd className="font-medium mt-0.5">{service.destination_location || '—'}</dd></div>
                                    {service.burial_at && <div className="sm:col-span-2"><dt className="text-muted-foreground text-xs">Entierro / Cremación</dt><dd className="font-medium mt-0.5">{formatDate(service.burial_at)}</dd></div>}
                                </dl>
                            </CardContent>
                        </Card>

                        {/* INFORMACIÓN ECONÓMICA */}
                        <Card className="shadow-sm">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <DollarSign className="h-5 w-5 text-emerald-600" /> Información Económica
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">

                                {/* Desglose */}
                                <div className="space-y-1.5 pb-4 border-b text-sm">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Servicio Base</span>
                                        <span>{formatPrice(precioBase)}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span className="flex items-center gap-1.5"><Box className="h-4 w-4" /> Cargos adicionales</span>
                                        <span>{formatPrice(cargosAdicionales)}</span>
                                    </div>
                                </div>

                                {/* Beneficiario */}
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Tipo de Beneficiario</span>
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                        {service.beneficiary_label}
                                    </Badge>
                                </div>

                                {/* Descuento (Condicional) */}
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        Descuento
                                        {service.agreement && (
                                            <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                {service.agreement.name} ({service.agreement.discount_percentage}%)
                                            </span>
                                        )}
                                    </span>
                                    <span className={discountAmount > 0 ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                                        {discountAmount > 0 ? `-${formatPrice(discountAmount)}` : '-$0'}
                                    </span>
                                </div>

                                <div className="border-t pt-4 space-y-3">
                                    {/* Total */}
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg text-slate-800 dark:text-slate-200">Total a pagar</span>
                                        <span className="font-bold text-xl text-rose-800 dark:text-rose-400 flex flex-col items-end">
                                            {formatPrice(totalPagar)}
                                            {service.agreement && (
                                                <span className="text-xs font-normal text-emerald-600">
                                                    (Descuento aplicado)
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    {/* Pagos y saldo */}
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 space-y-2 border">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <CreditCard className="h-4 w-4" /> Pagos / Abonos realizados
                                            </span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                {formatPrice(paid)}
                                            </span>
                                        </div>

                                        {saldoPendiente > 0 ? (
                                            <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                                                <span className="font-bold text-rose-600">Saldo pendiente</span>
                                                <span className="font-bold text-rose-600">
                                                    {formatPrice(saldoPendiente)}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                                                <span className="font-bold text-emerald-600 flex items-center gap-1">
                                                    <ShieldCheck className="h-4 w-4" /> Pagado en su totalidad
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </CardContent>
                        </Card>

                        {/* METADATOS Y AUDITORÍA */}
                        <Card className="shadow-sm bg-slate-50/50 dark:bg-slate-900/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                                    <Info className="h-4 w-4" /> Información de Auditoría
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Creado por:</span>
                                    <span className="font-medium">{service.created_by?.name || 'Sistema'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Fecha de creación:</span>
                                    <span className="font-medium">{formatDate(service.created_at)}</span>
                                </div>
                                {service.approved_by && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Aprobado por:</span>
                                        <span className="font-medium">{service.approved_by.name}</span>
                                    </div>
                                )}
                                {service.approved_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Fecha de aprobación:</span>
                                        <span className="font-medium">{formatDate(service.approved_at)}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </div>

                    {/* COLUMNA DERECHA */}
                    <div className="space-y-6">

                        {/* PAGOS Y SALDOS */}
                        <Card className="shadow-sm border-t-4 border-t-rose-800">
                            <CardHeader className="pb-3 flex flex-row items-center justify-between bg-slate-50 dark:bg-slate-900/40">
                                <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-5 w-5 text-rose-800" /> Pagos</CardTitle>
                                {!financials.is_fully_paid && service.status === 'accepted' && (
                                    <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                                        <DialogTrigger asChild><Button size="sm" className="bg-rose-800 hover:bg-rose-900 text-white shadow-sm">Registrar Pago</Button></DialogTrigger>
                                        <DialogContent className="max-w-md">
                                            <DialogHeader><DialogTitle>Registrar Pago</DialogTitle></DialogHeader>
                                            <form onSubmit={handleRegisterPayment} className="space-y-4 pt-4">
                                                <div>
                                                    <Label>Monto *</Label>
                                                    <Input type="number" min="1" max={financials.balance} value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required className="mt-1" />
                                                    <div className="flex justify-between items-center mt-1">
                                                        <p className="text-xs text-muted-foreground">Saldo: {formatPrice(financials.balance)}</p>
                                                        <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs text-rose-800" onClick={() => setPaymentAmount(String(financials.balance))}>Pagar saldo total</Button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label>Medio de pago *</Label>
                                                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm mt-1">
                                                        <option value="efectivo">Efectivo</option>
                                                        <option value="transferencia">Transferencia</option>
                                                        <option value="tarjeta_credito">Tarjeta de crédito</option>
                                                        <option value="tarjeta_debito">Tarjeta de débito</option>
                                                        <option value="cheque">Cheque</option>
                                                        <option value="convenio">Convenio / Cuota mortuoria</option>
                                                    </select>
                                                </div>
                                                <div><Label>Fecha *</Label><Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required className="mt-1" /></div>
                                                <div><Label>Referencia</Label><Input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Opcional" className="mt-1" /></div>
                                                <div><Label>Notas</Label><textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows={2} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1" /></div>
                                                <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)}>Cancelar</Button><Button type="submit" className="bg-rose-800 text-white">Guardar Pago</Button></div>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                {financials.is_fully_paid && (
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg flex items-center gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                                        <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400">Servicio Pagado al 100%</p>
                                    </div>
                                )}

                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="font-medium">Progreso de pago</span>
                                        <span className={`font-bold ${getPaymentText(percentage)}`}>{percentage.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-500 ease-out ${getPaymentColor(percentage)}`} style={{ width: `${percentage}%` }} />
                                    </div>
                                    <p className={`text-[11px] mt-1.5 font-medium ${percentage >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {percentage >= 100 ? 'Servicio totalmente pagado' : percentage >= 50 ? 'Abono mínimo cumplido' : 'Falta abono mínimo (50%)'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border">
                                    <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Total</p><p className="font-bold text-sm">{formatPrice(total)}</p></div>
                                    <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Pagado</p><p className={`font-bold text-sm ${getPaymentText(percentage)}`}>{formatPrice(paid)}</p></div>
                                    <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Saldo</p><p className={`font-bold text-sm ${financials.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatPrice(financials.balance || 0)}</p></div>
                                </div>

                                {/* Lista de pagos */}
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                    {service.payments && service.payments.length > 0 ? (
                                        service.payments.map((p) => (
                                            <div key={p.id} className="flex items-center justify-between p-2.5 border rounded-lg bg-card hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                                                <div>
                                                    <p className="font-medium text-xs">{p.receipt_number}</p>
                                                    <p className="text-[10px] text-muted-foreground">{p.payment_method_label} · {formatDateShort(p.payment_date)}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-xs">{formatPrice(p.amount)}</span>
                                                    <a
                                                        href={`/payments/${p.id}/pdf`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Descargar comprobante en PDF"
                                                        className="flex items-center gap-1.5 px-2 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors text-[10px] font-semibold"
                                                    >
                                                        <FileText className="h-3.5 w-3.5" />
                                                        PDF
                                                    </a>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic text-center py-2">No hay pagos registrados</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* RECURSOS ASIGNADOS */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/40">
                                <CardTitle className="text-base flex items-center gap-2"><Package className="h-5 w-5 text-rose-800" /> Recursos Asignados</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-5">

                                {/* Items */}
                                <div>
                                    <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5"><Box className="h-4 w-4 text-rose-800" /> Ataúdes y Urnas</h4>
                                    {service.inventory_items && service.inventory_items.length > 0 ? (
                                        <div className="space-y-1.5 mb-2">
                                            {service.inventory_items.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-2 border rounded-md bg-slate-50 dark:bg-slate-900/50 text-xs">
                                                    <div><p className="font-medium">{item.code}</p><p className="text-muted-foreground">{item.name}</p></div>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-600" onClick={() => handleRemoveItem(item.id, item.name)}><X className="h-3 w-3" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (<p className="text-xs text-muted-foreground italic mb-2">No hay asignados</p>)}

                                    {canAssignResources && (
                                        <form onSubmit={handleAssignItem} className="flex gap-1.5 items-end bg-slate-50 dark:bg-slate-900/30 p-2 rounded-md border">
                                            <div className="flex-1 min-w-0">
                                                <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)} className="h-8 w-full text-xs rounded border-input bg-background px-2">
                                                    <option value="">Seleccionar...</option>
                                                    <optgroup label="Ataúdes">{availableItems.filter(i => i.category === 'ataud').map((item) => (<option key={item.id} value={item.id}>{item.code} - {item.name}</option>))}</optgroup>
                                                    <optgroup label="Urnas">{availableItems.filter(i => i.category === 'urna').map((item) => (<option key={item.id} value={item.id}>{item.code} - {item.name}</option>))}</optgroup>
                                                </select>
                                            </div>
                                            <Button type="submit" size="sm" className="h-8 px-2 bg-rose-800 hover:bg-rose-900 text-white disabled:opacity-50 disabled:cursor-not-allowed" disabled={!selectedItem}><Plus className="h-3 w-3" /></Button>
                                        </form>
                                    )}
                                </div>

                                {/* Vehículos */}
                                <div>
                                    <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5"><Truck className="h-4 w-4 text-rose-800" /> Vehículos</h4>
                                    {service.vehicles && service.vehicles.length > 0 ? (
                                        <div className="space-y-1.5 mb-2">
                                            {service.vehicles.map((v) => (
                                                <div key={v.id} className="flex items-center justify-between p-2 border rounded-md bg-slate-50 dark:bg-slate-900/50 text-xs">
                                                    <div><p className="font-medium">{v.plate} - {v.type_label}</p></div>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-600" onClick={() => handleRemoveVehicle(v.id, v.plate)}><X className="h-3 w-3" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (<p className="text-xs text-muted-foreground italic mb-2">No hay asignados</p>)}

                                    {canAssignResources && (
                                        <form onSubmit={handleAssignVehicle} className="flex gap-1.5 items-end bg-slate-50 dark:bg-slate-900/30 p-2 rounded-md border">
                                            <div className="flex-1 min-w-0">
                                                <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="h-8 w-full text-xs rounded border-input bg-background px-2">
                                                    <option value="">Seleccionar...</option>
                                                    {availableVehicles.map((v) => (<option key={v.id} value={v.id}>{v.plate} - {v.type_label}</option>))}
                                                </select>
                                            </div>
                                            <Button type="submit" size="sm" className="h-8 px-2 bg-rose-800 hover:bg-rose-900 text-white disabled:opacity-50 disabled:cursor-not-allowed" disabled={!selectedVehicle}><Plus className="h-3 w-3" /></Button>
                                        </form>
                                    )}
                                </div>

                                {/* Personal */}
                                <div>
                                    <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5"><Users className="h-4 w-4 text-rose-800" /> Personal</h4>
                                    {service.assignments && service.assignments.length > 0 ? (
                                        <div className="space-y-1.5 mb-2">
                                            {service.assignments.map((a) => (
                                                <div key={a.id} className="flex items-center justify-between p-2 border rounded-md bg-slate-50 dark:bg-slate-900/50 text-xs">
                                                    <div><p className="font-medium">{a.user.name}</p><p className="text-muted-foreground">{a.role_label}</p></div>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-600" onClick={() => handleRemoveEmployee(a.id, a.user.name)}><X className="h-3 w-3" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (<p className="text-xs text-muted-foreground italic mb-2">No hay asignados</p>)}

                                    {canAssignResources && (
                                        <form onSubmit={handleAssignEmployee} className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-900/30 p-2 rounded-md border">
                                            <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="h-8 w-full text-xs rounded border-input bg-background px-2">
                                                <option value="">Seleccionar empleado...</option>
                                                {availableEmployees.map((emp) => (<option key={emp.id} value={emp.id}>{emp.name} ({emp.roles.map(r => r.name).join(', ')})</option>))}
                                            </select>
                                            <div className="flex gap-2">
                                                <select value={employeeRole} onChange={(e) => setEmployeeRole(e.target.value)} className="h-8 flex-1 text-xs rounded border-input bg-background px-2">
                                                    <option value="coordinator">Coordinador</option>
                                                    <option value="assistant">Asistente</option>
                                                    <option value="driver">Conductor</option>
                                                </select>
                                                <Button type="submit" size="sm" className="h-8 px-3 bg-rose-800 hover:bg-rose-900 text-white disabled:opacity-50 disabled:cursor-not-allowed" disabled={!selectedEmployee}>Asignar</Button>
                                            </div>
                                        </form>
                                    )}

                                    {canAssignResources && availableEmployees.length === 0 && (
                                        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg flex items-start gap-2">
                                            <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-amber-800 dark:text-amber-200">No hay empleados disponibles en la fecha del servicio.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>

                {/* Modal rechazo */}
                {showRejectModal && createPortal(
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
                        <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4 shadow-2xl border border-border">
                            <h3 className="text-lg font-bold mb-4">Rechazar Servicio</h3>
                            <Label htmlFor="rejection_reason">Motivo del rechazo *</Label>
                            <textarea id="rejection_reason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={4} placeholder="Explique el motivo del rechazo..." className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-2" />
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancelar</Button>
                                <Button variant="destructive" onClick={handleReject}>Confirmar Rechazo</Button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </>
    );
}