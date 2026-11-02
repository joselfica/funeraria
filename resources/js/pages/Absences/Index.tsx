import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Calendar, Plus, CheckCircle, XCircle } from 'lucide-react';

interface Absence {
    id: number;
    uuid: string;
    type: string;
    type_label: string;
    status: string;
    status_label: string;
    starts_at: string;
    ends_at: string;
    business_days: number;
    reason: string | null;
    user: { id: number; name: string; email: string };
    approved_by: { name: string } | null;
}

interface Props {
    absences: {
        data: Absence[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: { status: string };
    is_admin: boolean;
    vacation_days: { total: number; used: number; available: number };
}

/**
 * Listado de ausencias.
 *
 * Admin: ve todas las ausencias + puede aprobar/rechazar
 * Empleado: solo ve las suyas
 */
export default function AbsencesIndex({ absences, filters, is_admin, vacation_days }: Props) {
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter = (newStatus: string) => {
        setStatus(newStatus);
        router.get('/absences', { status: newStatus }, { preserveState: true });
    };

    const handleApprove = (id: number, name: string) => {
        if (confirm(`¿Aprobar la ausencia de ${name}?`)) {
            router.post(`/absences/${id}/approve`);
        }
    };

    const handleReject = (id: number, name: string) => {
        const reason = prompt(`Motivo del rechazo para ${name}:`);
        if (reason) {
            router.post(`/absences/${id}/reject`, { rejection_reason: reason });
        }
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('es-CL', {
            day: '2-digit', month: 'short', year: 'numeric',
        });

    const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case 'approved': return 'default';
            case 'pending': return 'secondary';
            case 'rejected': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <AppLayout>
            <Head title="Ausencias" />

            <div className="p-6 max-w-6xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Calendar className="h-8 w-8" /> Gestión de Ausencias
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {is_admin
                                ? 'Administra las solicitudes de vacaciones y permisos del personal'
                                : 'Tus solicitudes de vacaciones y permisos'}
                        </p>
                    </div>
                    <Link href="/absences/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" /> Solicitar Ausencia
                        </Button>
                    </Link>
                </div>

                {/* Tarjeta de vacaciones disponibles (solo empleado) */}
                {!is_admin && (
                    <Card className="mb-4 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Vacaciones disponibles</p>
                                    <p className="text-3xl font-bold text-emerald-600">
                                        {vacation_days.available} / {vacation_days.total} días
                                    </p>
                                </div>
                                <div className="text-right text-sm text-muted-foreground">
                                    <p>Usados: {vacation_days.used}</p>
                                    <p>Restantes: {vacation_days.available}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Filtros */}
                <div className="mb-4 flex gap-2 flex-wrap">
                    <Button
                        variant={status === '' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilter('')}
                    >
                        Todas
                    </Button>
                    <Button
                        variant={status === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilter('pending')}
                    >
                        Pendientes
                    </Button>
                    <Button
                        variant={status === 'approved' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilter('approved')}
                    >
                        Aprobadas
                    </Button>
                    <Button
                        variant={status === 'rejected' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilter('rejected')}
                    >
                        Rechazadas
                    </Button>
                </div>

                {/* Tabla */}
                <div className="border rounded-lg overflow-hidden bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {is_admin && <TableHead>Empleado</TableHead>}
                                <TableHead>Tipo</TableHead>
                                <TableHead>Desde</TableHead>
                                <TableHead>Hasta</TableHead>
                                <TableHead>Días</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {absences.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={is_admin ? 7 : 6} className="text-center py-8 text-muted-foreground">
                                        No hay ausencias registradas
                                    </TableCell>
                                </TableRow>
                            ) : (
                                absences.data.map((absence) => (
                                    <TableRow key={absence.id}>
                                        {is_admin && (
                                            <TableCell className="font-medium">
                                                {absence.user.name}
                                            </TableCell>
                                        )}
                                        <TableCell>{absence.type_label}</TableCell>
                                        <TableCell>{formatDate(absence.starts_at)}</TableCell>
                                        <TableCell>{formatDate(absence.ends_at)}</TableCell>
                                        <TableCell>{absence.business_days}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(absence.status)}>
                                                {absence.status_label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                {is_admin && absence.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            onClick={() => handleApprove(absence.id, absence.user.name)}
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleReject(absence.id, absence.user.name)}
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1" /> Rechazar
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}