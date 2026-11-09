import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Mail, Plus, Pencil } from 'lucide-react';

interface Branch {
    id: number;
    uuid: string;
    name: string;
    code: string;
    address: string;
    phone: string | null;
    email: string | null;
    is_active: boolean;
}

interface Props {
    branches: Branch[];
}

export default function BranchesIndex({ branches }: Props) {
    const handleDelete = (branch: Branch) => {
        if (confirm(`¿Eliminar la sucursal "${branch.name}"?`)) {
            router.delete(`/branches/${branch.id}`);
        }
    };

    return (
        <>
            <Head title="Sucursales" />

            <div className="p-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Nuestras Sucursales</h1>
                        <p className="text-muted-foreground mt-1">
                            {branches.length} sucursal(es) registrada(s)
                        </p>
                    </div>
                    <Link href="/branches/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" /> Nueva Sucursal
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {branches.map((branch) => (
                        <Card key={branch.id} className={!branch.is_active ? 'opacity-60' : ''}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold">{branch.name}</h3>
                                        <p className="text-sm text-muted-foreground font-mono">{branch.code}</p>
                                    </div>
                                    <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                                        {branch.is_active ? 'Activa' : 'Inactiva'}
                                    </Badge>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                        <span>{branch.address}</span>
                                    </div>
                                    {branch.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span>{branch.phone}</span>
                                        </div>
                                    )}
                                    {branch.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span>{branch.email}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-6">
                                    <Link href={`/branches/${branch.id}/edit`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Pencil className="h-4 w-4 mr-2" /> Editar
                                        </Button>
                                    </Link>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(branch)}>
                                        Eliminar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}