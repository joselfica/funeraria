import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarPlus } from 'lucide-react';

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
        <>
            <Head title="Solicitar Ausencia" />

            <div className="p-4 md:p-6 max-w-2xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <CalendarPlus className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        {is_admin ? 'Registrar Ausencia' : 'Solicitar Ausencia'}
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm md:text-base">
                        {is_admin 
                            ? 'Como Administrador, la ausencia se aprobará automáticamente.'
                            : 'Completa el formulario. Tu solicitud será revisada por el Administrador.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card className="shadow-sm">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle>Detalles de la Ausencia</CardTitle>
                            <CardDescription>
                                {is_admin 
                                    ? 'Crea una ausencia en nombre de cualquier empleado'
                                    : 'Todas las ausencias requieren aprobación antes de aplicarse'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-6">
                            
                            {/* SELECTOR DE EMPLEADO (Solo para Admin) */}
                            {is_admin && (
                                <div>
                                    <Label htmlFor="user_id">Empleado *</Label>
                                    <select
                                        id="user_id"
                                        value={data.user_id}
                                        onChange={(e) => setData('user_id', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm mt-1 focus:ring-2 focus:ring-primary/20"
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
                                    <p className="text-xs text-muted-foreground mt-1 bg-primary/5 p-2 rounded border border-primary/10">
                                        💡 Como admin, la ausencia se aprueba automáticamente.
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
                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm mt-1 focus:ring-2 focus:ring-primary/20"
                                    required
                                >
                                    <option value="vacation">🏖️ Vacaciones</option>
                                    <option value="permission">⏱️ Permiso</option>
                                    <option value="medical">🏥 Licencia médica</option>
                                    <option value="personal">👤 Día personal</option>
                                    <option value="bereavement">🕊️ Duelo</option>
                                    <option value="unpaid">🚫 Permiso sin goce</option>
                                    <option value="training">📚 Capacitación</option>
                                    <option value="other">📌 Otro</option>
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
                                        className="mt-1"
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
                                        className="mt-1"
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
                                    placeholder="Detalla el motivo de la ausencia (opcional pero recomendado)"
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20"
                                />
                                {errors.reason && (
                                    <p className="text-sm text-destructive mt-1">{errors.reason}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
                        <Link href="/absences" className="w-full sm:w-auto">
                            <Button type="button" variant="outline" className="w-full sm:w-auto">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="w-full sm:w-auto shadow-md">
                            {processing ? 'Guardando...' : (is_admin ? 'Crear Ausencia' : 'Enviar Solicitud')}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}