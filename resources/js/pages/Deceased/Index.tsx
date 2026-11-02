import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableActions } from '@/components/ui/table-actions';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface Deceased {
    id: number;
    uuid: string;
    full_name: string;
    rut: string | null;
    gender: string | null;
    death_date: string;
    death_certificate_number: string | null;
    current_location: string | null;
}

interface Props {
    deceased: {
        data: Deceased[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: { search: string };
}

export default function DeceasedIndex({ deceased, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/deceased', { search }, { preserveState: true });
    };

    const handleDelete = (item: Deceased) => {
        if (confirm(`¿Eliminar el registro de ${item.full_name}?\n\nEsta acción se puede revertir.`)) {
            router.delete(`/deceased/${item.id}`);
        }
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });

    return (
        <AppLayout>
            <Head title="Fallecidos" />

            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Fallecidos</h1>
                        <p className="text-muted-foreground mt-1">
                            Total: {deceased.total} registros
                        </p>
                    </div>
                    <Link href="/deceased/create">
                        <Button>Nuevo Registro</Button>
                    </Link>
                </div>

                <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                    <Input
                        placeholder="Buscar por nombre, RUT o certificado..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-md"
                    />
                    <Button type="submit" variant="secondary">Buscar</Button>
                </form>

                <div className="border rounded-lg overflow-hidden bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>RUT</TableHead>
                                <TableHead>Fecha fallecimiento</TableHead>
                                <TableHead>Certificado</TableHead>
                                <TableHead>Ubicación actual</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deceased.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No hay registros
                                    </TableCell>
                                </TableRow>
                            ) : (
                                deceased.data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.full_name}</TableCell>
                                        <TableCell className="font-mono text-sm">{item.rut || '—'}</TableCell>
                                        <TableCell>{formatDate(item.death_date)}</TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {item.death_certificate_number || '—'}
                                        </TableCell>
                                        <TableCell className="text-sm">{item.current_location || '—'}</TableCell>
                                        <TableCell>
                                            <TableActions
                                                viewHref={`/deceased/${item.id}`}
                                                editHref={`/deceased/${item.id}/edit`}
                                                onDelete={() => handleDelete(item)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {deceased.last_page > 1 && (
                    <div className="mt-4 flex justify-center gap-1">
                        {deceased.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`px-3 py-1 rounded border text-sm ${
                                    link.active ? 'bg-primary text-primary-foreground' : link.url ? 'hover:bg-accent' : 'opacity-50'
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