import { Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import {
    Briefcase,
    CalendarDays,
    Car,
    Cross,
    DollarSign,
    FileText,
    LayoutGrid,
    MapPin,
    Package,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const footerNavItems: NavItem[] = [
    // Eliminamos los items del Starter Kit
];

export function AppSidebar() {
    const { pending_counts, auth } = usePage<{
        pending_counts?: {
            services: number;
            low_stock: number;
            absences?: number;
        };
        auth?: { user?: { roles?: string[] } };
    }>().props;

    // Cerrar el sidebar móvil al navegar
    const { setOpenMobile, isMobile } = useSidebar();
    const { url } = usePage();

    useEffect(() => {
        if (isMobile) {
            setOpenMobile(false);
        }
    }, [url, isMobile, setOpenMobile]);

    const userRoles = auth?.user?.roles ?? [];
    const isAdmin = userRoles.includes('Administrador');
    const isEncargado = userRoles.includes('Encargado');
    const isChofer = userRoles.includes('Chofer');
    const pendingAbsences = pending_counts?.absences ?? 0;

    const mainNavItems: NavItem[] = [
        {
            title: isChofer ? 'Mi Itinerario' : 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        ...((isAdmin || isEncargado)
            ? [
                  {
                      title: 'Clientes',
                      href: '/clients',
                      icon: Users,
                  },
              ]
            : []),
        ...((isAdmin || isEncargado)
            ? [
                  {
                      title: 'Fallecidos',
                      href: '/deceased',
                      icon: Cross,
                  },
              ]
            : []),
        ...((isAdmin || isEncargado || isChofer)
            ? [
                  {
                      title: 'Inventario',
                      href: '/inventory',
                      icon: Package,
                  },
              ]
            : []),
        ...((isAdmin || isEncargado)
            ? [
                  {
                      title: 'Vehículos',
                      href: '/vehicles',
                      icon: Car,
                  },
              ]
            : []),
        ...(!isChofer && (isAdmin || isEncargado)
            ? [
                  {
                      title: 'Servicios',
                      href: '/services',
                      icon: FileText,
                  },
              ]
            : []),
        ...((isAdmin || isEncargado)
            ? [
                  {
                      title: 'Sucursales',
                      href: '/branches',
                      icon: MapPin,
                  },
              ]
            : []),
        {
            title: 'Mis Ausencias',
            href: '/absences',
            icon: CalendarDays,
            badge: pendingAbsences > 0 ? pendingAbsences : undefined,
        },
        ...(isAdmin
            ? [
                  {
                      title: 'Reportes',
                      href: '/reports',
                      icon: DollarSign,
                  },
              ]
            : []),
        // Personal: visible para Administrador y Encargado
        ...((isAdmin || isEncargado)
            ? [
                  {
                      title: 'Personal',
                      href: '/staff',
                      icon: Briefcase,
                  },
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}