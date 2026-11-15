import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Calendar, Plus, CheckCircle, XCircle, Clock, CalendarDays, User, ArrowRight, Eye, MessageSquare } from 'lucide-react';

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

interface Counts {
    all: number;
    pending: number;
    approved: number;
    rejected: number;
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
    /** Opcional: si el controlador lo envía, los chips muestran contadores. */
    counts?: Counts;
}

export default function AbsencesIndex({ absences, filters, is_admin, vacation_days, counts }: Props) {
    const [status, setStatus] = useState(filters.status || '');

    const chips: Array<{ key: string; label: string; dot: string | null; count?: number }> = [
        { key: '', label: 'Todas', dot: null, count: counts?.all },
        { key: 'pending', label: 'Pendientes', dot: 'bg-amber-400', count: counts?.pending },
        { key: 'approved', label: 'Aprobadas', dot: 'bg-emerald-500', count: counts?.approved },
        { key: 'rejected', label: 'Rechazadas', dot: 'bg-rose-500', count: counts?.rejected },
    ];

    const handleFilter = (newStatus: string) => {
        setStatus(newStatus);
        router.get('/absences', { status: newStatus }, { preserveState: true, preserveScroll: true });
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

    // starts_at / ends_at son fechas sin hora: se toma solo YYYY-MM-DD para que
    // la zona horaria del navegador no las corra un día.
    const parseDate = (date: string) => {
        const [y, m, d] = date.slice(0, 10).split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    // Calendario (mismo tamaño y estilo que en Servicios y Fallecidos)
    const renderDate = (date: string) => {
        const d = parseDate(date);
        return (
            <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                <span className="text-xs font-bold uppercase text-rose-800 dark:text-rose-400">
                    {d.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '')}
                </span>
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{d.getDate()}</span>
                <span className="text-[10px] text-muted-foreground">{d.getFullYear()}</span>
            </div>
        );
    };

    // Insignias suaves, igual que en Fallecidos
    const getStatusBadge = (st: string, label: string) => {
        switch (st) {
            case 'approved':
                return (
                    <Badge className="w-fit border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        <CheckCircle className="mr-1 h-3 w-3" /> {label}
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge className="w-fit border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100">
                        <Clock className="mr-1 h-3 w-3" /> {label}
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="w-fit border-rose-200 bg-rose-100 text-rose-800 hover:bg-rose-100">
                        <XCircle className="mr-1 h-3 w-3" /> {label}
                    </Badge>
                );
            default:
                return <Badge variant="outline" className="w-fit">{label}</Badge>;
        }
    };

    const formatDays = (days: number) => `${days} ${days === 1 ? 'día hábil' : 'días hábiles'}`;

    /** Motivo de la solicitud, en una etiqueta discreta. */
    const renderReason = (absence: Absence) =>
        absence.reason ? (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
                <span className="line-clamp-2">{absence.reason}</span>
            </p>
        ) : null;

    /** Botones de acción. En tarjetas ocupan todo el ancho; en tabla van alineados a la derecha. */
    const renderActions = (absence: Absence, full = false) => {
        const canReview = is_admin && absence.status === 'pending';

        return (
            <div className={`flex items-center gap-2 ${full ? '' : 'justify-end'}`}>
                {canReview && (
                    <>
                        <Button
                            size="sm"
                            className={`h-9 bg-emerald-600 text-white hover:bg-emerald-700 ${full ? 'flex-1' : ''}`}
                            onClick={() => handleApprove(absence.id, absence.user.name)}
                        >
                            <CheckCircle className="mr-1 h-4 w-4" /> Aprobar
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className={`h-9 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900 dark:hover:bg-rose-950/30 ${full ? 'flex-1' : ''}`}
                            onClick={() => handleReject(absence.id, absence.user.name)}
                        >
                            <XCircle className="mr-1 h-4 w-4" /> Rechazar
                        </Button>
                    </>
                )}
                <Link href={`/absences/${absence.id}`} className={canReview ? '' : full ? 'flex-1' : ''}>
                    <Button variant="outline" size="sm" className={`h-9 ${canReview ? '' : full ? 'w-full' : ''}`}>
                        <Eye className="mr-1 h-4 w-4" /> Ver
                    </Button>
                </Link>
            </div>
        );
    };

    const availablePct =
        vacation_days.total > 0 ? Math.min((vacation_days.available / vacation_days.total) * 100, 100) : 0;

    return (
        <>
            <Head title="Ausencias" />

            <div className="mx-auto max-w-7xl space-y-6 p-4 pb-12 sm:p-6 lg:p-8">
                {/* Encabezado */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="shrink-0 rounded-lg bg-rose-100 p-2 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                            <Calendar className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl">
                                Gestión de Ausencias
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground md:text-base">
                                {is_admin
                                    ? 'Administra las solicitudes de vacaciones y permisos del personal'
                                    : 'Tus solicitudes de vacaciones y permisos'}
                            </p>
                        </div>
                    </div>
                    <Link href="/absences/create" className="w-full sm:w-auto">
                        <Button className="h-10 w-full bg-rose-800 text-white shadow-md hover:bg-rose-900 sm:w-auto">
                            <Plus className="mr-1 h-4 w-4" /> Solicitar Ausencia
                        </Button>
                    </Link>
                </div>

                {/* Vacaciones disponibles (solo empleado) */}
                {!is_admin && (
                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Tus vacaciones disponibles</p>
                                <p className="mt-1 text-2xl font-bold text-emerald-600">
                                    {vacation_days.available}
                                    <span className="ml-1 text-base font-medium text-muted-foreground">
                                        / {vacation_days.total} días
                                    </span>
                                </p>
                            </div>
                            <div className="w-full space-y-2 sm:max-w-xs">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{vacation_days.used} usados</span>
                                    <span>{availablePct.toFixed(0)}% disponible</span>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                    <div
                                        className="h-full rounded-full bg-emerald-500"
                                        style={{ width: `${availablePct}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chips de estado (con aviso de pendientes para el admin) */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1.5 dark:bg-slate-900" role="tablist">
                        {chips.map((chip) => {
                            const active = status === chip.key;
                            return (
                                <button
                                    key={chip.key || 'all'}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => handleFilter(chip.key)}
                                    className={`flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                                        active
                                            ? 'bg-rose-800 text-white shadow-sm'
                                            : 'text-muted-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {chip.dot && <span className={`h-2 w-2 rounded-full ${chip.dot}`} />}
                                    {chip.label}
                                    {chip.count !== undefined && (
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                active ? 'bg-white/20 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                            }`}
                                        >
                                            {chip.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {is_admin && counts && counts.pending > 0 && (
                        <div className="flex items-baseline justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-900 dark:bg-amber-950/30">
                            <span className="text-xs font-medium text-amber-800 dark:text-amber-300">Por revisar</span>
                            <span className="text-lg font-bold text-amber-800 dark:text-amber-400">
                                {counts.pending} {counts.pending === 1 ? 'solicitud' : 'solicitudes'}
                            </span>
                        </div>
                    )}
                </div>

                {/* ───────── TARJETAS (móvil y tablet) ───────── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
                    {absences.data.length === 0 ? (
                        <div className="rounded-xl border bg-card py-10 text-center text-muted-foreground sm:col-span-2">
                            <Calendar className="mx-auto mb-2 h-12 w-12 text-slate-300" />
                            No hay ausencias para mostrar
                        </div>
                    ) : (
                        absences.data.map((absence) => (
                            <div key={absence.id} className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        {is_admin && (
                                            <p className="mb-1 flex items-center gap-1 text-sm text-muted-foreground">
                                                <User className="h-3 w-3" /> {absence.user.name}
                                            </p>
                                        )}
                                        <p className="font-bold text-slate-800 dark:text-slate-100">{absence.type_label}</p>
                                    </div>
                                    {getStatusBadge(absence.status, absence.status_label)}
                                </div>

                                <div className="flex items-center justify-center gap-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                                    <div className="flex flex-col items-center gap-1.5">
                                        {renderDate(absence.starts_at)}
                                        <span className="text-xs text-muted-foreground">Desde</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div className="flex flex-col items-center gap-1.5">
                                        {renderDate(absence.ends_at)}
                                        <span className="text-xs text-muted-foreground">Hasta</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <CalendarDays className="h-4 w-4" />
                                        <span><strong className="text-foreground">{formatDays(absence.business_days)}</strong></span>
                                    </p>
                                    {renderReason(absence)}
                                </div>

                                <div className="mt-auto border-t pt-4">{renderActions(absence, true)}</div>
                            </div>
                        ))
                    )}
                </div>

                {/* ───────── TABLA (escritorio) ───────── */}
                <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-sm lg:block">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/40">
                            <TableRow>
                                {is_admin && <TableHead className="h-12 px-5">Empleado</TableHead>}
                                <TableHead className="h-12 px-5">Tipo</TableHead>
                                <TableHead className="h-12 px-5">Período</TableHead>
                                <TableHead className="h-12 px-5">Días</TableHead>
                                <TableHead className="h-12 px-5">Estado</TableHead>
                                <TableHead className="h-12 px-5 text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {absences.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={is_admin ? 6 : 5} className="py-12 text-center text-muted-foreground">
                                        <Calendar className="mx-auto mb-2 h-12 w-12 text-slate-300" />
                                        No hay ausencias para mostrar
                                    </TableCell>
                                </TableRow>
                            ) : (
                                absences.data.map((absence) => (
                                    <TableRow key={absence.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                        {is_admin && (
                                            <TableCell className="px-5 py-4 font-medium">{absence.user.name}</TableCell>
                                        )}
                                        <TableCell className="px-5 py-4">
                                            <p className="font-medium">{absence.type_label}</p>
                                            <div className="mt-1 max-w-[220px]">{renderReason(absence)}</div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {renderDate(absence.starts_at)}
                                                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                {renderDate(absence.ends_at)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {absence.business_days}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">{getStatusBadge(absence.status, absence.status_label)}</TableCell>
                                        <TableCell className="whitespace-nowrap px-5 py-4">{renderActions(absence)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Paginación */}
                {absences.last_page > 1 && (
                    <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                        {absences.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                                    link.active
                                        ? 'border-rose-800 bg-rose-800 text-white'
                                        : link.url
                                          ? 'hover:bg-slate-100 dark:hover:bg-slate-800'
                                          : 'opacity-50'
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