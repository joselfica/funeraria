import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, DollarSign, Package, Download } from 'lucide-react';

interface Props {
    summary: {
        total_services: number;
        total_payments: number;
        total_clients: number;
        total_inventory: number;
    };
}

export default function ReportsIndex({ summary }: Props) {
    const [serviceFrom, setServiceFrom] = useState('');
    const [serviceTo, setServiceTo] = useState('');
    const [serviceStatus, setServiceStatus] = useState('');
    const [paymentFrom, setPaymentFrom] = useState('');
    const [paymentTo, setPaymentTo] = useState('');

    const buildQuery = (params: Record<string, string>) => {
        const q = Object.entries(params).filter(([_, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
        return q ? `?${q}` : '';
    };

    return (
        <AppLayout>
            <Head title="Reportes" />
            <div className="p-6 max-w-6xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Reportes</h1>
                    <p className="text-muted-foreground mt-1">Generá reportes en PDF o Excel para análisis y fiscalización</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Servicios</p><p className="text-2xl font-bold">{summary.total_services}</p></CardContent></Card>
                    <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Pagos</p><p className="text-2xl font-bold">{summary.total_payments}</p></CardContent></Card>
                    <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Clientes</p><p className="text-2xl font-bold">{summary.total_clients}</p></CardContent></Card>
                    <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Items Inv.</p><p className="text-2xl font-bold">{summary.total_inventory}</p></CardContent></Card>
                </div>

                <Card className="mb-4">
                    <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Reporte de Servicios</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                            <div><Label className="text-xs">Desde</Label><Input type="date" value={serviceFrom} onChange={(e) => setServiceFrom(e.target.value)} /></div>
                            <div><Label className="text-xs">Hasta</Label><Input type="date" value={serviceTo} onChange={(e) => setServiceTo(e.target.value)} /></div>
                            <div>
                                <Label className="text-xs">Estado</Label>
                                <select value={serviceStatus} onChange={(e) => setServiceStatus(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                                    <option value="">Todos</option>
                                    <option value="pending">Pendiente</option>
                                    <option value="accepted">Aceptada</option>
                                    <option value="completed">Completada</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => window.open(`/reports/services/pdf${buildQuery({ from: serviceFrom, to: serviceTo, status: serviceStatus })}`, '_blank')}>
                                <Download className="h-4 w-4 mr-2" /> PDF
                            </Button>
                            <Button onClick={() => window.location.href = `/reports/services/excel${buildQuery({ from: serviceFrom, to: serviceTo, status: serviceStatus })}`} variant="outline">
                                <Download className="h-4 w-4 mr-2" /> Excel
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-4">
                    <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-emerald-500" /> Reporte de Ingresos</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <div><Label className="text-xs">Desde</Label><Input type="date" value={paymentFrom} onChange={(e) => setPaymentFrom(e.target.value)} /></div>
                            <div><Label className="text-xs">Hasta</Label><Input type="date" value={paymentTo} onChange={(e) => setPaymentTo(e.target.value)} /></div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => window.open(`/reports/payments/pdf${buildQuery({ from: paymentFrom, to: paymentTo })}`, '_blank')}>
                                <Download className="h-4 w-4 mr-2" /> PDF
                            </Button>
                            <Button onClick={() => window.location.href = `/reports/payments/excel${buildQuery({ from: paymentFrom, to: paymentTo })}`} variant="outline">
                                <Download className="h-4 w-4 mr-2" /> Excel
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Reporte de Inventario</CardTitle></CardHeader>
                    <CardContent>
                        <a href="/reports/inventory/pdf" target="_blank" rel="noopener noreferrer">
                            <Button><Download className="h-4 w-4 mr-2" /> Descargar PDF</Button>
                        </a>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}