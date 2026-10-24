import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SharedProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            roles: string[];
            permissions: string[];
        } | null;
    };
}

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    // Obtenemos los permisos del usuario logueado
    const { auth } = usePage<SharedProps>().props;
    const user = auth?.user;
    
    // Verificamos si puede crear servicios
    // (Administrador y Coordinador tienen este permiso)
    const canCreateServices = user?.permissions?.includes('services.create') || false;

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            {children}
            
            {/* Botón Flotante Global: SOLO visible si tiene permiso */}
            {canCreateServices && (
                <div className="fixed bottom-6 right-6 z-40">
                    <Link href="/services/wizard">
                        <Button 
                            size="lg" 
                            className="h-16 rounded-full px-6 shadow-2xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-lg font-bold"
                        >
                            <Plus className="h-6 w-6" /> Nuevo Servicio
                        </Button>
                    </Link>
                </div>
            )}
        </AppLayoutTemplate>
    );
}