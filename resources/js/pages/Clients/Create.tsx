import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';

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

            <div className="p-4 md:p-6 max-w-3xl mx-auto">
                <div className="mb-6 flex items-center gap-3">
                    <div className="p-2 bg-rose-100 dark:bg-rose-950/50 rounded-lg text-rose-800 dark:text-rose-400">
                        <UserPlus className="h-6 w-6 md:h-8 md:w-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">Nuevo Cliente</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Complete los datos del nuevo cliente</p>
                    </div>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/40">
                        <CardTitle>Información del Cliente</CardTitle>
                        <CardDescription>Todos los campos marcados con (*) son obligatorios.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="rut">RUT *</Label>
                                    <Input id="rut" value={data.rut} onChange={(e) => setData('rut', e.target.value)} placeholder="12.345.678-9" className="mt-1" required />
                                    {errors.rut && <p className="mt-1 text-sm text-rose-600">{errors.rut}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="name">Nombre completo *</Label>
                                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Juan Pérez González" className="mt-1" required />
                                    {errors.name && <p className="mt-1 text-sm text-rose-600">{errors.name}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="cliente@ejemplo.cl" className="mt-1" />
                                    {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="phone">Teléfono</Label>
                                    <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="+56912345678" className="mt-1" />
                                    {errors.phone && <p className="mt-1 text-sm text-rose-600">{errors.phone}</p>}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="address">Dirección</Label>
                                <Input id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} placeholder="Av. Providencia 1234, Santiago" className="mt-1" />
                                {errors.address && <p className="mt-1 text-sm text-rose-600">{errors.address}</p>}
                            </div>

                            <div>
                                <Label htmlFor="notes">Notas internas</Label>
                                <textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Observaciones sobre el cliente..." rows={3} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-rose-800/20" />
                                {errors.notes && <p className="mt-1 text-sm text-rose-600">{errors.notes}</p>}
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t pt-5">
                                <Link href="/clients" className="w-full sm:w-auto">
                                    <Button type="button" variant="outline" className="w-full sm:w-auto">Cancelar</Button>
                                </Link>
                                <Button type="submit" disabled={processing} className="w-full sm:w-auto bg-rose-800 hover:bg-rose-900 text-white shadow-md">
                                    {processing ? 'Guardando...' : 'Guardar Cliente'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}