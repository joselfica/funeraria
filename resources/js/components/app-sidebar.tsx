import { Link, usePage } from '@inertiajs/react';
import { BookOpen, FileText, FolderGit2, LayoutGrid, Package, Users } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { pending_counts, auth } = usePage<{
        pending_counts?: { services: number; low_stock: number };
        auth?: { user?: { roles?: string[] } };
    }>().props;

    const roles = auth?.user?.roles ?? [];
    const isAdminOrCoordinator = roles.includes('Administrador') || roles.includes('Coordinador');

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Servicios',
            href: '/services',
            icon: FileText,
            badge: pending_counts?.services ?? 0,
        },
        {
            title: 'Inventario',
            href: '/inventory',
            icon: Package,
            badge: pending_counts?.low_stock ?? 0,
        },
        // Solo Administrador y Coordinador ven "Personal"
        ...(isAdminOrCoordinator
            ? [
                  {
                      title: 'Personal',
                      href: '/staff',
                      icon: Users,
                  },
              ]
            : []),
        // Solo Administrador y Coordinador ven "Reportes"
        ...(isAdminOrCoordinator
            ? [
                  {
                      title: 'Reportes',
                      href: '/reports',
                      icon: FileText,
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