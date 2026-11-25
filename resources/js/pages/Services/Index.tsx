import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Clock, Eye, FileText, Flower2, MoreVertical, Pencil, Plus, Receipt, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Service {
    id: number;
    uuid: string;
    code: string;
    status: string;
    status_label: string;
    scheduled_at: string;
    ends_at: string | null;
    total_price: string;
    total_paid: number;
    balance: number;
    is_fully_paid: boolean;
    driver_name: string | null;
    client: { id: number; name: string; rut: string } | null;
    deceased: { id: number; full_name: string } | null;
    service_type: string;
    service_type_label: string | null;
}

type PaymentFilter = 'all' | 'pending' | 'paid';

interface Props {
    services: {
        data: Service[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        search: string;
        status: string;
        payment_filter?: string;
    };
    counts: { all: number; pending: number; paid: number };
    total_due: number;
}

const formatCLP = (value: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

/**
 * Menú de tres puntos por fila. Se dibuja en un portal con posición fija para
 * que no lo recorte el scroll horizontal de la tabla.
 */
function RowMenu({ service }: { service: Service }) {
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

    const itemClass = 'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800';

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={toggle}
                aria-label="Más acciones"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            >
                <MoreVertical className="h-4 w-4" />
            </button>

            {open &&
                createPortal(
                    <>
                        <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
                        <div
                            className="fixed z-[9999] w-48 rounded-lg border bg-card p-1 shadow-lg"
                            style={{ top: pos.top, right: pos.right }}
                        >
                            <Link href={`/services/${service.uuid}`} className={itemClass}>
                                <Eye className="h-4 w-4" /> Ver detalle
                            </Link>
                            <Link href={`/services/${service.uuid}/edit`} className={itemClass}>
                                <Pencil className="h-4 w-4" /> Editar
                            </Link>
                            <a href={`/services/${service.uuid}/contract`} target="_blank" rel="noopener noreferrer" className={itemClass}>
                                <FileText className="h-4 w-4" /> Contrato (PDF)
                            </a>
                            {service.is_fully_paid && (
                                <a href={`/services/${service.uuid}/paz-y-salvo`} target="_blank" rel="noopener noreferrer" className={itemClass}>
                                    <Receipt className="h-4 w-4" /> Paz y salvo
                                </a>
                            )}
                        </div>
                    </>,
                    document.body,
                )}
        </>
    );
}

export default function ServicesIndex({ services, filters, counts, total_due }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const activeFilter: PaymentFilter =
        filters.payment_filter === 'pending' || filters.payment_filter === 'paid' ? filters.payment_filter : 'all';

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/services', { search, payment_filter: activeFilter }, { preserveState: true });
    };

    const applyPaymentFilter = (key: PaymentFilter) => {
        router.get('/services', { search: filters.search, payment_filter: key }, { preserveState: true, preserveScroll: true });
    };

    const chips: Array<{ key: PaymentFilter; label: string; count: number }> = [
        { key: 'pending', label: 'Con deuda', count: counts.pending },
        { key: 'paid', label: 'Pagados', count: counts.paid },
        { key: 'all', label: 'Todos', count: counts.all },
    ];

    const getDateParts = (date: string) => {
        const d = new Date(date);
        return {
            day: d.getDate(),
            month: d.toLocaleDateString('es-CL', { month: 'short' }).replace('.', ''),
            year: d.getFullYear(),
            time: d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        };
    };

    // ─────────────────────────────────────────────────────────────
    // Cálculo de pago por servicio
    // ─────────────────────────────────────────────────────────────
    // Devuelve:
    //   - total: precio total del servicio
    //   - paid: monto pagado hasta ahora
    //   - percentage: porcentaje pagado (0–100)
    //   - balance: saldo pendiente (total - paid, nunca negativo)
    // ─────────────────────────────────────────────────────────────
    const getPayment = (service: Service) => {
        const total = parseFloat(service.total_price) || 0;
        const paid = Number(service.total_paid) || 0;
        const percentage = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
        const balance = Math.max(total - paid, 0);
        return { total, paid, percentage, balance };
    };

    const getPaymentBar = (p: number) => {
        if (p >= 100) return 'bg-emerald-500';
        if (p >= 90) return 'bg-green-400';
        if (p >= 50) return 'bg-amber-400';
        return 'bg-rose-500';
    };

    const getPaymentText = (p: number) => {
        if (p >= 100) return 'text-emerald-600';
        if (p >= 90) return 'text-green-500';
        if (p >= 50) return 'text-amber-600';
        return 'text-rose-500';
    };

    const renderDate = (service: Service) => {
        const { day, month, year, time } = getDateParts(service.scheduled_at);
        return (
            <div className="flex items-center gap-3">
                {/* Calendario (mismo tamaño y estilo que en Fallecidos) */}
                <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                    <span className="text-xs font-bold uppercase text-rose-800 dark:text-rose-400">{month}</span>
                    <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{day}</span>
                    <span className="text-[10px] text-muted-foreground">{year}</span>
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3 w-3" /> {time}
                </span>
            </div>
        );
    };

    const renderDriver = (service: Service) =>
        service.driver_name ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <UserCheck className="h-3 w-3" /> {service.driver_name}
            </span>
        ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground">
                <UserCheck className="h-3 w-3" /> Sin chofer
            </span>
        );

    // ─────────────────────────────────────────────────────────────
    // Render de la columna de pago (monto, total, barra y % pagado)
    // ─────────────────────────────────────────────────────────────
    const renderPayment = (service: Service) => {
        const { total, percentage, balance } = getPayment(service);
        const paid = percentage >= 100;
        return (
            <div className="flex w-full min-w-[170px] flex-col gap-1.5">
                {/* 1. Monto principal: saldo pendiente o "Pagado" */}
                <div className="flex items-center justify-between gap-2">
                    {paid ? (
                        <span className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" /> Pagado
                        </span>
                    ) : (
                        <span className={`text-base font-bold leading-none ${getPaymentText(percentage)}`}>
                            {formatCLP(balance)}
                        </span>
                    )}
                </div>

                {/* 2. Texto secundario: monto total del servicio */}
                <span className="text-xs text-muted-foreground">Total: {formatCLP(total)}</span>

                {/* 3. Barra de progreso con colores dinámicos (oculta si ya está pagado) */}
                {!paid && (
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                            className={`h-full rounded-full ${getPaymentBar(percentage)}`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                )}

                {/* 4. Porcentaje pagado de forma intuitiva */}
                <div className="flex justify-end">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                        {percentage.toFixed(percentage % 1 === 0 ? 0 : 1)}% pagado
                    </span>
                </div>
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────
    // Acción principal según estado y saldo pendiente
    // ─────────────────────────────────────────────────────────────
    const renderPrimary = (service: Service) => {
        const { balance } = getPayment(service);

        if (service.status === 'pending') {
            return (
                <Link href={`/services/${service.uuid}`}>
                    <Button size="sm" className="h-8 bg-emerald-600 text-white hover:bg-emerald-700">
                        Aprobar
                    </Button>
                </Link>
            );
        }
        if (service.status === 'accepted' && balance > 0.01) {
            return (
                <Link href={`/services/${service.uuid}`}>
                    <Button size="sm" className="h-8 bg-rose-800 text-white hover:bg-rose-900">
                        Cobrar
                    </Button>
                </Link>
            );
        }
        return (
            <Link href={`/services/${service.uuid}`}>
                <Button variant="outline" size="sm" className="h-8">
                    <Eye className="mr-1 h-4 w-4" /> Ver
                </Button>
            </Link>
        );
    };

    const renderActions = (service: Service) => (
        <div className="flex items-center justify-end gap-1">
            {renderPrimary(service)}
            <RowMenu service={service} />
        </div>
    );

    // ─────────────────────────────────────────────────────────────
    // Badge de estado con colores según la etapa del servicio
    // ─────────────────────────────────────────────────────────────
    const getStatusBadge = (service: Service) => {
        const variant =
            service.status === 'accepted' || service.status === 'completed'
                ? 'default'
                : service.status === 'cancelled' || service.status === 'rejected'
                  ? 'destructive'
                  : service.status === 'pending'
                    ? 'secondary'
                    : 'outline';
        return (
            <Badge variant={variant} className="w-fit">
                {service.status_label || 'Sin estado'}
            </Badge>
        );
    };

    return (
        <>
            <Head title="Servicios Funerarios" />

            <div className="mx-auto max-w-7xl p-4 pb-24 md:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="shrink-0 rounded-lg bg-rose-100 p-2 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                            <Flower2 className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 sm:text-2xl md:text-3xl">Servicios Funerarios</h1>
                            <p className="mt-0.5 text-sm text-muted-foreground md:text-base">
                                {services.total} {services.total === 1 ? 'servicio' : 'servicios'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Link href="/services/wizard" className="w-full sm:w-auto">
                            <Button className="w-full bg-rose-800 text-white shadow-md hover:bg-rose-900 sm:w-auto">
                                <Plus className="mr-1 h-4 w-4" /> Nuevo Expediente Completo
                            </Button>
                        </Link>
                        <Link href="/services/create" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:w-auto">
                                Nuevo Servicio (Solo)
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* CHIPS DE PAGO + TOTAL POR COBRAR */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="inline-flex w-full gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900 sm:w-auto" role="tablist">
                        {chips.map((chip) => {
                            const active = activeFilter === chip.key;
                            return (
                                <button
                                    key={chip.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => applyPaymentFilter(chip.key)}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none ${
                                        active ? 'bg-rose-800 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
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

                    {activeFilter !== 'paid' && total_due > 0 && (
                        <div className="flex items-baseline justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 dark:border-rose-900 dark:bg-rose-950/30">
                            <span className="text-xs font-medium text-rose-800 dark:text-rose-300">Por cobrar</span>
                            <span className="text-lg font-bold text-rose-800 dark:text-rose-400">{formatCLP(total_due)}</span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSearch} className="mb-6 flex flex-col gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/40 sm:flex-row">
                    <Input
                        placeholder="Buscar por código, cliente o fallecido..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 sm:max-w-md"
                    />
                    <Button type="submit" variant="secondary" className="w-full sm:w-auto">
                        Buscar
                    </Button>
                </form>

                {/* VISTA MÓVIL */}
                <div className="space-y-3 md:hidden">
                    {services.data.length === 0 ? (
                        <p className="rounded-lg border bg-card py-8 text-center text-muted-foreground">No hay servicios para mostrar</p>
                    ) : (
                        services.data.map((service) => (
                            <div
                                key={service.id}
                                className={`space-y-3 rounded-xl border bg-card p-4 shadow-sm ${service.is_fully_paid ? 'opacity-60' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    {renderDate(service)}
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="font-mono text-xs font-bold">{service.code}</span>
                                        {getStatusBadge(service)}
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-100">{service.client?.name || 'Sin cliente'}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {service.deceased?.full_name || 'Sin fallecido'} · {service.service_type_label || 'Sin tipo'}
                                    </p>
                                </div>
                                <div>{renderDriver(service)}</div>
                                {renderPayment(service)}
                                <div className="border-t pt-3">{renderActions(service)}</div>
                            </div>
                        ))
                    )}
                </div>

                {/* VISTA DESKTOP */}
                <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-sm md:block">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/40">
                            <TableRow>
                                <TableHead>Programado</TableHead>
                                <TableHead>Expediente</TableHead>
                                <TableHead>Servicio y chofer</TableHead>
                                <TableHead className="min-w-[200px]">Pago</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                        No hay servicios para mostrar
                                    </TableCell>
                                </TableRow>
                            ) : (
                                services.data.map((service) => (
                                    <TableRow
                                        key={service.id}
                                        className={`hover:bg-slate-50 dark:hover:bg-slate-900/30 ${service.is_fully_paid ? 'bg-slate-50/50 opacity-60' : ''}`}
                                    >
                                        <TableCell>{renderDate(service)}</TableCell>
                                        <TableCell>
                                            <p className="font-mono text-xs text-muted-foreground">{service.code}</p>
                                            <p className="font-medium">{service.client?.name || 'Sin cliente'}</p>
                                            <p className="text-sm text-muted-foreground">{service.deceased?.full_name || 'Sin fallecido'}</p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="mb-1 text-sm">{service.service_type_label || 'Sin tipo'}</p>
                                            {renderDriver(service)}
                                        </TableCell>
                                        <TableCell>{renderPayment(service)}</TableCell>
                                        <TableCell>{getStatusBadge(service)}</TableCell>
                                        <TableCell className="whitespace-nowrap">{renderActions(service)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {services.last_page > 1 && (
                    <div className="mt-6 flex flex-wrap justify-center gap-1">
                        {services.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`rounded-lg border px-3 py-1 text-sm ${
                                    link.active
                                        ? 'border-rose-800 bg-rose-800 text-white'
                                        : link.url
                                          ? 'hover:bg-slate-100 dark:hover:bg-slate-800'
                                          : 'opacity-50'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Link href="/services/wizard" className="fixed bottom-6 right-6 z-10 md:hidden">
                <Button className="h-14 w-14 rounded-full bg-rose-800 p-0 text-white shadow-lg hover:bg-rose-900">
                    <Plus className="h-6 w-6" />
                </Button>
            </Link>
        </>
    );
}