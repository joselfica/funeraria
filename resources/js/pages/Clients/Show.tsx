import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    created_at: string;
    updated_at: string;
}

interface Props {
    client: Client;
}

export default function ClientsShow({ client }: Props) {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout>
            <Head title={client.name} />

            <div className="max-w-3xl p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{client.name}</h1>
                        <p className="mt-1 font-mono text-sm text-muted-foreground">
                            {client.uuid}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/clients">
                            <Button variant="outline">Volver</Button>
                        </Link>
                        <Link href={`/clients/${client.id}/edit`}>
                            <Button>Editar</Button>
                        </Link>
                    </div>
                </div>

                <Card className="mb-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Información del Cliente</CardTitle>
                        <Badge
                            variant={client.is_active ? 'default' : 'secondary'}
                        >
                            {client.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <dl className="divide-y">
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">
                                    RUT
                                </dt>
                                <dd className="col-span-2 font-mono">
                                    {client.rut}
                                </dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">
                                    Nombre
                                </dt>
                                <dd className="col-span-2 font-medium">
                                    {client.name}
                                </dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">
                                    Email
                                </dt>
                                <dd className="col-span-2">
                                    {client.email || '—'}
                                </dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">
                                    Teléfono
                                </dt>
                                <dd className="col-span-2">
                                    {client.phone || '—'}
                                </dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">
                                    Dirección
                                </dt>
                                <dd className="col-span-2">
                                    {client.address || '—'}
                                </dd>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm text-muted-foreground">
                                    Notas
                                </dt>
                                <dd className="col-span-2">
                                    {client.notes || '—'}
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Metadatos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                            <span>Creado:</span>
                            <span>{formatDate(client.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Última actualización:</span>
                            <span>{formatDate(client.updated_at)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
