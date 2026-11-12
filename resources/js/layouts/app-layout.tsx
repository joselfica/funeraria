import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface SharedProps {
    auth: {
        user: {
            id: number;
            name: string;
            roles: string[];
        } | null;
    };
    flash?: {
        toast?: {
            type: 'success' | 'error' | 'warning' | 'info';
            message: string;
        };
    };
}

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { auth, flash } = usePage<SharedProps>().props;
    const user = auth?.user;

    // Escuchar los mensajes flash del backend (éxito, error, etc.)
    useEffect(() => {
        if (flash?.toast) {
            const { type, message } = flash.toast;
            
            // Mapear el tipo al método de toast correspondiente
            switch (type) {
                case 'success':
                    toast.success(message);
                    break;
                case 'error':
                    toast.error(message);
                    break;
                case 'warning':
                    toast.warning(message);
                    break;
                case 'info':
                    toast.info(message);
                    break;
                default:
                    toast(message);
            }
        }
    }, [flash?.toast]);

    const isClient = user?.roles?.includes('Cliente');

    if (isClient) {
        return <>{children}</>;
    }

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            {children}
        </AppLayoutTemplate>
    );
}