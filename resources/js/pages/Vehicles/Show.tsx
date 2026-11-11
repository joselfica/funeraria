import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Wrench, ShieldAlert, CheckCircle2, Car, Users, Truck, AlertTriangle } from 'lucide-react';

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

const typeIcons = {
    carroza: Car,
    acompanamiento: Users,
    furgon: Truck,
};

const statusLabels: Record<Vehicle['status'], string> = {
    disponible: 'Disponible',
    en_servicio: 'En servicio',
    mantenimiento: 'Mantenimiento',
    fuera_servicio: 'Fuera de servicio',
};

// Colores juguetones y vivos para los estados
const statusStyles: Record<Vehicle['status'], string> = {
    disponible: 'bg-emerald-500 text-white hover:bg-emerald-600 border-none',
    en_servicio: 'bg-blue-500 text-white hover:bg-blue-600 border-none',
    mantenimiento: 'bg-amber-400 text-amber-950 hover:bg-amber-500 border-none',
    fuera_servicio: 'bg-rose-500 text-white hover:bg-rose-600 border-none',
};

export default function VehiclesShow({ vehicle }: Props) {
    const formatPrice = (price: string) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(parseFloat(price));

    const formatDateTime = (date: string) =>
        new Date(date).toLocaleDateString('es-CL', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

    const formatDateOnly = (date: string | null) => {
        if (!date) return '—';
        const [year, month, day] = date.slice(0, 10).split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString('es-CL', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    const TypeIcon = typeIcons[vehicle.type];

    return (
        <>
            <Head title={`Vehículo ${vehicle.plate}`} />

            <div className="p-4 md:p-6 max-w-3xl mx-auto">
                {/* Encabezado Responsivo */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-start gap-4">
                        <Link href="/vehicles">
                            <Button variant="outline" size="icon" className="shrink-0 mt-1">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold font-mono tracking-wider">{vehicle.plate}</h1>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700 flex items-center">
                                    <TypeIcon className="h-3 w-3 mr-1" /> {typeLabels[vehicle.type]}
                                </Badge>
                                <Badge className={statusStyles[vehicle.status]}>
                                    {statusLabels[vehicle.status]}
                                </Badge>
                                {!vehicle.is_active && (
                                    <Badge variant="secondary">Inactivo</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    <Link href={`/vehicles/${vehicle.id}/edit`} className="w-full sm:w-auto mt-2 sm:mt-0">
                        <Button className="w-full sm:w-auto shadow-md">
                            <Pencil className="h-4 w-4 mr-2" /> Editar
                        </Button>
                    </Link>
                </div>

                {/* Alerta de mantención juguetona */}
                {vehicle.needs_maintenance && (
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border-2 border-dashed border-amber-300 dark:border-amber-800 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
                        <div>
                            <p className="text-amber-800 dark:text-amber-300 font-bold text-sm md:text-base">¡Atención!</p>
                            <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
                                Este vehículo requiere mantención. Revisa las fechas en el apartado de abajo.
                            </p>
                        </div>
                    </div>
                )}

                <Card className="mb-6 shadow-sm border-t-4 border-t-primary/50">
                    <CardHeader className="bg-muted/30">
                        <CardTitle>Información del Vehículo</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                            <div>
                                <dt className="text-sm text-muted-foreground">Marca</dt>
                                <dd className="font-medium mt-1">{vehicle.brand || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">Modelo</dt>
                                <dd className="font-medium mt-1">{vehicle.model || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">Año</dt>
                                <dd className="font-medium mt-1">{vehicle.year ?? '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">Color</dt>
                                <dd className="font-medium mt-1">{vehicle.color || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">Capacidad</dt>
                                <dd className="font-medium mt-1">
                                    {vehicle.capacity} {vehicle.capacity === 1 ? 'persona' : 'personas'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">Tarifa por hora</dt>
                                <dd className="font-bold text-lg text-emerald-600 mt-1">{formatPrice(vehicle.hourly_rate)}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <Wrench className="h-5 w-5 text-amber-500" /> Mantención
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Última mantención</p>
                                <p className="font-medium">{formatDateOnly(vehicle.last_maintenance_at)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Próxima mantención</p>
                                <p className={`font-medium ${vehicle.needs_maintenance ? 'text-destructive font-bold' : ''}`}>
                                    {formatDateOnly(vehicle.next_maintenance_at)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle>Notas Adicionales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-line text-sm">{vehicle.notes || 'Sin notas registradas.'}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm bg-muted/20 border-none">
                    <CardContent className="p-4 text-xs space-y-1 text-muted-foreground">
                        <div className="flex justify-between">
                            <span>Fecha de registro:</span>
                            <span className="font-mono">{formatDateTime(vehicle.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Última actualización:</span>
                            <span className="font-mono">{formatDateTime(vehicle.updated_at)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}