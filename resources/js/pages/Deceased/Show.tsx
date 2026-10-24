import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    const formatDate = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('es-CL', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    const formatDateTime = (date: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('es-CL', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <AppLayout>
            <Head title={deceased.full_name} />

            <div className="p-6 max-w-4xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{deceased.full_name}</h1>
                        <p className="text-muted-foreground mt-1 font-mono text-sm">{deceased.uuid}</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/deceased">
                            <Button variant="outline">Volver</Button>
                        </Link>
                        <Link href={`/deceased/${deceased.id}/edit`}>
                            <Button>Editar</Button>
                        </Link>
                    </div>
                </div>

                {/* Datos personales */}
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Datos Personales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="divide-y">
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Nombre</dt>
                                <dd className="col-span-2 font-medium">{deceased.full_name}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">RUT</dt>
                                <dd className="col-span-2 font-mono">{deceased.rut || '—'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Género</dt>
                                <dd className="col-span-2">
                                    {deceased.gender === 'M' ? 'Masculino' : deceased.gender === 'F' ? 'Femenino' : 'Sin especificar'}
                                </dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Fecha de nacimiento</dt>
                                <dd className="col-span-2">{formatDate(deceased.birth_date)}</dd>
                            </div>
                            {deceased.age_at_death && (
                                <div className="grid grid-cols-3 gap-4 py-3">
                                    <dt className="text-sm text-muted-foreground">Edad al fallecer</dt>
                                    <dd className="col-span-2">{deceased.age_at_death} años</dd>
                                </div>
                            )}
                        </dl>
                    </CardContent>
                </Card>

                {/* Fallecimiento */}
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Datos del Fallecimiento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="divide-y">
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Fecha</dt>
                                <dd className="col-span-2">{formatDate(deceased.death_date)}</dd>
                            </div>
                            {deceased.death_time && (
                                <div className="grid grid-cols-3 gap-4 py-3">
                                    <dt className="text-sm text-muted-foreground">Hora</dt>
                                    <dd className="col-span-2">{deceased.death_time}</dd>
                                </div>
                            )}
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Lugar</dt>
                                <dd className="col-span-2">{deceased.death_location || '—'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Causa</dt>
                                <dd className="col-span-2">
                                    {deceased.cause_of_death ? (
                                        <span>{deceased.cause_of_death} 🔒</span>
                                    ) : (
                                        '—'
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {/* Certificado */}
                {deceased.death_certificate_number && (
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle>Certificado de Defunción</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="divide-y">
                                <div className="grid grid-cols-3 gap-4 py-3">
                                    <dt className="text-sm text-muted-foreground">Número</dt>
                                    <dd className="col-span-2 font-mono">{deceased.death_certificate_number}</dd>
                                </div>
                                <div className="grid grid-cols-3 gap-4 py-3">
                                    <dt className="text-sm text-muted-foreground">Oficina</dt>
                                    <dd className="col-span-2">{deceased.death_certificate_office || '—'}</dd>
                                </div>
                                <div className="grid grid-cols-3 gap-4 py-3">
                                    <dt className="text-sm text-muted-foreground">Fecha emisión</dt>
                                    <dd className="col-span-2">{formatDate(deceased.death_certificate_date)}</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                )}

                {/* Ubicación */}
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Ubicación</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="divide-y">
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Ubicación actual</dt>
                                <dd className="col-span-2">{deceased.current_location || '—'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Cementerio</dt>
                                <dd className="col-span-2">{deceased.cemetery || '—'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Nicho</dt>
                                <dd className="col-span-2">{deceased.niche_location || '—'}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {/* Servicios */}
                {deceased.services && deceased.services.length > 0 && (
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle>Servicios Asociados ({deceased.services.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {deceased.services.map((s) => (
                                    <Link
                                        key={s.id}
                                        href={`/services/${s.id}`}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                                    >
                                        <div>
                                            <p className="font-mono text-sm">{s.code}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDateTime(s.scheduled_at)}
                                            </p>
                                        </div>
                                        <Badge>{s.status}</Badge>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Notas */}
                {deceased.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Observaciones</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{deceased.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}