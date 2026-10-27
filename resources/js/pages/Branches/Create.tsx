import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BranchesCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/branches');
    };

    return (
        <AppLayout>
            <Head title="Nueva Sucursal" />

            <div className="p-6 max-w-2xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Nueva Sucursal</h1>
                    <p className="text-muted-foreground mt-1">Agregá una nueva sede a la funeraria</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos de la Sucursal</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Nombre *</Label>
                                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Sucursal Centro" required />
                                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <Label>Código *</Label>
                                    <Input value={data.code} onChange={(e) => setData('code', e.target.value)} placeholder="SUC-03" required />
                                    {errors.code && <p className="text-sm text-destructive mt-1">{errors.code}</p>}
                                </div>
                            </div>

                            <div>
                                <Label>Dirección *</Label>
                                <Input value={data.address} onChange={(e) => setData('address', e.target.value)} placeholder="Av. Principal 1234, Temuco" required />
                                {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Teléfono</Label>
                                    <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="+56 45 234 5678" />
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="sucursal@funeraria.cl" />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    id="is_active"
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="h-4 w-4"
                                />
                                <Label htmlFor="is_active">Sucursal activa</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2 mt-6">
                        <Link href="/branches">
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : 'Crear Sucursal'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}