import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowLeft, Calendar, CheckCircle, XCircle, Clock, User,
    CalendarDays, MessageSquare, ShieldCheck,
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
    rejection_reason?: string | null;
    user: { id: number; name: string; email: string };
    approved_by: { name: string } | null;
}

interface Props {
    absence: Absence;
    is_admin: boolean;
}

export default function AbsenceShow({ absence, is_admin }: Props) {
    const parseDate = (date: string) => {
        const [y, m, d] = date.slice(0, 10).split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const formatDate = (date: string) =>
        parseDate(date).toLocaleDateString('es-CL', {
            day: '2-digit', month: 'long', year: 'numeric',
        });

    const handleApprove = () => {
        if (confirm(`¿Aprobar la ausencia de ${absence.user.name}?`)) {
            router.post(`/absences/${absence.id}/approve`);
        }
    };

    const handleReject = () => {
        const reason = prompt(`Motivo del rechazo para ${absence.user.name}:`);
        if (reason) {
            router.post(`/absences/${absence.id}/reject`, { rejection_reason: reason });
        }
    };

    const statusBadge = () => {
        switch (absence.status) {
            case 'approved':
                return (
                    <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        <CheckCircle className="mr-1 h-3 w-3" /> {absence.status_label}
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge className="border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100">
                        <Clock className="mr-1 h-3 w-3" /> {absence.status_label}
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="border-rose-200 bg-rose-100 text-rose-800 hover:bg-rose-100">
                        <XCircle className="mr-1 h-3 w-3" /> {absence.status_label}
                    </Badge>
                );
            default:
                return <Badge variant="outline">{absence.status_label}</Badge>;
        }
    };

    const canReview = is_admin && absence.status === 'pending';

    return (
        <>
            <Head title={`Ausencia - ${absence.user.name}`} />

            <div className="mx-auto max-w-3xl space-y-6 p-4 pb-12 sm:p-6 lg:p-8">
                {/* Encabezado */}
                <div className="flex items-center gap-3">
                    <Link href="/absences">
                        <Button variant="ghost" size="icon" aria-label="Volver">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="shrink-0 rounded-lg bg-rose-100 p-2 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold md:text-2xl">Detalle de Ausencia</h1>
                        <p className="text-sm text-muted-foreground">{absence.type_label}</p>
                    </div>
                    <div className="ml-auto">{statusBadge()}</div>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-base">Información</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="flex items-start gap-3">
                            <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">{absence.user.name}</p>
                                <p className="text-xs text-muted-foreground">{absence.user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Período</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatDate(absence.starts_at)} → {formatDate(absence.ends_at)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {absence.business_days} {absence.business_days === 1 ? 'día hábil' : 'días hábiles'}
                                </p>
                            </div>
                        </div>

                        {absence.reason && (
                            <div className="flex items-start gap-3">
                                <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Motivo</p>
                                    <p className="text-sm text-muted-foreground whitespace-pre-line">{absence.reason}</p>
                                </div>
                            </div>
                        )}

                        {absence.status === 'rejected' && absence.rejection_reason && (
                            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-900 dark:bg-rose-950/30">
                                <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                                    Motivo del rechazo
                                </p>
                                <p className="mt-1 text-sm text-rose-700 dark:text-rose-400">
                                    {absence.rejection_reason}
                                </p>
                            </div>
                        )}

                        {absence.status === 'approved' && absence.approved_by && (
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                                <div>
                                    <p className="text-sm font-medium">Aprobada por</p>
                                    <p className="text-sm text-muted-foreground">{absence.approved_by.name}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Acciones */}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Link href="/absences">
                        <Button variant="outline" className="w-full sm:w-auto">Volver</Button>
                    </Link>
                    {canReview && (
                        <>
                            <Button
                                variant="outline"
                                className="w-full border-rose-200 text-rose-700 hover:bg-rose-50 sm:w-auto"
                                onClick={handleReject}
                            >
                                <XCircle className="mr-1 h-4 w-4" /> Rechazar
                            </Button>
                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto"
                                onClick={handleApprove}
                            >
                                <CheckCircle className="mr-1 h-4 w-4" /> Aprobar
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}