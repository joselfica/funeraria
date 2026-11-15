import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    ArrowLeft, Pencil, User, Cross, FileText, MapPin, Calendar, 
    Info, Clock, HeartPulse, Lock
} from 'lucide-react';

interface Service {
    id: number;
    code: string;
    status: string;
    scheduled_at: string;
}

interface Deceased {
    id: number;
    uuid: string;
    full_name: string;
    rut: string | null;
    gender: string | null;
    birth_date: string | null;
    death_date: string;
    death_time: string | null;
    death_certificate_number: string | null;
    death_certificate_office: string | null;
    death_certificate_date: string | null;
    cause_of_death: string | null;
    death_location: string | null;
    current_location: string | null;
    cemetery: string | null;
    niche_location: string | null;
    notes: string | null;
    age_at_death: number | null;
    services: Service[];
    created_at: string;
    updated_at: string;
}

interface Props {
    deceased: Deceased;
}

export default function DeceasedShow({ deceased }: Props) {
    // Fechas sin hora (death_date, birth_date, etc.): se construyen en local
    // para evitar el desfase UTC → Chile.
    const formatDate = (date: string | null) => {
        if (!date) return '—';
        const isoDate = date.length >= 10 ? date.slice(0, 10) : date;
        const [y, m, d] = isoDate.split('-').map(Number);
        if (!y || !m || !d) return '—';
        return new Date(y, m - 1, d).toLocaleDateString('es-CL', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    // Timestamps con hora real (created_at, updated_at, scheduled_at):
    // se respeta la zona horaria del navegador.
    const formatDateTime = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('es-CL', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const getGenderLabel = (gender: string | null) => {
        if (gender === 'M') return 'Masculino';
        if (gender === 'F') return 'Femenino';
        return 'Sin especificar';
    };

    return (
        <>
            <Head title={deceased.full_name} />

            <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
                
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
                    <div className="flex items-start gap-3">
                        <Link href="/deceased"><Button variant="outline" size="icon" className="shrink-0 mt-1"><ArrowLeft className="h-4 w-4" /></Button></Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                                {deceased.full_name}
                                <Badge variant="outline" className="text-xs font-normal">
                                    {getGenderLabel(deceased.gender)}
                                </Badge>
                            </h1>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                                <span className="font-mono">{deceased.uuid}</span>
                                <span>•</span>
                                <span>Creado el {formatDateTime(deceased.created_at)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={`/deceased/${deceased.id}/edit`} className="flex-1 sm:flex-initial">
                            <Button variant="outline" className="w-full sm:w-auto"><Pencil className="h-4 w-4 mr-1" /> Editar</Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* COLUMNA IZQUIERDA */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* DATOS PERSONALES */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/40">
                                <CardTitle className="text-base flex items-center gap-2"><User className="h-5 w-5 text-rose-800" /> Datos Personales</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                    <div><dt className="text-muted-foreground text-xs">Nombre completo</dt><dd className="font-medium mt-0.5">{deceased.full_name}</dd></div>
                                    <div><dt className="text-muted-foreground text-xs">RUT</dt><dd className="font-mono mt-0.5">{deceased.rut || '—'}</dd></div>
                                    <div><dt className="text-muted-foreground text-xs">Género</dt><dd className="font-medium mt-0.5">{getGenderLabel(deceased.gender)}</dd></div>
                                    <div><dt className="text-muted-foreground text-xs">Fecha de nacimiento</dt><dd className="font-medium mt-0.5">{formatDate(deceased.birth_date)}</dd></div>
                                    {deceased.age_at_death && (
                                        <div className="sm:col-span-2"><dt className="text-muted-foreground text-xs">Edad al fallecer</dt><dd className="font-medium mt-0.5">{deceased.age_at_death} años</dd></div>
                                    )}
                                </dl>
                            </CardContent>
                        </Card>

                        {/* DATOS DEL FALLECIMIENTO */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/40">
                                <CardTitle className="text-base flex items-center gap-2"><Cross className="h-5 w-5 text-rose-800" /> Datos del Fallecimiento</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                    <div><dt className="text-muted-foreground text-xs">Fecha</dt><dd className="font-medium mt-0.5">{formatDate(deceased.death_date)}</dd></div>
                                    {deceased.death_time && (
                                        <div><dt className="text-muted-foreground text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> Hora</dt><dd className="font-medium mt-0.5">{deceased.death_time}</dd></div>
                                    )}
                                    <div className="sm:col-span-2"><dt className="text-muted-foreground text-xs flex items-center gap-1"><MapPin className="h-3 w-3" /> Lugar</dt><dd className="font-medium mt-0.5">{deceased.death_location || '—'}</dd></div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-muted-foreground text-xs flex items-center gap-1"><HeartPulse className="h-3 w-3" /> Causa</dt>
                                        <dd className="font-medium mt-0.5 flex items-center gap-2">
                                            {deceased.cause_of_death ? (
                                                <>
                                                    <span>{deceased.cause_of_death}</span>
                                                    <Lock className="h-3 w-3 text-muted-foreground" title="Información sensible" />
                                                </>
                                            ) : '—'}
                                        </dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>

                        {/* CERTIFICADO */}
                        {deceased.death_certificate_number && (
                            <Card className="shadow-sm">
                                <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/40">
                                    <CardTitle className="text-base flex items-center gap-2"><FileText className="h-5 w-5 text-rose-800" /> Certificado de Defunción</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                        <div><dt className="text-muted-foreground text-xs">Número</dt><dd className="font-mono font-medium mt-0.5">{deceased.death_certificate_number}</dd></div>
                                        <div><dt className="text-muted-foreground text-xs">Oficina</dt><dd className="font-medium mt-0.5">{deceased.death_certificate_office || '—'}</dd></div>
                                        <div className="sm:col-span-2"><dt className="text-muted-foreground text-xs">Fecha de emisión</dt><dd className="font-medium mt-0.5">{formatDate(deceased.death_certificate_date)}</dd></div>
                                    </dl>
                                </CardContent>
                            </Card>
                        )}

                    </div>

                    {/* COLUMNA DERECHA */}
                    <div className="space-y-6">
                        
                        {/* UBICACIÓN */}
                        <Card className="shadow-sm border-t-4 border-t-rose-800">
                            <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/40">
                                <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-5 w-5 text-rose-800" /> Ubicación Actual</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3 text-sm">
                                <div className="flex justify-between items-center pb-2 border-b">
                                    <span className="text-muted-foreground">Ubicación</span>
                                    <span className="font-medium text-right">{deceased.current_location || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b">
                                    <span className="text-muted-foreground">Cementerio</span>
                                    <span className="font-medium text-right">{deceased.cemetery || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Nicho</span>
                                    <span className="font-medium text-right">{deceased.niche_location || '—'}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* SERVICIOS ASOCIADOS */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/40">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-rose-800" /> Servicios Asociados
                                    <Badge variant="secondary" className="ml-auto">{deceased.services?.length || 0}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {deceased.services && deceased.services.length > 0 ? (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                        {deceased.services.map((s) => (
                                            <Link key={s.id} href={`/services/${s.id}`} className="flex items-center justify-between p-2.5 border rounded-lg bg-card hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                                <div>
                                                    <p className="font-mono text-xs font-bold">{s.code}</p>
                                                    <p className="text-[10px] text-muted-foreground">{formatDateTime(s.scheduled_at)}</p>
                                                </div>
                                                <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic text-center py-2">No hay servicios asociados</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* NOTAS / OBSERVACIONES */}
                        {deceased.notes && (
                            <Card className="shadow-sm">
                                <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/40">
                                    <CardTitle className="text-base flex items-center gap-2"><Info className="h-5 w-5 text-rose-800" /> Observaciones</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <p className="text-sm whitespace-pre-line">{deceased.notes}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* METADATOS */}
                        <Card className="shadow-sm bg-slate-50/50 dark:bg-slate-900/20 border-none">
                            <CardContent className="p-4 text-xs space-y-2 text-muted-foreground">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Creado:</span>
                                    <span className="font-mono">{formatDateTime(deceased.created_at)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Actualizado:</span>
                                    <span className="font-mono">{formatDateTime(deceased.updated_at)}</span>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </>
    );
}