import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserPlus, Shield, Car } from 'lucide-react';

interface Props {
    roles: Array<{ id: number; name: string }>;
}

interface FormData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: string;
    is_active: boolean;
    // Para choferes
    rut: string;
    phone: string;
    license_number: string;
    license_type: string;
    plate: string;
    vehicle_brand: string;
    vehicle_model: string;
    vehicle_color: string;
    is_carroza: boolean;
}

export default function StaffCreate({ roles }: Props) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',
        is_active: true,
        rut: '',
        phone: '',
        license_number: '',
        license_type: 'A1',
        plate: '',
        vehicle_brand: '',
        vehicle_model: '',
        vehicle_color: '',
        is_carroza: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/staff');
    };

    const isChofer = data.role === 'Chofer';

    return (
        <>
            <Head title="Nuevo Usuario" />

            <div className="p-6 max-w-3xl mx-auto">
                <Link href="/staff">
                    <Button variant="ghost" size="sm" className="mb-4 -ml-4">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Personal
                    </Button>
                </Link>

                <div className="mb-6">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <UserPlus className="h-8 w-8 text-primary" /> Nuevo Usuario
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Crea una cuenta de acceso para un nuevo miembro del equipo
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Datos personales */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="h-5 w-5" /> Datos Personales
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Nombre completo *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Juan Pérez González"
                                        required
                                    />
                                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="juan@funeraria.cl"
                                        required
                                    />
                                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Credenciales */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" /> Credenciales de Acceso
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="password">Contraseña * (mínimo 8 caracteres)</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                    {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="password_confirmation">Confirmar contraseña *</Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="role">Rol del Sistema *</Label>
                                    <select
                                        id="role"
                                        value={data.role}
                                        onChange={(e) => setData('role', e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                        required
                                    >
                                        <option value="">Seleccionar rol...</option>
                                        {roles.map((r) => (
                                            <option key={r.id} value={r.name}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.role && <p className="text-sm text-destructive mt-1">{errors.role}</p>}
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        <span className="text-sm">Usuario activo</span>
                                    </label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Datos de chofer (si aplica) */}
                    {isChofer && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Car className="h-5 w-5" /> Datos del Chofer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="rut">RUT del Chofer</Label>
                                        <Input
                                            id="rut"
                                            value={data.rut}
                                            onChange={(e) => setData('rut', e.target.value)}
                                            placeholder="12.345.678-9"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="phone">Teléfono</Label>
                                        <Input
                                            id="phone"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="+56912345678"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="license_number">Número de licencia</Label>
                                        <Input
                                            id="license_number"
                                            value={data.license_number}
                                            onChange={(e) => setData('license_number', e.target.value)}
                                            placeholder="12345678"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="license_type">Tipo de licencia</Label>
                                        <select
                                            id="license_type"
                                            value={data.license_type}
                                            onChange={(e) => setData('license_type', e.target.value)}
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                        >
                                            <option value="A1">A1</option>
                                            <option value="A2">A2</option>
                                            <option value="A3">A3</option>
                                            <option value="A4">A4</option>
                                            <option value="A5">A5</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="plate">Patente del vehículo</Label>
                                        <Input
                                            id="plate"
                                            value={data.plate}
                                            onChange={(e) => setData('plate', e.target.value.toUpperCase())}
                                            placeholder="ABCD12"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="vehicle_brand">Marca</Label>
                                        <Input
                                            id="vehicle_brand"
                                            value={data.vehicle_brand}
                                            onChange={(e) => setData('vehicle_brand', e.target.value)}
                                            placeholder="Mercedes-Benz"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="vehicle_model">Modelo</Label>
                                        <Input
                                            id="vehicle_model"
                                            value={data.vehicle_model}
                                            onChange={(e) => setData('vehicle_model', e.target.value)}
                                            placeholder="Sprinter"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="vehicle_color">Color del vehículo</Label>
                                        <Input
                                            id="vehicle_color"
                                            value={data.vehicle_color}
                                            onChange={(e) => setData('vehicle_color', e.target.value)}
                                            placeholder="Negro"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={data.is_carroza}
                                                onChange={(e) => setData('is_carroza', e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                            <span className="text-sm">Es carroza</span>
                                        </label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Botones */}
                    <div className="flex justify-end gap-2">
                        <Link href="/staff">
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creando...' : 'Crear Usuario'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}