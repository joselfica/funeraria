import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, User, Calendar, CalendarDays, ShieldCheck } from 'lucide-react';

interface Role { id: number; name: string; }
interface Absence {
    id: number;
    type_label: string;
    status_label: string;
    starts_at: string;
    ends_at: string;
    business_days: number;
    reason: string | null;
    rejection_reason: string | null;
    approved_at: string | null;
    approved_by: { name: string } | null;
}

interface Props {
    employee: {
        id: number;
        name: string;
        email: string;
        roles: Role[];
        absences: Absence[];
        vacation_days_total: number;
        vacation_days_used: number;
        vacation_days_available: number;
    };
    all_roles: Role[];
    absencesStats: {
        total: number;
        approved: number;
        pending: number;
        rejected: number;
        vacation_days_used: number;
    };
}

export default function StaffShow({ employee, all_roles, absencesStats }: Props) {
    const { auth } = usePage<{ auth?: { user?: { roles?: string[] } } }>().props;
    const isAdmin = auth?.user?.roles?.includes('Administrador') ?? false;
    const isEncargado = auth?.user?.roles?.includes('Encargado') ?? false;

    const targetIsAdmin = employee.roles.some((r) => r.name === 'Administrador');
    // El Encargado no puede editar a un Administrador (coherente con authorizeUserManagement)
    const canEdit = isAdmin || (isEncargado && !targetIsAdmin);

    const { data, setData, post, processing } = useForm({
        roles: employee.roles.map(r => r.name),
    });

    const handleRoleToggle = (roleName: string) => {
        if (data.roles.includes(roleName)) {
            setData('roles', data.roles.filter(r => r !== roleName));
        } else {
            setData('roles', [...data.roles, roleName]);
        }
    };

    const handleSaveRoles = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEdit) return;
        post(`/staff/${employee.id}/roles`);
    };

    const formatDate = (date: string) => 
        new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <>
            <Head title={`Ficha: ${employee.name}`} />

            <div className="p-6 max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link href="/staff">
                        <Button variant="ghost" size="sm" className="mb-4">
                            <ChevronLeft className="h-4 w-4 mr-1" /> Volver al Personal
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <User className="h-8 w-8" /> {employee.name}
                    </h1>
                    <p className="text-muted-foreground">{employee.email}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Columna Izquierda: Info y Roles */}
                    <div className="md:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <ShieldCheck className="h-5 w-5" /> Roles del Sistema
                                </CardTitle>
                                <CardDescription>
                                    {canEdit
                                        ? 'Definen a qué módulos puede acceder'
                                        : 'Solo el Administrador puede modificar esto'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveRoles} className="space-y-4">
                                    {all_roles.map((role) => (
                                        <div key={role.id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`role-${role.id}`} 
                                                checked={data.roles.includes(role.name)}
                                                onCheckedChange={() => handleRoleToggle(role.name)}
                                                disabled={!canEdit}
                                            />
                                            <Label htmlFor={`role-${role.id}`} className="cursor-pointer">
                                                {role.name}
                                            </Label>
                                        </div>
                                    ))}
                                    {canEdit && (
                                        <Button type="submit" disabled={processing} size="sm" className="w-full mt-2">
                                            Guardar Roles
                                        </Button>
                                    )}
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-emerald-600">
                                    <Calendar className="h-5 w-5" /> Vacaciones
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-emerald-600">
                                        {employee.vacation_days_available}
                                    </p>
                                    <p className="text-sm text-muted-foreground">días disponibles</p>
                                    <div className="flex justify-between text-xs mt-4 pt-4 border-t border-emerald-200">
                                        <span>Total: {employee.vacation_days_total}</span>
                                        <span>Usados: {employee.vacation_days_used}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Estadísticas de ausencias */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CalendarDays className="h-5 w-5" /> Resumen de Ausencias
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground">Total registradas</p>
                                        <p className="text-2xl font-bold">{absencesStats.total}</p>
                                    </div>
                                    <div className="p-3 bg-emerald-500/10 rounded-lg">
                                        <p className="text-xs text-emerald-600">Aprobadas</p>
                                        <p className="text-2xl font-bold text-emerald-600">{absencesStats.approved}</p>
                                    </div>
                                    <div className="p-3 bg-amber-500/10 rounded-lg">
                                        <p className="text-xs text-amber-600">Pendientes</p>
                                        <p className="text-2xl font-bold text-amber-600">{absencesStats.pending}</p>
                                    </div>
                                    <div className="p-3 bg-destructive/10 rounded-lg">
                                        <p className="text-xs text-destructive">Rechazadas</p>
                                        <p className="text-2xl font-bold text-destructive">{absencesStats.rejected}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Columna Derecha: Historial de Ausencias */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Historial de Ausencias</CardTitle>
                                <CardDescription>Todas las solicitudes de este empleado</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {employee.absences.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        Este empleado no tiene ausencias registradas.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {employee.absences.map((abs) => (
                                            <div 
                                                key={abs.id} 
                                                className={`p-4 border rounded-lg ${
                                                    abs.status_label === 'Aprobada' 
                                                        ? 'border-emerald-200 bg-emerald-50/30' 
                                                        : abs.status_label === 'Rechazada' 
                                                            ? 'border-destructive/30 bg-destructive/5' 
                                                            : 'border-amber-200 bg-amber-50/30'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-semibold">{abs.type_label}</p>
                                                            <Badge 
                                                                variant={
                                                                    abs.status_label === 'Aprobada' ? 'default' : 
                                                                    abs.status_label === 'Rechazada' ? 'destructive' : 
                                                                    'secondary'
                                                                }
                                                                className="text-xs"
                                                            >
                                                                {abs.status_label}
                                                            </Badge>
                                                        </div>

                                                        <p className="text-sm text-muted-foreground">
                                                            📅 {formatDate(abs.starts_at)} → {formatDate(abs.ends_at)}
                                                        </p>

                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {abs.business_days} día(s) hábil(es)
                                                        </p>

                                                        {abs.reason && (
                                                            <p className="text-sm mt-2 p-2 bg-background rounded border">
                                                                <span className="font-medium">Motivo:</span> {abs.reason}
                                                            </p>
                                                        )}

                                                        {abs.rejection_reason && abs.status_label === 'Rechazada' && (
                                                            <p className="text-sm mt-2 p-2 bg-destructive/10 rounded border border-destructive/20">
                                                                <span className="font-medium text-destructive">Motivo del rechazo:</span> {abs.rejection_reason}
                                                            </p>
                                                        )}

                                                        {abs.approved_at && (
                                                            <p className="text-xs text-muted-foreground mt-2">
                                                                {abs.status_label === 'Aprobada' ? '✓ Aprobada' : '✗ Rechazada'} el {formatDate(abs.approved_at)}
                                                                {abs.approved_by && ` por ${abs.approved_by.name}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {canEdit && (
                                    <div className="mt-6 pt-4 border-t">
                                        <Link href="/absences/create">
                                            <Button variant="outline" className="w-full">
                                                + Registrar Nueva Ausencia para {employee.name.split(' ')[0]}
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}