import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FormData {
    rut: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
}

export default function ClientsCreate() {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        rut: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/clients');
    };

    return (
        <>
            <Head title="Nuevo Cliente" />

            <div className="max-w-3xl p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Nuevo Cliente</h1>
                    <p className="mt-1 text-muted-foreground">
                        Complete los datos del nuevo cliente
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Información del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="rut">RUT *</Label>
                                    <Input
                                        id="rut"
                                        value={data.rut}
                                        onChange={(e) =>
                                            setData('rut', e.target.value)
                                        }
                                        placeholder="12.345.678-9"
                                        required
                                    />
                                    {errors.rut && (
                                        <p className="mt-1 text-sm text-destructive">
                                            {errors.rut}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="name">
                                        Nombre completo *
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        placeholder="Juan Pérez González"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-destructive">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        placeholder="cliente@ejemplo.cl"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-destructive">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="phone">Teléfono</Label>
                                    <Input
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) =>
                                            setData('phone', e.target.value)
                                        }
                                        placeholder="+56912345678"
                                    />
                                    {errors.phone && (
                                        <p className="mt-1 text-sm text-destructive">
                                            {errors.phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="address">Dirección</Label>
                                <Input
                                    id="address"
                                    value={data.address}
                                    onChange={(e) =>
                                        setData('address', e.target.value)
                                    }
                                    placeholder="Av. Providencia 1234, Santiago"
                                />
                                {errors.address && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {errors.address}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="notes">Notas internas</Label>
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) =>
                                        setData('notes', e.target.value)
                                    }
                                    placeholder="Observaciones sobre el cliente..."
                                    rows={3}
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                />
                                {errors.notes && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {errors.notes}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 border-t pt-4">
                                <Link href="/clients">
                                    <Button type="button" variant="outline">
                                        Cancelar
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Guardando...'
                                        : 'Guardar Cliente'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}