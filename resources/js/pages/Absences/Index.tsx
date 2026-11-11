import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Calendar, Plus, CheckCircle, XCircle, Clock, CalendarDays, User } from 'lucide-react';

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

    // Colores más juguetones y vivos para los estados
    const getStatusBadge = (status: string, label: string) => {
        switch (status) {
            case 'approved': 
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none px-3 py-1"><CheckCircle className="h-3 w-3 mr-1"/> {label}</Badge>;
            case 'pending': 
                return <Badge className="bg-amber-400 hover:bg-amber-500 text-amber-950 border-none px-3 py-1"><Clock className="h-3 w-3 mr-1"/> {label}</Badge>;
            case 'rejected': 
                return <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none px-3 py-1"><XCircle className="h-3 w-3 mr-1"/> {label}</Badge>;
            default: 
                return <Badge variant="outline">{label}</Badge>;
        }
    };

    return (
        <>
            <Head title="Ausencias" />

            <div className="p-4 md:p-6 max-w-6xl mx-auto">
                {/* Encabezado */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Calendar className="h-6 w-6 md:h-8 md:w-8" />
                            </div>
                            Gestión de Ausencias
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm md:text-base">
                            {is_admin
                                ? 'Administra las solicitudes de vacaciones y permisos del personal'
                                : 'Tus solicitudes de vacaciones y permisos'}
                        </p>
                    </div>
                    <Link href="/absences/create" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md">
                            <Plus className="h-4 w-4 mr-2" /> Solicitar Ausencia
                        </Button>
                    </Link>
                </div>

                {/* Tarjeta de vacaciones disponibles (solo empleado) */}
                {!is_admin && (
                    <Card className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-900 shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Tus vacaciones disponibles</p>
                                    <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                                        {vacation_days.available} <span className="text-lg font-medium text-emerald-600/70">/ {vacation_days.total} días</span>
                                    </p>
                                </div>
                                <div className="flex gap-4 text-sm bg-white/50 dark:bg-black/20 p-3 rounded-xl">
                                    <div>
                                        <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Usados</p>
                                        <p className="font-bold text-slate-700 dark:text-slate-300">{vacation_days.used}</p>
                                    </div>
                                    <div className="w-px bg-border"></div>
                                    <div>
                                        <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Restantes</p>
                                        <p className="font-bold text-emerald-600">{vacation_days.available}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Filtros tipo "Píldoras" */}
                <div className="mb-6 flex gap-2 flex-wrap bg-muted/50 p-2 rounded-xl w-fit">
                    <Button
                        variant={status === '' ? 'default' : 'ghost'}
                        size="sm"
                        className={`rounded-lg transition-all ${status === '' ? 'shadow-sm' : 'hover:bg-background'}`}
                        onClick={() => handleFilter('')}
                    >
                        Todas
                    </Button>
                    <Button
                        variant={status === 'pending' ? 'default' : 'ghost'}
                        size="sm"
                        className={`rounded-lg transition-all ${status === 'pending' ? 'shadow-sm bg-amber-500 hover:bg-amber-600 text-white' : 'hover:bg-background'}`}
                        onClick={() => handleFilter('pending')}
                    >
                        Pendientes
                    </Button>
                    <Button
                        variant={status === 'approved' ? 'default' : 'ghost'}
                        size="sm"
                        className={`rounded-lg transition-all ${status === 'approved' ? 'shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white' : 'hover:bg-background'}`}
                        onClick={() => handleFilter('approved')}
                    >
                        Aprobadas
                    </Button>
                    <Button
                        variant={status === 'rejected' ? 'default' : 'ghost'}
                        size="sm"
                        className={`rounded-lg transition-all ${status === 'rejected' ? 'shadow-sm bg-rose-600 hover:bg-rose-700 text-white' : 'hover:bg-background'}`}
                        onClick={() => handleFilter('rejected')}
                    >
                        Rechazadas
                    </Button>
                </div>

                {/* ====== VISTA MÓVIL: Tarjetas ====== */}
                <div className="md:hidden space-y-4">
                    {absences.data.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-card">
                            No hay ausencias registradas
                        </div>
                    ) : (
                        absences.data.map((absence) => (
                            <Card key={absence.id} className="overflow-hidden border-l-4" style={{
                                borderLeftColor: absence.status === 'approved' ? '#10b981' : absence.status === 'pending' ? '#f59e0b' : '#f43f5e'
                            }}>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0">
                                            {is_admin && (
                                                <p className="font-semibold text-sm flex items-center gap-1 text-muted-foreground mb-1">
                                                    <User className="h-3 w-3" /> {absence.user.name}
                                                </p>
                                            )}
                                            <p className="font-bold text-lg truncate">{absence.type_label}</p>
                                        </div>
                                        {getStatusBadge(absence.status, absence.status_label)}
                                    </div>
                                    
                                    <div className="bg-muted/30 p-3 rounded-lg grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Desde</p>
                                            <p className="font-medium">{formatDate(absence.starts_at)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Hasta</p>
                                            <p className="font-medium">{formatDate(absence.ends_at)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm pt-2">
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <CalendarDays className="h-4 w-4" />
                                            <span><strong>{absence.business_days}</strong> días hábiles</span>
                                        </div>
                                    </div>

                                    {is_admin && absence.status === 'pending' && (
                                        <div className="flex gap-2 pt-3 border-t">
                                            <Button
                                                size="sm"
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                onClick={() => handleApprove(absence.id, absence.user.name)}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="flex-1"
                                                onClick={() => handleReject(absence.id, absence.user.name)}
                                            >
                                                <XCircle className="h-4 w-4 mr-1" /> Rechazar
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* ====== VISTA DESKTOP: Tabla ====== */}
                <div className="hidden md:block border rounded-xl overflow-hidden bg-card shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
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
                                    <TableCell colSpan={is_admin ? 7 : 6} className="text-center py-12 text-muted-foreground">
                                        No hay ausencias registradas
                                    </TableCell>
                                </TableRow>
                            ) : (
                                absences.data.map((absence) => (
                                    <TableRow key={absence.id} className="hover:bg-muted/30 transition-colors">
                                        {is_admin && (
                                            <TableCell className="font-medium">
                                                {absence.user.name}
                                            </TableCell>
                                        )}
                                        <TableCell className="font-medium">{absence.type_label}</TableCell>
                                        <TableCell>{formatDate(absence.starts_at)}</TableCell>
                                        <TableCell>{formatDate(absence.ends_at)}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-full h-7 w-7 text-xs">
                                                {absence.business_days}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(absence.status, absence.status_label)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                {is_admin && absence.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                                            onClick={() => handleApprove(absence.id, absence.user.name)}
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="shadow-sm"
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
        </>
    );
}