import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Car } from 'lucide-react';

interface FormData {
    type: 'carroza' | 'acompanamiento' | 'furgon';
    plate: string;
    brand: string;
    model: string;
    year: string;
    color: string;
    capacity: string;
    status: 'disponible' | 'en_servicio' | 'mantenimiento' | 'fuera_servicio';
    last_maintenance_at: string;
    next_maintenance_at: string;
    hourly_rate: string;
    notes: string;
    is_active: boolean;
}

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
}

interface Props {
    vehicle: Vehicle;
}

export default function VehiclesEdit({ vehicle }: Props) {
    const { data, setData, put, processing, errors } = useForm<FormData>({
        type: vehicle.type,
        plate: vehicle.plate,
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year ? String(vehicle.year) : '',
        color: vehicle.color || '',
        capacity: String(vehicle.capacity),
        status: vehicle.status,
        last_maintenance_at: vehicle.last_maintenance_at?.slice(0, 10) || '',
        next_maintenance_at: vehicle.next_maintenance_at?.slice(0, 10) || '',
        hourly_rate: vehicle.hourly_rate,
        notes: vehicle.notes || '',
        is_active: vehicle.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/vehicles/${vehicle.id}`);
    };

    return (
        <>
            <Head title="Editar Vehículo" />

            <div className="p-4 md:p-6 max-w-3xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Car className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        Editar Vehículo
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm md:text-base">
                        Actualizando datos de la patente <span className="font-mono font-bold text-foreground">{vehicle.plate}</span>
                    </p>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="bg-muted/30">
                        <CardTitle>Información del Vehículo</CardTitle>
                        <CardDescription>Modifica los datos necesarios.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="type">Tipo *</Label>
                                    <select
                                        id="type"
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value as FormData['type'])}
                                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm mt-1 focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="carroza">Carroza</option>
                                        <option value="acompanamiento">Acompañamiento</option>
                                        <option value="furgon">Furgón</option>
                                    </select>
                                    {errors.type && <p className="text-sm text-destructive mt-1">{errors.type}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="plate">Patente *</Label>
                                    <Input
                                        id="plate"
                                        value={data.plate}
                                        onChange={(e) => setData('plate', e.target.value.toUpperCase())}
                                        placeholder="ABCD12"
                                        className="mt-1 uppercase"
                                        required
                                    />
                                    {errors.plate && <p className="text-sm text-destructive mt-1">{errors.plate}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="brand">Marca</Label>
                                    <Input
                                        id="brand"
                                        value={data.brand}
                                        onChange={(e) => setData('brand', e.target.value)}
                                        placeholder="Mercedes-Benz"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="model">Modelo</Label>
                                    <Input
                                        id="model"
                                        value={data.model}
                                        onChange={(e) => setData('model', e.target.value)}
                                        placeholder="Sprinter"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="year">Año</Label>
                                    <Input
                                        id="year"
                                        type="number"
                                        value={data.year}
                                        onChange={(e) => setData('year', e.target.value)}
                                        placeholder="2020"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="color">Color</Label>
                                    <Input
                                        id="color"
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                        placeholder="Negro"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="capacity">Capacidad *</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        value={data.capacity}
                                        onChange={(e) => setData('capacity', e.target.value)}
                                        className="mt-1"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="status">Estado *</Label>
                                    <select
                                        id="status"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value as FormData['status'])}
                                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm mt-1 focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="disponible">Disponible</option>
                                        <option value="en_servicio">En servicio</option>
                                        <option value="mantenimiento">Mantenimiento</option>
                                        <option value="fuera_servicio">Fuera de servicio</option>
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="hourly_rate">Tarifa por hora (CLP)</Label>
                                    <Input
                                        id="hourly_rate"
                                        type="number"
                                        step="0.01"
                                        value={data.hourly_rate}
                                        onChange={(e) => setData('hourly_rate', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="last_maintenance_at">Última mantención</Label>
                                    <Input
                                        id="last_maintenance_at"
                                        type="date"
                                        value={data.last_maintenance_at}
                                        onChange={(e) => setData('last_maintenance_at', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="next_maintenance_at">Próxima mantención</Label>
                                    <Input
                                        id="next_maintenance_at"
                                        type="date"
                                        value={data.next_maintenance_at}
                                        onChange={(e) => setData('next_maintenance_at', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="notes">Notas</Label>
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    id="is_active"
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="is_active">Vehículo activo</Label>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t">
                                <Link href="/vehicles" className="w-full sm:w-auto">
                                    <Button type="button" variant="outline" className="w-full sm:w-auto">Cancelar</Button>
                                </Link>
                                <Button type="submit" disabled={processing} className="w-full sm:w-auto shadow-md">
                                    {processing ? 'Guardando...' : 'Actualizar Vehículo'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}