import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle2, XCircle, Calendar } from 'lucide-react';
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
}

interface Props {
    staff: Employee[];
}

export default function StaffIndex({ staff }: Props) {
    return (
        <>
            <Head title="Gestión de Personal" />

            <div className="p-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Users className="h-8 w-8" /> Personal de la Funeraria
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Estado de disponibilidad y roles del equipo
                        </p>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">Estado</TableHead>
                                    <TableHead>Empleado</TableHead>
                                    <TableHead>Rol en el Sistema</TableHead>
                                    <TableHead>Vacaciones</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {staff.map((emp) => (
                                    <TableRow key={emp.id}>
                                        <TableCell>
                                            {emp.is_available ? (
                                                <div className="flex items-center gap-2 text-emerald-500">
                                                    <CheckCircle2 className="h-5 w-5" />
                                                    <span className="text-xs font-medium">Disponible</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-red-500">
                                                    <XCircle className="h-5 w-5" />
                                                    <span className="text-xs font-medium">Ausente</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium">{emp.name}</p>
                                            <p className="text-xs text-muted-foreground">{emp.email}</p>
                                            {emp.current_absence && (
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
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className={emp.vacation_days_available > 5 ? 'text-emerald-500' : 'text-amber-500'}>
                                                    {emp.vacation_days_available} días disp.
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/staff/${emp.id}`}>
                                                <Button variant="outline" size="sm">Gestionar</Button>
                                            </Link>
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