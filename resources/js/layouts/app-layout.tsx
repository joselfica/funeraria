import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';

interface SharedProps {
    auth: {
        user: {
            id: number;
            name: string;
            roles: string[];
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
    const { auth } = usePage<SharedProps>().props;
    const user = auth?.user;
    
    // Si el usuario es un cliente, renderizamos solo el contenido (el Portal ya tiene su propio header)
    const isClient = user?.roles?.includes('Cliente');
    
    if (isClient) {
        return <>{children}</>;
    }

    // Si es Administrador o Coordinador, renderizamos el layout normal con Sidebar
    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            {children}
        </AppLayoutTemplate>
    );
}