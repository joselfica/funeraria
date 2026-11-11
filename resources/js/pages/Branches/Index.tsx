import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Mail, Plus, Pencil, Power, PowerOff } from 'lucide-react';

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
    /**
     * Activa o desactiva una sucursal.
     * Se pide confirmación antes de ejecutar la acción.
     */
    const handleToggleActive = (branch: Branch) => {
        const accion = branch.is_active ? 'desactivar' : 'activar';
        if (confirm(`¿Estás seguro de ${accion} la sucursal "${branch.name}"?`)) {
            router.patch(`/branches/${branch.id}/toggle-active`, {}, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Sucursales" />

            <div className="p-4 md:p-6 max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Nuestras Sucursales</h1>
                        <p className="text-muted-foreground mt-1">
                            {branches.length} sucursal(es) registrada(s)
                        </p>
                    </div>
                    <Link href="/branches/create">
                        <Button className="w-full sm:w-auto">
                            <Plus className="h-4 w-4 mr-2" /> Nueva Sucursal
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {branches.map((branch) => (
                        <Card 
                            key={branch.id} 
                            className={`transition-all duration-300 ${
                                branch.is_active 
                                    ? 'border-primary/20 shadow-sm hover:shadow-md' 
                                    : 'bg-muted/40 border-dashed opacity-80 grayscale-[20%]'
                            }`}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className={`text-xl font-bold ${!branch.is_active && 'text-muted-foreground'}`}>
                                            {branch.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground font-mono">{branch.code}</p>
                                    </div>
                                    
                                    {/* Badge de estado con colores más vivos */}
                                    <Badge 
                                        variant={branch.is_active ? 'default' : 'secondary'}
                                        className={branch.is_active ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}
                                    >
                                        {branch.is_active ? 'Activa' : 'Inactiva'}
                                    </Badge>
                                </div>

                                <div className={`space-y-2 text-sm ${!branch.is_active && 'text-muted-foreground'}`}>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 mt-0.5 shrink-0 opacity-70" />
                                        <span>{branch.address}</span>
                                    </div>
                                    {branch.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 opacity-70" />
                                            <span>{branch.phone}</span>
                                        </div>
                                    )}
                                    {branch.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 opacity-70" />
                                            <span>{branch.email}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-6 pt-4 border-t border-border/50">
                                    <Link href={`/branches/${branch.id}/edit`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                            <Pencil className="h-4 w-4 mr-2" /> Editar
                                        </Button>
                                    </Link>
                                    
                                    {/* Botón dinámico: Verde para activar, Rojo para desactivar */}
                                    <Button
                                        variant={branch.is_active ? 'destructive' : 'default'}
                                        size="sm"
                                        onClick={() => handleToggleActive(branch)}
                                        className={`flex-1 text-white transition-colors duration-300 ${
                                            branch.is_active 
                                                ? 'bg-rose-600 hover:bg-rose-700' 
                                                : 'bg-emerald-600 hover:bg-emerald-700'
                                        }`}
                                    >
                                        {branch.is_active ? (
                                            <>
                                                <PowerOff className="h-4 w-4 mr-2" /> Desactivar
                                            </>
                                        ) : (
                                            <>
                                                <Power className="h-4 w-4 mr-2" /> Activar
                                            </>
                                        )}
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