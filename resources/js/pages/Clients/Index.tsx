import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Client {
    id: number;
    uuid: string;
    rut: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    is_active: boolean;
}

interface Props {
    clients: {
        data: Client[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        search: string;
    };
}

export default function ClientsIndex({ clients, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/clients', { search }, { preserveState: true });
    };

    const handleDelete = (client: Client) => {
        if (confirm(`¿Eliminar a ${client.name}?`)) {
            router.delete(`/clients/${client.id}`);
        }
    };

    return (
        <AppLayout>
            <Head title="Clientes" />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Clientes</h1>
                        <p className="mt-1 text-muted-foreground">
                            Total: {clients.total} clientes registrados
                        </p>
                    </div>
                    <Link href="/clients/create">
                        <Button>Nuevo Cliente</Button>
                    </Link>
                </div>

                <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                    <Input
                        placeholder="Buscar por nombre, RUT o email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-md"
                    />
                    <Button type="submit" variant="secondary">
                        Buscar
                    </Button>
                </form>

                <div className="overflow-hidden rounded-lg border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>RUT</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Teléfono</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="py-8 text-center text-muted-foreground"
                                    >
                                        No hay clientes registrados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                clients.data.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-mono">
                                            {client.rut}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {client.name}
                                        </TableCell>
                                        <TableCell>
                                            {client.email || '—'}
                                        </TableCell>
                                        <TableCell>
                                            {client.phone || '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    client.is_active
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {client.is_active
                                                    ? 'Activo'
                                                    : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="space-x-2 text-right">
                                            <Link
                                                href={`/clients/${client.id}`}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    Ver
                                                </Button>
                                            </Link>
                                            <Link
                                                href={`/clients/${client.id}/edit`}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    Editar
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    handleDelete(client)
                                                }
                                            >
                                                Eliminar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {clients.last_page > 1 && (
                    <div className="mt-4 flex justify-center gap-1">
                        {clients.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`rounded border px-3 py-1 text-sm ${
                                    link.active
                                        ? 'bg-primary text-primary-foreground'
                                        : link.url
                                          ? 'hover:bg-accent'
                                          : 'cursor-not-allowed opacity-50'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
