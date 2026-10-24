import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Props {
    is_admin: boolean;
    employees: Array<{ id: number; name: string; email: string }>;
}

interface FormData {
    user_id: string;
    type: string;
    starts_at: string;
    ends_at: string;
    reason: string;
}

export default function AbsencesCreate({ is_admin, employees }: Props) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        user_id: '',
        type: 'vacation',
        starts_at: '',
        ends_at: '',
        reason: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/absences');
    };

    return (
        <AppLayout>
            <Head title="Solicitar Ausencia" />

            <div className="p-6 max-w-2xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">
                        {is_admin ? 'Registrar Ausencia' : 'Solicitar Ausencia'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {is_admin 
                            ? 'Como Administrador, la ausencia se aprobará automáticamente.'
                            : 'Completa el formulario. Tu solicitud será revisada por el Administrador.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles de la Ausencia</CardTitle>
                            <CardDescription>
                                {is_admin 
                                    ? 'Crea una ausencia en nombre de cualquier empleado'
                                    : 'Todas las ausencias requieren aprobación antes de aplicarse'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            
                            {/* SELECTOR DE EMPLEADO (Solo para Admin) */}
                            {is_admin && (
                                <div>
                                    <Label htmlFor="user_id">Empleado *</Label>
                                    <select
                                        id="user_id"
                                        value={data.user_id}
                                        onChange={(e) => setData('user_id', e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                                        required
                                    >
                                        <option value="">Seleccionar empleado...</option>
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.name} ({emp.email})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.user_id && (
                                        <p className="text-sm text-destructive mt-1">{errors.user_id}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Como admin, la ausencia se aprueba automáticamente.
                                    </p>
                                </div>
                            )}

                            {/* Tipo de ausencia */}
                            <div>
                                <Label htmlFor="type">Tipo de ausencia *</Label>
                                <select
                                    id="type"
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                                    required
                                >
                                    <option value="vacation">Vacaciones</option>
                                    <option value="permission">Permiso</option>
                                    <option value="medical">Licencia médica</option>
                                    <option value="personal">Día personal</option>
                                    <option value="bereavement">Duelo</option>
                                    <option value="unpaid">Permiso sin goce</option>
                                    <option value="training">Capacitación</option>
                                    <option value="other">Otro</option>
                                </select>
                                {errors.type && (
                                    <p className="text-sm text-destructive mt-1">{errors.type}</p>
                                )}
                            </div>

                            {/* Fechas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="starts_at">Desde *</Label>
                                    <Input
                                        id="starts_at"
                                        type="date"
                                        value={data.starts_at}
                                        onChange={(e) => setData('starts_at', e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                    {errors.starts_at && (
                                        <p className="text-sm text-destructive mt-1">{errors.starts_at}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="ends_at">Hasta *</Label>
                                    <Input
                                        id="ends_at"
                                        type="date"
                                        value={data.ends_at}
                                        onChange={(e) => setData('ends_at', e.target.value)}
                                        min={data.starts_at || new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                    {errors.ends_at && (
                                        <p className="text-sm text-destructive mt-1">{errors.ends_at}</p>
                                    )}
                                </div>
                            </div>

                            {/* Motivo */}
                            <div>
                                <Label htmlFor="reason">Motivo / Observaciones</Label>
                                <textarea
                                    id="reason"
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    rows={4}
                                    placeholder="Detallá el motivo de la ausencia (opcional pero recomendado)"
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                />
                                {errors.reason && (
                                    <p className="text-sm text-destructive mt-1">{errors.reason}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2 mt-6">
                        <Link href="/absences">
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : (is_admin ? 'Crear Ausencia' : 'Enviar Solicitud')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}