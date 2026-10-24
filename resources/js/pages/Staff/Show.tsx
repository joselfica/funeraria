import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, User, Calendar, ShieldCheck } from 'lucide-react';

interface Role { id: number; name: string; }
interface Absence {
    id: number;
    type_label: string;
    status_label: string;
    starts_at: string;
    ends_at: string;
    business_days: number;
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
}

export default function StaffShow({ employee, all_roles }: Props) {
    const { auth } = usePage<{ auth?: { user?: { roles?: string[] } } }>().props;
    const isAdmin = auth?.user?.roles?.includes('Administrador') ?? false;

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
        if (!isAdmin) return;
        post(`/staff/${employee.id}/roles`);
    };

    const formatDate = (date: string) => 
        new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <AppLayout>
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
                                    {isAdmin ? 'Definen a qué módulos puede acceder' : 'Solo el Administrador puede modificar esto'}
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
                                                disabled={!isAdmin}
                                            />
                                            <Label htmlFor={`role-${role.id}`} className="cursor-pointer">
                                                {role.name}
                                            </Label>
                                        </div>
                                    ))}
                                    {/* Solo mostramos el botón de guardar si es Admin */}
                                    {isAdmin && (
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
                                            <div key={abs.id} className="flex justify-between items-center p-3 border rounded-lg">
                                                <div>
                                                    <p className="font-medium">{abs.type_label}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatDate(abs.starts_at)} al {formatDate(abs.ends_at)} ({abs.business_days} días)
                                                    </p>
                                                </div>
                                                <Badge variant={abs.status_label === 'Aprobada' ? 'default' : abs.status_label === 'Rechazada' ? 'destructive' : 'secondary'}>
                                                    {abs.status_label}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="mt-6 pt-4 border-t">
                                    <Link href="/absences/create">
                                        <Button variant="outline" className="w-full">
                                            + Registrar Nueva Ausencia para {employee.name.split(' ')[0]}
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}