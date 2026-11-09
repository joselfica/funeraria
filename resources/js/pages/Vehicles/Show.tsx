import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Vehicle {
    id: number;
    type: 'carroza' | 'acompanamiento' | 'furgon';
    plate: string;
    brand: string | null;
    model: string | null;
    year: number | null;
    color: string | null;
    capacity: number;
    status: 'disponible' | 'en_servicio' | 'mantenimiento' | 'fuera_servicio';
    last_maintenance_at: string | null;
    next_maintenance_at: string | null;
    hourly_rate: string;
    notes: string | null;
    is_active: boolean;
    needs_maintenance: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    vehicle: Vehicle;
}

const typeLabels: Record<Vehicle['type'], string> = {
    carroza: 'Carroza',
    acompanamiento: 'Acompañamiento',
    furgon: 'Furgón',
};

const statusLabels: Record<Vehicle['status'], string> = {
    disponible: 'Disponible',
    en_servicio: 'En servicio',
    mantenimiento: 'Mantenimiento',
    fuera_servicio: 'Fuera de servicio',
};

const statusClasses: Record<Vehicle['status'], string> = {
    disponible: 'bg-green-100 text-green-800 border-transparent hover:bg-green-100',
    en_servicio: 'bg-blue-100 text-blue-800 border-transparent hover:bg-blue-100',
    mantenimiento: 'bg-yellow-100 text-yellow-800 border-transparent hover:bg-yellow-100',
    fuera_servicio: 'bg-red-100 text-red-800 border-transparent hover:bg-red-100',
};

export default function VehiclesShow({ vehicle }: Props) {
    const formatPrice = (price: string) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(parseFloat(price));

    const formatDateTime = (date: string) =>
        new Date(date).toLocaleDateString('es-CL', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

    // Para fechas sin hora (YYYY-MM-DD): se arma la fecha en hora local
    // para evitar que se corra un día por la zona horaria.
    const formatDateOnly = (date: string | null) => {
        if (!date) return '—';
        const [year, month, day] = date.slice(0, 10).split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString('es-CL', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    return (
        <>
            <Head title={`Vehículo ${vehicle.plate}`} />

            <div className="p-6 max-w-3xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-5xl font-bold font-mono tracking-wider">{vehicle.plate}</h1>
                        <div className="mt-3 flex gap-2">
                            <Badge variant="secondary">{typeLabels[vehicle.type]}</Badge>
                            <Badge className={statusClasses[vehicle.status]}>
                                {statusLabels[vehicle.status]}
                            </Badge>
                            {!vehicle.is_active && <Badge variant="outline">Inactivo</Badge>}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/vehicles">
                            <Button variant="outline">Volver</Button>
                        </Link>
                        <Link href={`/vehicles/${vehicle.id}/edit`}>
                            <Button>Editar</Button>
                        </Link>
                    </div>
                </div>

                {vehicle.needs_maintenance && (
                    <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                        <p className="text-destructive font-medium">
                            ⚠️ Mantención pendiente — Este vehículo requiere mantención
                        </p>
                    </div>
                )}

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Información del Vehículo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="divide-y">
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Marca</dt>
                                <dd className="col-span-2">{vehicle.brand || '—'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Modelo</dt>
                                <dd className="col-span-2">{vehicle.model || '—'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Año</dt>
                                <dd className="col-span-2">{vehicle.year ?? '—'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Color</dt>
                                <dd className="col-span-2">{vehicle.color || '—'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Capacidad</dt>
                                <dd className="col-span-2">
                                    {vehicle.capacity} {vehicle.capacity === 1 ? 'persona' : 'personas'}
                                </dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Tarifa por hora</dt>
                                <dd className="col-span-2 font-medium">{formatPrice(vehicle.hourly_rate)}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Mantención</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="divide-y">
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Última mantención</dt>
                                <dd className="col-span-2">{formatDateOnly(vehicle.last_maintenance_at)}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">Próxima mantención</dt>
                                <dd className={`col-span-2 ${vehicle.needs_maintenance ? 'text-destructive font-bold' : ''}`}>
                                    {formatDateOnly(vehicle.next_maintenance_at)}
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Notas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-line">{vehicle.notes || '—'}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Metadatos</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2 text-muted-foreground">
                        <div className="flex justify-between">
                            <span>Creado:</span>
                            <span>{formatDateTime(vehicle.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Última actualización:</span>
                            <span>{formatDateTime(vehicle.updated_at)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}