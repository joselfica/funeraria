import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle2, XCircle, Calendar, Plus, KeyRound, UserX, UserCheck, Ban } from 'lucide-react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface Employee {
    id: number;
    name: string;
    email: string;
    roles: string[];
    is_available: boolean;
    current_absence: { type: string; ends_at: string } | null;
    vacation_days_available: number;
    vacation_days_total: number;
    is_active: boolean;
}

interface Props {
    staff: Employee[];
}

export default function StaffIndex({ staff }: Props) {
    const handleToggleActive = (userId: number, userName: string, isActive: boolean) => {
        const message = isActive
            ? `¿Estás seguro de desactivar a "${userName}"?\n\nEl usuario no podrá iniciar sesión y sus sesiones activas se cerrarán inmediatamente.`
            : `¿Estás seguro de activar a "${userName}"?\n\nEl usuario podrá iniciar sesión nuevamente.`;

        if (confirm(message)) {
            router.post(`/staff/${userId}/toggle-active`);
        }
    };

    const handleChangePassword = (userId: number, userName: string) => {
        const password = prompt(`Nueva contraseña para ${userName} (mínimo 8 caracteres):`);
        if (!password || password.length < 8) {
            alert('La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        const confirmation = prompt('Confirma la contraseña:');
        if (password !== confirmation) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        router.post(`/staff/${userId}/password`, {
            password: password,
            password_confirmation: confirmation,
        });
    };

    const renderStatus = (emp: Employee) => {
        if (!emp.is_active) {
            return (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Ban className="h-5 w-5 shrink-0" />
                    <span className="text-xs font-medium">Desactivado</span>
                </div>
            );
        }
        if (emp.is_available) {
            return (
                <div className="flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span className="text-xs font-medium">Disponible</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2 text-red-500">
                <XCircle className="h-5 w-5 shrink-0" />
                <span className="text-xs font-medium">Ausente</span>
            </div>
        );
    };

    const renderVacations = (emp: Employee) => (
        <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
                <p className={`text-sm font-medium ${
                    emp.vacation_days_available > 5 ? 'text-emerald-600' :
                    emp.vacation_days_available > 0 ? 'text-amber-600' :
                    'text-destructive'
                }`}>
                    {emp.vacation_days_available} / {emp.vacation_days_total} días
                </p>
                {emp.vacation_days_available === 0 && (
                    <p className="text-xs text-destructive font-medium">Sin vacaciones</p>
                )}
            </div>
        </div>
    );

    const renderAccountBadge = (emp: Employee) => (
        <Badge variant={emp.is_active ? 'default' : 'destructive'}>
            {emp.is_active ? 'Activa' : 'Desactivada'}
        </Badge>
    );

    return (
        <>
            <Head title="Gestión de Personal" />

            <div className="p-4 sm:p-6 max-w-6xl mx-auto">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                            <Users className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" /> Personal de la Funeraria
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                            Estado de disponibilidad y roles del equipo
                        </p>
                    </div>
                    <Link href="/staff/create" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto">
                            <Plus className="h-4 w-4 mr-2" /> Nuevo Usuario
                        </Button>
                    </Link>
                </div>

                {/* ───────── VISTA MÓVIL / TABLET: tarjetas ───────── */}
                <div className="space-y-3 lg:hidden">
                    {staff.map((emp) => (
                        <Card key={emp.id} className={emp.is_active ? '' : 'opacity-70'}>
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{emp.name}</p>
                                        <p className="text-xs text-muted-foreground break-all">{emp.email}</p>
                                    </div>
                                    {renderAccountBadge(emp)}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                                    {renderStatus(emp)}
                                    <div className="flex gap-1 flex-wrap">
                                        {emp.roles.map((r) => (
                                            <Badge key={r} variant="secondary" className="text-xs">
                                                {r}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {emp.is_active && emp.current_absence && (
                                    <p className="text-xs text-red-500 font-medium">
                                        {emp.current_absence.type} hasta {emp.current_absence.ends_at}
                                    </p>
                                )}

                                {renderVacations(emp)}

                                <div className="flex flex-wrap gap-2 pt-3 border-t">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleActive(emp.id, emp.name, emp.is_active)}
                                        className={emp.is_active ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}
                                    >
                                        {emp.is_active
                                            ? <><UserX className="h-4 w-4 mr-1" /> Desactivar</>
                                            : <><UserCheck className="h-4 w-4 mr-1" /> Activar</>}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleChangePassword(emp.id, emp.name)}
                                    >
                                        <KeyRound className="h-4 w-4 mr-1" /> Contraseña
                                    </Button>
                                    <Link href={`/staff/${emp.id}`}>
                                        <Button variant="outline" size="sm">Gestionar</Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ───────── VISTA ESCRITORIO: tabla ───────── */}
                <Card className="hidden lg:block">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">Estado</TableHead>
                                    <TableHead>Empleado</TableHead>
                                    <TableHead>Rol en el Sistema</TableHead>
                                    <TableHead>Vacaciones</TableHead>
                                    <TableHead>Cuenta</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {staff.map((emp) => (
                                    <TableRow key={emp.id} className={emp.is_active ? '' : 'opacity-70'}>
                                        <TableCell>{renderStatus(emp)}</TableCell>
                                        <TableCell>
                                            <p className="font-medium">{emp.name}</p>
                                            <p className="text-xs text-muted-foreground">{emp.email}</p>
                                            {emp.is_active && emp.current_absence && (
                                                <p className="text-xs text-red-500 font-medium mt-1">
                                                    {emp.current_absence.type} hasta {emp.current_absence.ends_at}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                {emp.roles.map((r) => (
                                                    <Badge key={r} variant="secondary" className="text-xs">
                                                        {r}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>{renderVacations(emp)}</TableCell>
                                        <TableCell>{renderAccountBadge(emp)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* Botón de activar/desactivar */}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleToggleActive(emp.id, emp.name, emp.is_active)}
                                                    title={emp.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                                                    className={emp.is_active ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}
                                                >
                                                    {emp.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleChangePassword(emp.id, emp.name)}
                                                    title="Cambiar contraseña"
                                                >
                                                    <KeyRound className="h-4 w-4" />
                                                </Button>
                                                <Link href={`/staff/${emp.id}`}>
                                                    <Button variant="outline" size="sm">Gestionar</Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}