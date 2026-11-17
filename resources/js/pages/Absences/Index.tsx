import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
    CalendarPlus, CheckCircle2, XCircle, Clock, CalendarDays, User, 
    ArrowRight
} from 'lucide-react';

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
        router.get('/absences', { status: newStatus }, { preserveState: true, replace: true });
    };

    const handleApprove = (id: number, name: string) => {
        if (confirm(`¿Aprobar la ausencia de ${name}?`)) {
            router.post(`/absences/${id}/approve`, {}, { preserveScroll: true });
        }
    };

    const handleReject = (id: number, name: string) => {
        const reason = prompt(`Motivo del rechazo para ${name}:`);
        if (reason) {
            router.post(`/absences/${id}/reject`, { rejection_reason: reason }, { preserveScroll: true });
        }
    };

    // Formato de fecha tipo "calendario" (igual que en Servicios/Fallecidos)
    const renderDate = (date: string) => {
        const d = new Date(date);
        return (
            <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                <span className="text-xs font-bold uppercase text-rose-800 dark:text-rose-400">
                    {d.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '')}
                </span>
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {d.getDate()}
                </span>
                <span className="text-[10px] text-muted-foreground">
                    {d.getFullYear()}
                </span>
            </div>
        );
    };

    const getStatusBadge = (status: string, label: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" /> {label}</Badge>;
            case 'pending':
                return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="h-3 w-3 mr-1" /> {label}</Badge>;
            case 'rejected':
                return <Badge className="bg-rose-100 text-rose-800 border-rose-200"><XCircle className="h-3 w-3 mr-1" /> {label}</Badge>;
            default:
                return <Badge variant="outline">{label}</Badge>;
        }
    };

    const tabs = [
        { key: '', label: 'Todas', dot: null },
        { key: 'pending', label: 'Pendientes', dot: 'bg-amber-500' },
        { key: 'approved', label: 'Aprobadas', dot: 'bg-emerald-500' },
        { key: 'rejected', label: 'Rechazadas', dot: 'bg-rose-500' },
    ];

    return (
        <>
            <Head title="Gestión de Ausencias" />

            <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
                
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <div className="p-2 bg-rose-100 text-rose-800 rounded-lg">
                                <CalendarDays className="h-6 w-6 md:h-8 md:w-8" />
                            </div>
                            Gestión de Ausencias
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm md:text-base">
                            {is_admin ? 'Administra las solicitudes de vacaciones y permisos del personal' : 'Tus solicitudes de vacaciones y permisos'}
                        </p>
                    </div>
                    <Link href="/absences/create" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-rose-800 hover:bg-rose-900 text-white shadow-md">
                            <CalendarPlus className="h-4 w-4 mr-2" /> Solicitar Ausencia
                        </Button>
                    </Link>
                </div>

                {/* TARJETA DE VACACIONES (solo empleado) */}
                {!is_admin && (
                    <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium text-emerald-800">Tus vacaciones disponibles</p>
                                    <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                                        {vacation_days.available} <span className="text-lg font-medium text-emerald-600/70">/ {vacation_days.total} días</span>
                                    </p>
                                </div>
                                <div className="flex gap-4 text-sm bg-white/50 p-3 rounded-xl">
                                    <div><p className="text-muted-foreground text-xs uppercase font-semibold">Usados</p><p className="font-bold">{vacation_days.used}</p></div>
                                    <div className="w-px bg-border"></div>
                                    <div><p className="text-muted-foreground text-xs uppercase font-semibold">Restantes</p><p className="font-bold text-emerald-600">{vacation_days.available}</p></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* TABS DE ESTADO */}
                <div className="inline-flex w-full gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900 sm:w-auto">
                    {tabs.map((tab) => {
                        const active = status === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => handleFilter(tab.key)}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none ${
                                    active ? 'bg-rose-800 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {tab.dot && <span className={`h-2 w-2 rounded-full ${tab.dot}`} />}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* VISTA MÓVIL (Tarjetas) */}
                <div className="space-y-3 md:hidden">
                    {absences.data.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-card">
                            No hay ausencias registradas
                        </div>
                    ) : (
                        absences.data.map((absence) => (
                            <div key={absence.id} className="border rounded-xl bg-card p-4 space-y-3 shadow-sm">
                                <div className="flex justify-between items-start gap-2">
                                    <div>
                                        <p className="font-medium">{absence.user.name}</p>
                                        <p className="text-sm text-muted-foreground">{absence.type_label}</p>
                                    </div>
                                    {getStatusBadge(absence.status, absence.status_label)}
                                </div>

                                <div className="flex items-center gap-2">
                                    {renderDate(absence.starts_at)}
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    {renderDate(absence.ends_at)}
                                </div>

                                <div className="text-sm text-muted-foreground">
                                    <strong className="text-slate-800">{absence.business_days}</strong> días hábiles
                                </div>

                                {/* ACCIONES EN MÓVIL */}
                                {is_admin && absence.status === 'pending' && (
                                    <div className="flex gap-2 pt-3 border-t">
                                        <Button 
                                            size="sm" 
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" 
                                            onClick={() => handleApprove(absence.id, absence.user.name)}
                                        >
                                            <CheckCircle2 className="h-4 w-4 mr-1" /> Aprobar
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
                            </div>
                        ))
                    )}
                </div>

                {/* VISTA DESKTOP (Tabla) */}
                <div className="hidden md:block overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900/40 border-b">
                                <tr>
                                    {is_admin && <th className="text-left font-semibold p-3 pl-4">Empleado</th>}
                                    <th className="text-left font-semibold p-3">Tipo</th>
                                    <th className="text-left font-semibold p-3">Período</th>
                                    <th className="text-left font-semibold p-3">Días</th>
                                    <th className="text-left font-semibold p-3">Estado</th>
                                    <th className="text-right font-semibold p-3 pr-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {absences.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={is_admin ? 6 : 5} className="text-center py-12 text-muted-foreground">
                                            No hay ausencias registradas
                                        </td>
                                    </tr>
                                ) : (
                                    absences.data.map((absence) => (
                                        <tr key={absence.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                            {is_admin && (
                                                <td className="p-3 pl-4 font-medium">
                                                    {absence.user.name}
                                                </td>
                                            )}
                                            <td className="p-3">{absence.type_label}</td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    {renderDate(absence.starts_at)}
                                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                    {renderDate(absence.ends_at)}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-bold rounded-full h-7 w-7 text-xs">
                                                    {absence.business_days}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                {getStatusBadge(absence.status, absence.status_label)}
                                            </td>
                                            <td className="p-3 pr-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {is_admin && absence.status === 'pending' ? (
                                                        <>
                                                            <Button 
                                                                size="sm" 
                                                                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white" 
                                                                onClick={() => handleApprove(absence.id, absence.user.name)}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4 mr-1" /> Aprobar
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                variant="destructive" 
                                                                className="h-8" 
                                                                onClick={() => handleReject(absence.id, absence.user.name)}
                                                            >
                                                                <XCircle className="h-4 w-4 mr-1" /> Rechazar
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">
                                                            {absence.status === 'pending' ? 'Pendiente de revisión' : 'Sin acciones'}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PAGINACIÓN */}
                {absences.last_page > 1 && (
                    <div className="mt-4 flex flex-wrap justify-center gap-1">
                        {absences.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`rounded-lg border px-3 py-1 text-sm ${
                                    link.active ? 'bg-rose-800 text-white border-rose-800' : link.url ? 'hover:bg-slate-100' : 'opacity-50'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}