import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, CheckCircle2, XCircle, Calendar, Plus, KeyRound, UserX, UserCheck, Ban, Lock, LockOpen, MoreVertical, Search } from 'lucide-react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface Employee {
    id: number;
    name: string;
    email: string;
    roles: string[];
    is_available: boolean;
    current_absence: { type: string; ends_at: string } | null;
    vacation_days_available: number;
    vacation_days_total: number;
    is_active: boolean;
    failed_login_attempts: number;
    is_locked: boolean;
    locked_until: string | null;
}

interface Props {
    staff: Employee[];
}

type Filter = 'all' | 'available' | 'absent' | 'inactive' | 'locked';

interface MenuItem {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    tone?: 'danger' | 'success' | 'warning';
}

const initials = (name: string) =>
    name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

/**
 * Menú de tres puntos por fila. Se dibuja en un portal con posición fija para
 * que no lo recorte el scroll horizontal de la tabla.
 */
function RowMenu({ items, large = false }: { items: MenuItem[]; large?: boolean }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, right: 0 });
    const btnRef = useRef<HTMLButtonElement>(null);

    const toggle = () => {
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
        }
        setOpen((o) => !o);
    };

    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
            window.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const toneClass = (tone?: MenuItem['tone']) =>
        tone === 'danger'
            ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            : tone === 'success'
              ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              : tone === 'warning'
                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                : '';

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={toggle}
                aria-label="Más acciones"
                className={`inline-flex shrink-0 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    large ? 'h-10 w-10 border' : 'h-9 w-9'
                }`}
            >
                <MoreVertical className="h-4 w-4" />
            </button>

            {open &&
                createPortal(
                    <>
                        <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
                        <div
                            className="fixed z-[9999] w-52 rounded-lg border bg-card p-1 shadow-lg"
                            style={{ top: pos.top, right: pos.right }}
                        >
                            {items.map((item) => (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                        item.onClick();
                                    }}
                                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${toneClass(item.tone)}`}
                                >
                                    {item.icon} {item.label}
                                </button>
                            ))}
                        </div>
                    </>,
                    document.body,
                )}
        </>
    );
}

export default function StaffIndex({ staff }: Props) {
    const [filter, setFilter] = useState<Filter>('all');
    const [search, setSearch] = useState('');

    const handleToggleActive = (userId: number, userName: string, isActive: boolean) => {
        const message = isActive
            ? `¿Estás seguro de desactivar a "${userName}"?\n\nEl usuario no podrá iniciar sesión y sus sesiones activas se cerrarán inmediatamente.`
            : `¿Estás seguro de activar a "${userName}"?\n\nEl usuario podrá iniciar sesión nuevamente.`;

        if (confirm(message)) {
            router.post(`/staff/${userId}/toggle-active`);
        }
    };

    const handleUnlock = (userId: number, userName: string) => {
        if (confirm(`¿Desbloquear la cuenta de "${userName}"?\n\nSe reiniciarán los intentos fallidos de inicio de sesión.`)) {
            router.post(`/staff/${userId}/unlock`);
        }
    };

    const handleChangePassword = (userId: number, userName: string) => {
        const password = prompt(`Nueva contraseña para ${userName} (mínimo 8 caracteres):`);
        if (!password || password.length < 8) {
            alert('La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        const confirmation = prompt('Confirma la contraseña:');
        if (password !== confirmation) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        router.post(`/staff/${userId}/password`, {
            password: password,
            password_confirmation: confirmation,
        });
    };

    // Contadores y filtro: la lista llega completa, se filtra en el navegador
    const counts = {
        all: staff.length,
        available: staff.filter((e) => e.is_active && e.is_available).length,
        absent: staff.filter((e) => e.is_active && !e.is_available).length,
        inactive: staff.filter((e) => !e.is_active).length,
        locked: staff.filter((e) => e.is_locked).length,
    };

    const chips: Array<{ key: Filter; label: string; dot: string | null; count: number }> = [
        { key: 'all', label: 'Todos', dot: null, count: counts.all },
        { key: 'available', label: 'Disponibles', dot: 'bg-emerald-500', count: counts.available },
        { key: 'absent', label: 'Ausentes', dot: 'bg-rose-500', count: counts.absent },
        { key: 'inactive', label: 'Desactivados', dot: 'bg-slate-400', count: counts.inactive },
        ...(counts.locked > 0 || filter === 'locked'
            ? [{ key: 'locked' as Filter, label: 'Bloqueados', dot: 'bg-amber-500', count: counts.locked }]
            : []),
    ];

    const term = search.trim().toLowerCase();
    const visible = staff.filter((e) => {
        const byFilter =
            filter === 'all' ? true :
            filter === 'available' ? e.is_active && e.is_available :
            filter === 'absent' ? e.is_active && !e.is_available :
            filter === 'inactive' ? !e.is_active :
            e.is_locked;
        const bySearch = !term || e.name.toLowerCase().includes(term) || e.email.toLowerCase().includes(term);
        return byFilter && bySearch;
    });

    const renderAvatar = (emp: Employee) => (
        <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                emp.is_active ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
            }`}
        >
            {initials(emp.name)}
        </div>
    );

    /** Estado de disponibilidad: desactivado, disponible o ausente. */
    const renderStatus = (emp: Employee) => {
        if (!emp.is_active) {
            return (
                <Badge className="w-fit border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-100">
                    <Ban className="mr-1 h-3 w-3" /> Desactivado
                </Badge>
            );
        }
        if (emp.is_available) {
            return (
                <Badge className="w-fit border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Disponible
                </Badge>
            );
        }
        return (
            <Badge className="w-fit border-rose-200 bg-rose-100 text-rose-800 hover:bg-rose-100">
                <XCircle className="mr-1 h-3 w-3" /> Ausente
            </Badge>
        );
    };

    const renderAbsence = (emp: Employee) =>
        emp.is_active && emp.current_absence ? (
            <p className="text-xs font-medium text-rose-600">
                {emp.current_absence.type} hasta {emp.current_absence.ends_at}
            </p>
        ) : null;

    const renderLockBadge = (emp: Employee) =>
        emp.is_locked ? (
            <Badge className="w-fit gap-1 border-amber-200 bg-amber-100 text-xs text-amber-800 hover:bg-amber-100">
                <Lock className="h-3 w-3" />
                Bloqueado ({emp.failed_login_attempts} {emp.failed_login_attempts === 1 ? 'intento' : 'intentos'})
                {emp.locked_until && ` hasta ${emp.locked_until}`}
            </Badge>
        ) : null;

    const renderRoles = (emp: Employee) => (
        <div className="flex flex-wrap gap-1">
            {emp.roles.map((r) => (
                <Badge key={r} variant="secondary" className="text-xs">
                    {r}
                </Badge>
            ))}
        </div>
    );

    /** Días de vacaciones con barra de progreso. */
    const renderVacations = (emp: Employee) => {
        const pct = emp.vacation_days_total > 0
            ? Math.min((emp.vacation_days_available / emp.vacation_days_total) * 100, 100)
            : 0;
        const color =
            emp.vacation_days_available > 5 ? 'bg-emerald-500' :
            emp.vacation_days_available > 0 ? 'bg-amber-500' :
            'bg-red-500';
        const text =
            emp.vacation_days_available > 5 ? 'text-emerald-600' :
            emp.vacation_days_available > 0 ? 'text-amber-600' :
            'text-red-600';

        return (
            <div className="w-full min-w-[150px] space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                    <span className={`flex items-center gap-1.5 text-sm font-semibold ${text}`}>
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {emp.vacation_days_available} / {emp.vacation_days_total} días
                    </span>
                    {emp.vacation_days_available === 0 && (
                        <span className="text-[11px] font-medium text-red-600">Sin vacaciones</span>
                    )}
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
            </div>
        );
    };

    /** Acciones secundarias, dentro del menú de tres puntos. */
    const menuItems = (emp: Employee): MenuItem[] => [
        {
            label: 'Cambiar contraseña',
            icon: <KeyRound className="h-4 w-4" />,
            onClick: () => handleChangePassword(emp.id, emp.name),
        },
        emp.is_active
            ? {
                label: 'Desactivar',
                icon: <UserX className="h-4 w-4" />,
                onClick: () => handleToggleActive(emp.id, emp.name, emp.is_active),
                tone: 'danger',
            }
            : {
                label: 'Activar',
                icon: <UserCheck className="h-4 w-4" />,
                onClick: () => handleToggleActive(emp.id, emp.name, emp.is_active),
                tone: 'success',
            },
    ];

    const renderActions = (emp: Employee, full = false) => (
        <div className={`flex items-center gap-2 ${full ? '' : 'justify-end'}`}>
            {emp.is_locked && (
                <Button
                    variant="outline"
                    className={`h-9 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-800 dark:hover:bg-amber-950/30 ${full ? 'h-10 flex-1' : ''}`}
                    onClick={() => handleUnlock(emp.id, emp.name)}
                >
                    <LockOpen className="mr-1 h-4 w-4" /> Desbloquear
                </Button>
            )}
            <Link href={`/staff/${emp.id}`} className={full ? 'flex-1' : ''}>
                <Button variant="outline" className={`${full ? 'h-10 w-full' : 'h-9'}`}>
                    Gestionar
                </Button>
            </Link>
            <RowMenu items={menuItems(emp)} large={full} />
        </div>
    );

    return (
        <>
            <Head title="Gestión de Personal" />

            <div className="mx-auto max-w-7xl space-y-6 p-4 pb-12 sm:p-6 lg:p-8">
                {/* Encabezado */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="shrink-0 rounded-lg bg-rose-100 p-2 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                            <Users className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl">
                                Personal de la Funeraria
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground md:text-base">
                                Estado de disponibilidad y roles del equipo
                            </p>
                        </div>
                    </div>
                    <Link href="/staff/create" className="w-full sm:w-auto">
                        <Button className="h-10 w-full bg-rose-800 text-white shadow-md hover:bg-rose-900 sm:w-auto">
                            <Plus className="mr-1 h-4 w-4" /> Nuevo Usuario
                        </Button>
                    </Link>
                </div>

                {/* Chips de estado + resumen */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1.5 dark:bg-slate-900" role="tablist">
                        {chips.map((chip) => {
                            const active = filter === chip.key;
                            return (
                                <button
                                    key={chip.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setFilter(chip.key)}
                                    className={`flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                                        active
                                            ? 'bg-rose-800 text-white shadow-sm'
                                            : 'text-muted-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {chip.dot && <span className={`h-2 w-2 rounded-full ${chip.dot}`} />}
                                    {chip.label}
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                            active ? 'bg-white/20 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                        }`}
                                    >
                                        {chip.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-baseline justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 dark:border-emerald-900 dark:bg-emerald-950/30">
                        <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Disponibles hoy</span>
                        <span className="text-lg font-bold text-emerald-800 dark:text-emerald-400">
                            {counts.available} de {counts.all}
                        </span>
                    </div>
                </div>

                {/* Búsqueda (filtra en el navegador) */}
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/40">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre o email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-10 bg-white pl-9 dark:bg-slate-950"
                        />
                    </div>
                </div>

                {/* ───────── TARJETAS (móvil y tablet) ───────── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
                    {visible.length === 0 ? (
                        <div className="rounded-xl border bg-card py-10 text-center text-muted-foreground sm:col-span-2">
                            <Users className="mx-auto mb-2 h-12 w-12 text-slate-300" />
                            No hay personal para mostrar
                        </div>
                    ) : (
                        visible.map((emp) => (
                            <div
                                key={emp.id}
                                className={`flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm ${emp.is_active ? '' : 'opacity-60'}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        {renderAvatar(emp)}
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold">{emp.name}</p>
                                            <p className="break-all text-xs text-muted-foreground">{emp.email}</p>
                                        </div>
                                    </div>
                                    {renderStatus(emp)}
                                </div>

                                {(renderAbsence(emp) || emp.is_locked) && (
                                    <div className="space-y-2">
                                        {renderAbsence(emp)}
                                        {renderLockBadge(emp)}
                                    </div>
                                )}

                                <div className="space-y-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                                    {renderRoles(emp)}
                                    {renderVacations(emp)}
                                </div>

                                <div className="mt-auto border-t pt-4">{renderActions(emp, true)}</div>
                            </div>
                        ))
                    )}
                </div>

                {/* ───────── TABLA (escritorio) ───────── */}
                <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-sm lg:block">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/40">
                            <TableRow>
                                <TableHead className="h-12 px-5">Empleado</TableHead>
                                <TableHead className="h-12 px-5">Rol en el Sistema</TableHead>
                                <TableHead className="h-12 px-5">Estado</TableHead>
                                <TableHead className="h-12 px-5">Vacaciones</TableHead>
                                <TableHead className="h-12 px-5 text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visible.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                                        <Users className="mx-auto mb-2 h-12 w-12 text-slate-300" />
                                        No hay personal para mostrar
                                    </TableCell>
                                </TableRow>
                            ) : (
                                visible.map((emp) => (
                                    <TableRow key={emp.id} className={emp.is_active ? 'hover:bg-slate-50 dark:hover:bg-slate-900/30' : 'bg-slate-50/50 opacity-60'}>
                                        <TableCell className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {renderAvatar(emp)}
                                                <div className="min-w-0">
                                                    <p className="font-medium">{emp.name}</p>
                                                    <p className="text-xs text-muted-foreground">{emp.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">{renderRoles(emp)}</TableCell>
                                        <TableCell className="px-5 py-4">
                                            <div className="flex flex-col items-start gap-1.5">
                                                {renderStatus(emp)}
                                                {renderAbsence(emp)}
                                                {renderLockBadge(emp)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">{renderVacations(emp)}</TableCell>
                                        <TableCell className="whitespace-nowrap px-5 py-4">{renderActions(emp)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}