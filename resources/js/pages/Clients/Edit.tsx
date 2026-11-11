import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCog } from 'lucide-react';

interface Client {
    id: number;
    uuid: string;
    rut: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    is_active: boolean;
}

interface Props {
    client: Client;
    redirect_to?: string | null;
}

interface FormData {
    rut: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
    is_active: boolean;
    redirect_to: string;
}

export default function ClientsEdit({ client, redirect_to }: Props) {
    const { data, setData, put, processing, errors } = useForm<FormData>({
        rut: client.rut,
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        notes: client.notes || '',
        is_active: client.is_active,
        redirect_to: redirect_to || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/clients/${client.id}`);
    };

    return (
        <>
            <Head title={`Editar ${client.name}`} />

            <div className="p-4 md:p-6 max-w-3xl mx-auto">
                <div className="mb-6 flex items-center gap-3">
                    <div className="p-2 bg-rose-100 dark:bg-rose-950/50 rounded-lg text-rose-800 dark:text-rose-400">
                        <UserCog className="h-6 w-6 md:h-8 md:w-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">Editar Cliente</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Modifique los datos de <span className="font-mono font-semibold">{client.rut}</span></p>
                    </div>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/40">
                        <CardTitle>Información del Cliente</CardTitle>
                        <CardDescription>Actualice los campos necesarios.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="rut">RUT *</Label>
                                    <Input id="rut" value={data.rut} onChange={(e) => setData('rut', e.target.value)} className="mt-1" required />
                                    {errors.rut && <p className="mt-1 text-sm text-rose-600">{errors.rut}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="name">Nombre completo *</Label>
                                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1" required />
                                    {errors.name && <p className="mt-1 text-sm text-rose-600">{errors.name}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="mt-1" />
                                    {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="phone">Teléfono</Label>
                                    <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="mt-1" />
                                    {errors.phone && <p className="mt-1 text-sm text-rose-600">{errors.phone}</p>}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="address">Dirección</Label>
                                <Input id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} className="mt-1" />
                                {errors.address && <p className="mt-1 text-sm text-rose-600">{errors.address}</p>}
                            </div>

                            <div>
                                <Label htmlFor="notes">Notas internas</Label>
                                <textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={3} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-rose-800/20" />
                                {errors.notes && <p className="mt-1 text-sm text-rose-600">{errors.notes}</p>}
                            </div>

                            <div className="flex items-center gap-2">
                                <input id="is_active" type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-rose-800 focus:ring-rose-800" />
                                <Label htmlFor="is_active">Cliente activo</Label>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t pt-5">
                                <Link href="/clients" className="w-full sm:w-auto">
                                    <Button type="button" variant="outline" className="w-full sm:w-auto">Cancelar</Button>
                                </Link>
                                <Button type="submit" disabled={processing} className="w-full sm:w-auto bg-rose-800 hover:bg-rose-900 text-white shadow-md">
                                    {processing ? 'Guardando...' : 'Actualizar Cliente'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}