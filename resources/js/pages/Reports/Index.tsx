import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
    FileText, DollarSign, Package, FileSpreadsheet, FileDown, Users 
} from 'lucide-react';

interface Props {
    summary?: {
        total_services: number;
        total_payments: number;
        total_clients: number;
        total_inventory: number;
    };
}

export default function ReportsIndex({ summary }: Props) {
    // 🛡️ BLINDAJE: Si summary llega undefined, usamos valores por defecto
    const safeSummary = summary || {
        total_services: 0,
        total_payments: 0,
        total_clients: 0,
        total_inventory: 0,
    };

    // Estados para los filtros
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
            
            <div className="p-6 max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" /> Centro de Reportes
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Generá documentos en PDF o Excel para análisis, fiscalización y respaldo de la operación.
                    </p>
                </div>

                {/* TARJETAS DE RESUMEN (KPIs) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-primary/5 border-primary/20 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-primary/20 rounded-lg text-primary">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Servicios</p>
                                <p className="text-2xl font-bold">{safeSummary.total_services}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-500">
                                <DollarSign className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pagos</p>
                                <p className="text-2xl font-bold">{safeSummary.total_payments}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-500/5 border-blue-500/20 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-500">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Clientes</p>
                                <p className="text-2xl font-bold">{safeSummary.total_clients}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-amber-500/5 border-amber-500/20 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-amber-500/20 rounded-lg text-amber-500">
                                <Package className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Items Inv.</p>
                                <p className="text-2xl font-bold">{safeSummary.total_inventory}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* GRID DE REPORTES */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* REPORTE DE SERVICIOS */}
                    <Card className="flex flex-col border-t-4 border-t-primary">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" /> Servicios
                            </CardTitle>
                            <CardDescription>
                                Listado de expedientes, fechas, montos y estados.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-1">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Desde</Label>
                                    <Input type="date" value={serviceFrom} onChange={(e) => setServiceFrom(e.target.value)} className="h-8 text-sm" />
                                </div>
                                <div>
                                    <Label className="text-xs">Hasta</Label>
                                    <Input type="date" value={serviceTo} onChange={(e) => setServiceTo(e.target.value)} className="h-8 text-sm" />
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs">Estado</Label>
                                <select 
                                    value={serviceStatus} 
                                    onChange={(e) => setServiceStatus(e.target.value)} 
                                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="pending">Pendiente</option>
                                    <option value="accepted">Aceptada</option>
                                    <option value="completed">Completada</option>
                                </select>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2 pt-4 border-t">
                            <Button 
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white" 
                                size="sm"
                                onClick={() => window.open(`/reports/services/pdf${buildQuery({ from: serviceFrom, to: serviceTo, status: serviceStatus })}`, '_blank')}
                            >
                                <FileDown className="h-4 w-4 mr-2" /> PDF
                            </Button>
                            <Button 
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" 
                                size="sm"
                                onClick={() => window.location.href = `/reports/services/excel${buildQuery({ from: serviceFrom, to: serviceTo, status: serviceStatus })}`}
                            >
                                <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* REPORTE DE INGRESOS */}
                    <Card className="flex flex-col border-t-4 border-t-emerald-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-emerald-500" /> Ingresos
                            </CardTitle>
                            <CardDescription>
                                Detalle de todos los abonos y pagos recibidos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-1">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Desde</Label>
                                    <Input type="date" value={paymentFrom} onChange={(e) => setPaymentFrom(e.target.value)} className="h-8 text-sm" />
                                </div>
                                <div>
                                    <Label className="text-xs">Hasta</Label>
                                    <Input type="date" value={paymentTo} onChange={(e) => setPaymentTo(e.target.value)} className="h-8 text-sm" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2 pt-4 border-t">
                            <Button 
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white" 
                                size="sm"
                                onClick={() => window.open(`/reports/payments/pdf${buildQuery({ from: paymentFrom, to: paymentTo })}`, '_blank')}
                            >
                                <FileDown className="h-4 w-4 mr-2" /> PDF
                            </Button>
                            <Button 
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" 
                                size="sm"
                                onClick={() => window.location.href = `/reports/payments/excel${buildQuery({ from: paymentFrom, to: paymentTo })}`}
                            >
                                <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* REPORTE DE INVENTARIO */}
                    <Card className="flex flex-col border-t-4 border-t-amber-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-amber-500" /> Inventario
                            </CardTitle>
                            <CardDescription>
                                Stock actual de ataúdes, urnas y valorización.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-1 flex items-center justify-center text-muted-foreground text-sm text-center">
                            <p>Este reporte genera un documento con todos los productos en bodega y su valor total actual.</p>
                        </CardContent>
                        <CardFooter className="pt-4 border-t">
                            <Button 
                                className="w-full bg-red-600 hover:bg-red-700 text-white" 
                                size="sm"
                                onClick={() => window.open(`/reports/inventory/pdf`, '_blank')}
                            >
                                <FileDown className="h-4 w-4 mr-2" /> Descargar PDF
                            </Button>
                        </CardFooter>
                    </Card>

                </div>
            </div>
        </AppLayout>
    );
}