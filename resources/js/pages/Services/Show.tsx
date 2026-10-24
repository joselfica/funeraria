import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
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
interface ServiceType { id: number; name: string; }
interface User { id: number; name: string; }

interface InventoryItem {
    id: number;
    code: string;
    name: string;
    category: string;
    material: string | null;
    stock: number;
    price: string;
    pivot?: {
        quantity: number;
        unit_price: string;
        notes: string | null;
    };
}

interface Vehicle {
    id: number;
    plate: string;
    type: string;
    type_label: string;
    brand: string | null;
    model: string | null;
    status: string;
    pivot?: {
        departs_at: string | null;
        returns_at: string | null;
        notes: string | null;
    };
}

interface Payment {
    id: number;
    uuid: string;
    receipt_number: string;
    amount: string;
    payment_method: string;
    payment_method_label: string;
    reference: string | null;
    payment_date: string;
    notes: string | null;
    receipt_path: string | null;
    created_at: string;
}

interface Employee {
    id: number;
    name: string;
    email: string;
    roles: Array<{ name: string }>;
}

interface ServiceAssignment {
    id: number;
    role_in_service: string;
    role_label: string;
    notes: string | null;
    user: { id: number; name: string; email: string };
}

interface Service {
    id: number;
    uuid: string;
    code: string;
    status: string;
    status_label: string;
    scheduled_at: string;
    ends_at: string | null;
    duration_hours: number;
    base_price: string;
    additional_charges: string;
    discount: string;
    total_price: string;
    client_notes: string | null;
    internal_notes: string | null;
    rejection_reason: string | null;
    approved_at: string | null;
    client: Client;
    deceased: Deceased;
    service_type: ServiceType;
    created_by: User | null;
    approved_by: User | null;
    inventory_items: InventoryItem[];
    vehicles: Vehicle[];
    payments: Payment[];
    assignments: ServiceAssignment[];
    total_paid: number;
    balance: number;
    is_fully_paid: boolean;
    payment_status: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    service: Service;
    availableItems: InventoryItem[];
    availableVehicles: Vehicle[];
    availableEmployees: Employee[];
    financials: {
        total_paid: number;
        balance: number;
        is_fully_paid: boolean;
    };
}

export default function ServicesShow({ service, availableItems, availableVehicles, availableEmployees, financials }: Props) {
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    // Estados para asignación
    const [selectedItem, setSelectedItem] = useState('');
    const [itemQuantity, setItemQuantity] = useState('1');
    const [itemNotes, setItemNotes] = useState('');

    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [vehicleNotes, setVehicleNotes] = useState('');

    // Estados para asignación de empleados
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [employeeRole, setEmployeeRole] = useState('coordinator');
    const [employeeNotes, setEmployeeNotes] = useState('');

    // Estados para pagos
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('efectivo');
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
    const [paymentNotes, setPaymentNotes] = useState('');

    const handleApprove = () => {
        if (confirm(`¿Aprobar el servicio ${service.code}?`)) {
            router.post(`/services/${service.id}/approve`);
        }
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            alert('Debe indicar un motivo de rechazo');
            return;
        }
        router.post(`/services/${service.id}/reject`, {
            rejection_reason: rejectionReason,
        });
        setShowRejectModal(false);
    };

    const handleAssignItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;
        router.post(`/services/${service.id}/assign-item`, {
            inventory_item_id: selectedItem,
            quantity: itemQuantity,
            notes: itemNotes,
        }, {
            onSuccess: () => {
                setSelectedItem('');
                setItemQuantity('1');
                setItemNotes('');
            },
        });
    };

    const handleRemoveItem = (itemId: number, itemName: string) => {
        if (confirm(`¿Quitar "${itemName}" del servicio? Se devolverá el stock.`)) {
            router.delete(`/services/${service.id}/items/${itemId}`);
        }
    };

    const handleAssignVehicle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVehicle) return;
        router.post(`/services/${service.id}/assign-vehicle`, {
            vehicle_id: selectedVehicle,
            notes: vehicleNotes,
        }, {
            onSuccess: () => {
                setSelectedVehicle('');
                setVehicleNotes('');
            },
        });
    };

    const handleRemoveVehicle = (vehicleId: number, plate: string) => {
        if (confirm(`¿Quitar el vehículo ${plate} del servicio?`)) {
            router.delete(`/services/${service.id}/vehicles/${vehicleId}`);
        }
    };

    const handleAssignEmployee = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) return;

        router.post(`/services/${service.id}/assign-employee`, {
            user_id: selectedEmployee,
            role_in_service: employeeRole,
            notes: employeeNotes,
        }, {
            onSuccess: () => {
                setSelectedEmployee('');
                setEmployeeRole('coordinator');
                setEmployeeNotes('');
            },
        });
    };

    const handleRemoveEmployee = (assignmentId: number, name: string) => {
        if (confirm(`¿Quitar a ${name} del servicio?`)) {
            router.delete(`/services/${service.id}/assignments/${assignmentId}`);
        }
    };

    const handleRegisterPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentAmount) return;

        router.post(`/services/${service.id}/payments`, {
            amount: paymentAmount,
            payment_method: paymentMethod,
            reference: paymentReference || null,
            payment_date: paymentDate,
            notes: paymentNotes || null,
        }, {
            onSuccess: () => {
                setShowPaymentModal(false);
                setPaymentAmount('');
                setPaymentMethod('efectivo');
                setPaymentReference('');
                setPaymentNotes('');
            },
        });
    };

    const formatDate = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('es-CL', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const formatPrice = (price: string) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(parseFloat(price));

    /**
     * Calcula el color de la barra de progreso según el porcentaje pagado.
     * 0-24%: Rojo | 25-49%: Naranja | 50-89%: Amarillo | 90-99%: Verde claro | 100%: Esmeralda
     */
    const getPaymentColor = (percentage: number) => {
        if (percentage >= 100) return 'bg-emerald-500';
        if (percentage >= 90) return 'bg-green-400';
        if (percentage >= 50) return 'bg-yellow-400';
        if (percentage >= 25) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getPaymentText = (percentage: number) => {
        if (percentage >= 100) return 'text-emerald-500';
        if (percentage >= 90) return 'text-green-400';
        if (percentage >= 50) return 'text-yellow-400';
        if (percentage >= 25) return 'text-orange-500';
        return 'text-red-500';
    };

    const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case 'accepted': return 'default';
            case 'pending': return 'secondary';
            case 'rejected': return 'destructive';
            case 'completed': return 'default';
            case 'cancelled': return 'destructive';
            default: return 'outline';
        }
    };

    const canApprove = service.status === 'pending' || service.status === 'in_review' || service.status === 'with_observations';
    const canAssignResources = service.status === 'accepted' || service.status === 'in_progress';

    return (
        <AppLayout>
            <Head title={service.code} />

            <div className="p-6 max-w-5xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{service.code}</h1>
                        <p className="text-muted-foreground mt-1 font-mono text-sm">{service.uuid}</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/services">
                            <Button variant="outline">Volver</Button>
                        </Link>
                        <Link href={`/services/${service.id}/edit`}>
                            <Button variant="outline">Editar</Button>
                        </Link>

                        {/* Botón de Contrato (siempre disponible) */}
                        <a href={`/services/${service.id}/contract`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline">Contrato PDF</Button>
                        </a>

                        {/* Botón de Paz y Salvo (solo si está pagado) */}
                        {financials.is_fully_paid && (
                            <a href={`/services/${service.id}/paz-y-salvo`} target="_blank" rel="noopener noreferrer">
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    Paz y Salvo PDF
                                </Button>
                            </a>
                        )}
                    </div>
                </div>

                {/* Estado */}
                <Card className="mb-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Estado del Servicio</CardTitle>
                        <div className="flex gap-2">
                            <Badge variant={getStatusVariant(service.status)}>
                                {service.status_label}
                            </Badge>
                            {financials.is_fully_paid && (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> PAGADO 100%
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        {service.approved_at && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Aprobado/Rechazado:</span>
                                <span>{formatDate(service.approved_at)}</span>
                            </div>
                        )}
                        {service.approved_by && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Por:</span>
                                <span>{service.approved_by.name}</span>
                            </div>
                        )}

                        {canApprove && (
                            <div className="flex gap-2 pt-4 border-t mt-4">
                                <Button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    Aprobar Servicio
                                </Button>
                                <Button variant="destructive" onClick={() => setShowRejectModal(true)}>
                                    Rechazar
                                </Button>
                            </div>
                        )}

                        {service.status === 'rejected' && service.rejection_reason && (
                            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg mt-4">
                                <p className="text-destructive font-medium">Servicio rechazado</p>
                                <p className="text-sm mt-1">Motivo: {service.rejection_reason}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Cliente y fallecido */}
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Contratante y Fallecido</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-2">Cliente</h4>
                                <p className="font-medium">{service.client.name}</p>
                                <p className="text-sm text-muted-foreground">{service.client.rut}</p>
                                {service.client.phone && <p className="text-sm">{service.client.phone}</p>}
                                {service.client.email && <p className="text-sm">{service.client.email}</p>}
                            </div>
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-2">Fallecido</h4>
                                <p className="font-medium">{service.deceased.full_name}</p>
                                {service.deceased.rut && <p className="text-sm text-muted-foreground">{service.deceased.rut}</p>}
                                <p className="text-sm">Fallecimiento: {formatDate(service.deceased.death_date)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Programación */}
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Programación</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="divide-y">
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Tipo de servicio</dt>
                                <dd className="col-span-2 font-medium">{service.service_type.name}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Inicio</dt>
                                <dd className="col-span-2">{formatDate(service.scheduled_at)}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Fin estimado</dt>
                                <dd className="col-span-2">{formatDate(service.ends_at)}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {/* RECURSOS ASIGNADOS */}
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Recursos Asignados</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* ITEMS: Ataúdes y Urnas */}
                        <div>
                            <h4 className="font-medium mb-2">Ataúdes y Urnas</h4>
                            {service.inventory_items && service.inventory_items.length > 0 ? (
                                <div className="space-y-2 mb-3">
                                    {service.inventory_items.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <p className="font-medium">{item.code} — {item.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Cantidad: {item.pivot?.quantity} | Precio: {formatPrice(item.pivot?.unit_price || '0')}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleRemoveItem(item.id, item.name)}
                                            >
                                                Quitar
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground mb-3">No hay ataúdes ni urnas asignados</p>
                            )}

                            {canAssignResources && (
                                <form onSubmit={handleAssignItem} className="flex gap-2 items-end flex-wrap p-3 bg-muted/50 rounded-lg">
                                    <div className="flex-1 min-w-[200px]">
                                        <Label className="text-xs">Item disponible</Label>
                                        <select
                                            value={selectedItem}
                                            onChange={(e) => setSelectedItem(e.target.value)}
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm mt-1"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {availableItems.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.code} — {item.name} (Stock: {item.stock})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <Label className="text-xs">Cantidad</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={itemQuantity}
                                            onChange={(e) => setItemQuantity(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <Button type="submit" disabled={!selectedItem}>
                                        Asignar Item
                                    </Button>
                                </form>
                            )}
                        </div>

                        {/* VEHÍCULOS */}
                        <div>
                            <h4 className="font-medium mb-2">Vehículos</h4>
                            {service.vehicles && service.vehicles.length > 0 ? (
                                <div className="space-y-2 mb-3">
                                    {service.vehicles.map((v) => (
                                        <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <p className="font-medium">{v.plate} — {v.type_label}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {v.brand || '—'} {v.model || ''}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleRemoveVehicle(v.id, v.plate)}
                                            >
                                                Quitar
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground mb-3">No hay vehículos asignados</p>
                            )}

                            {canAssignResources && (
                                <form onSubmit={handleAssignVehicle} className="flex gap-2 items-end flex-wrap p-3 bg-muted/50 rounded-lg">
                                    <div className="flex-1 min-w-[200px]">
                                        <Label className="text-xs">Vehículo disponible</Label>
                                        <select
                                            value={selectedVehicle}
                                            onChange={(e) => setSelectedVehicle(e.target.value)}
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm mt-1"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {availableVehicles.map((v) => (
                                                <option key={v.id} value={v.id}>
                                                    {v.plate} — {v.type_label} {v.brand && `(${v.brand})`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <Button type="submit" disabled={!selectedVehicle}>
                                        Asignar Vehículo
                                    </Button>
                                </form>
                            )}
                        </div>

                        {!canAssignResources && (
                            <p className="text-sm text-muted-foreground italic">
                                ⓘ Los recursos solo se pueden asignar cuando el servicio está aceptado o en ejecución.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* PERSONAL ASIGNADO */}
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Personal Asignado al Servicio</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Lista de asignados */}
                        {service.assignments && service.assignments.length > 0 ? (
                            <div className="space-y-2">
                                {service.assignments.map((assignment) => (
                                    <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{assignment.user.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {assignment.role_label} · {assignment.user.email}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleRemoveEmployee(assignment.id, assignment.user.name)}
                                        >
                                            Quitar
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No hay personal asignado a este servicio
                            </p>
                        )}

                        {/* Formulario de asignación */}
                        {canAssignResources && availableEmployees.length > 0 && (
                            <form onSubmit={handleAssignEmployee} className="flex gap-2 items-end flex-wrap p-3 bg-muted/50 rounded-lg">
                                <div className="flex-1 min-w-[200px]">
                                    <Label className="text-xs">Empleado disponible</Label>
                                    <select
                                        value={selectedEmployee}
                                        onChange={(e) => setSelectedEmployee(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm mt-1"
                                    >
                                        <option value="">Seleccionar empleado...</option>
                                        {availableEmployees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.name} ({emp.roles.map(r => r.name).join(', ')})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-40">
                                    <Label className="text-xs">Rol</Label>
                                    <select
                                        value={employeeRole}
                                        onChange={(e) => setEmployeeRole(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm mt-1"
                                    >
                                        <option value="coordinator">Coordinador</option>
                                        <option value="assistant">Asistente</option>
                                        <option value="driver">Conductor</option>
                                    </select>
                                </div>
                                <Button type="submit" disabled={!selectedEmployee}>
                                    Asignar
                                </Button>
                            </form>
                        )}

                        {canAssignResources && availableEmployees.length === 0 && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    ⚠️ No hay empleados disponibles en la fecha del servicio.
                                    Todos están de vacaciones, permiso o inactivos.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Económico */}
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Información Económica</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="divide-y">
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Precio base</dt>
                                <dd className="col-span-2">{formatPrice(service.base_price)}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Cargos adicionales</dt>
                                <dd className="col-span-2">{formatPrice(service.additional_charges)}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Descuento</dt>
                                <dd className="col-span-2 text-emerald-500">- {formatPrice(service.discount)}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3 font-bold">
                                <dt>Total</dt>
                                <dd className="col-span-2 text-xl">{formatPrice(service.total_price)}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {/* PAGOS Y SALDOS */}
                <Card className="mb-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Pagos y Saldos</CardTitle>
                        {!financials.is_fully_paid && service.status === 'accepted' && (
                            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                                <DialogTrigger asChild>
                                    <Button size="sm">Registrar Pago</Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Registrar Pago</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleRegisterPayment} className="space-y-4 pt-4">
                                        <div>
                                            <Label htmlFor="payment_amount">Monto *</Label>
                                            <Input
                                                id="payment_amount"
                                                type="number"
                                                min="1"
                                                max={financials.balance}
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                required
                                            />
                                            <div className="flex justify-between items-center mt-2">
                                                <p className="text-xs text-muted-foreground">
                                                    Saldo: {formatPrice(String(financials.balance || 0))}
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    size="sm"
                                                    className="h-auto p-0 text-xs"
                                                    onClick={() => setPaymentAmount(String(financials.balance))}
                                                >
                                                    Pagar saldo total
                                                </Button>
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="payment_method">Medio de pago *</Label>
                                            <select
                                                id="payment_method"
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                                            >
                                                <option value="efectivo">Efectivo</option>
                                                <option value="transferencia">Transferencia</option>
                                                <option value="tarjeta_credito">Tarjeta de crédito</option>
                                                <option value="tarjeta_debito">Tarjeta de débito</option>
                                                <option value="cheque">Cheque</option>
                                                <option value="convenio">Convenio / Cuota mortuoria</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label htmlFor="payment_date">Fecha *</Label>
                                            <Input
                                                id="payment_date"
                                                type="date"
                                                value={paymentDate}
                                                onChange={(e) => setPaymentDate(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="payment_reference">Referencia</Label>
                                            <Input
                                                id="payment_reference"
                                                value={paymentReference}
                                                onChange={(e) => setPaymentReference(e.target.value)}
                                                placeholder="N° transferencia, etc."
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="payment_notes">Notas</Label>
                                            <textarea
                                                id="payment_notes"
                                                value={paymentNotes}
                                                onChange={(e) => setPaymentNotes(e.target.value)}
                                                rows={2}
                                                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)}>
                                                Cancelar
                                            </Button>
                                            <Button type="submit">Registrar Pago</Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Banner verde si está pagado al 100% */}
                        {financials.is_fully_paid && (
                            <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500 rounded-lg flex items-center gap-3">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                <div>
                                    <p className="font-bold text-emerald-500">Servicio Pagado al 100%</p>
                                    <p className="text-sm text-muted-foreground">
                                        Este servicio no tiene deuda pendiente. Puede descargar el Paz y Salvo.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Resumen Visual con Barra de Progreso */}
                        {(() => {
                            const total = parseFloat(service.total_price) || 0;
                            const paid = financials.total_paid || 0;
                            const percentage = total > 0 ? Math.min((paid / total) * 100, 100) : 0;

                            return (
                                <div className="space-y-4">
                                    {/* Barra de progreso */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-medium">Progreso de pago</span>
                                            <span className={`font-bold ${getPaymentText(percentage)}`}>
                                                {percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ease-out ${getPaymentColor(percentage)}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {percentage >= 100
                                                ? '✅ Servicio totalmente pagado'
                                                : percentage >= 50
                                                    ? '✅ Abono mínimo cumplido'
                                                    : '⚠️ Falta abono mínimo (50%)'}
                                        </p>
                                    </div>

                                    {/* Números */}
                                    <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Total</p>
                                            <p className="font-bold">{formatPrice(String(total))}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Pagado</p>
                                            <p className={`font-bold ${getPaymentText(percentage)}`}>
                                                {formatPrice(String(paid))}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Saldo</p>
                                            <p className={`font-bold ${financials.balance > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                                                {formatPrice(String(financials.balance || 0))}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Lista de pagos */}
                        {service.payments && service.payments.length > 0 ? (
                            <div className="space-y-2">
                                {service.payments.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{p.receipt_number}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {p.payment_method_label} · {formatDate(p.payment_date)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold">{formatPrice(String(p.amount || 0))}</span>
                                            <a
                                                href={`/payments/${p.id}/pdf`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Button size="sm" variant="outline">
                                                    PDF
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No hay pagos registrados</p>
                        )}
                    </CardContent>
                </Card>

                {/* Modal rechazo */}
                {showRejectModal && createPortal(
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
                        <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4 shadow-2xl border border-border">
                            <h3 className="text-lg font-bold mb-4">Rechazar Servicio</h3>
                            <Label htmlFor="rejection_reason">Motivo del rechazo *</Label>
                            <textarea
                                id="rejection_reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                                placeholder="Explique el motivo del rechazo..."
                                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-2"
                            />
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                                    Cancelar
                                </Button>
                                <Button variant="destructive" onClick={handleReject}>
                                    Confirmar Rechazo
                                </Button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </AppLayout>
    );
}