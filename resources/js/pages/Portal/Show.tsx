import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Download, FileText } from 'lucide-react';

interface Payment {
    id: number;
    receipt_number: string;
    amount: string;
    payment_date: string;
    payment_method_label: string;
}

interface Service {
    id: number;
    uuid: string;
    code: string;
    status: string;
    status_label: string;
    scheduled_at: string;
    total_price: string;
    service_type: { name: string };
    deceased: { full_name: string };
    branch: { name: string } | null;
    payments: Payment[];
}

interface Props {
    service: Service;
}

export default function PortalShow({ service }: Props) {
    const formatPrice = (value: string | number) => 
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })
            .format(typeof value === 'string' ? parseFloat(value) : value);

    const formatDate = (date: string) => 
        new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });

    const totalPaid = service.payments?.reduce((acc: number, p: Payment) => acc + parseFloat(p.amount), 0) || 0;
    const balance = parseFloat(service.total_price) - totalPaid;
    const isFullyPaid = balance <= 0.01;

    return (
        <>
            <Head title={`Detalle ${service.code}`} />

            <div className="min-h-screen bg-muted/10">
                <div className="max-w-4xl mx-auto py-8 px-6">
                    <Link href="/portal">
                        <Button variant="ghost" className="mb-6 -ml-4">
                            <ChevronLeft className="h-4 w-4 mr-2" /> Volver a mis servicios
                        </Button>
                    </Link>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            {service.code}
                            <Badge variant={service.status === 'accepted' ? 'default' : 'secondary'}>
                                {service.status_label}
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            En memoria de: <strong>{service.deceased.full_name}</strong>
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Datos del Servicio</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Tipo</span>
                                    <span className="font-medium">{service.service_type.name}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Fecha de inicio</span>
                                    <span className="font-medium">{formatDate(service.scheduled_at)}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Sucursal</span>
                                    <span className="font-medium">{service.branch?.name || 'No asignada'}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Estado de Pagos</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between text-lg">
                                    <span className="text-muted-foreground">Total</span>
                                    <span className="font-bold">{formatPrice(service.total_price)}</span>
                                </div>
                                <div className="flex justify-between text-lg">
                                    <span className="text-muted-foreground">Pagado</span>
                                    <span className="font-bold text-emerald-500">{formatPrice(totalPaid)}</span>
                                </div>
                                <div className="flex justify-between text-xl border-t pt-2">
                                    <span className="font-bold">Saldo</span>
                                    <span className={`font-bold ${isFullyPaid ? 'text-emerald-500' : 'text-destructive'}`}>
                                        {formatPrice(balance)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" /> Documentos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                <div>
                                    <p className="font-medium">Contrato de Servicio</p>
                                    <p className="text-xs text-muted-foreground">Documento legal del servicio</p>
                                </div>
                                <a href={`/services/${service.uuid}/contract`} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm">
                                        <Download className="h-4 w-4 mr-2" /> Descargar
                                    </Button>
                                </a>
                            </div>

                            {service.payments?.map((p) => (
                                <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">Comprobante: {p.receipt_number}</p>
                                        <p className="text-xs text-muted-foreground">Pagado el {formatDate(p.payment_date)}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold">{formatPrice(p.amount)}</span>
                                        <a href={`/payments/${p.id}/pdf`} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="sm">
                                                <Download className="h-4 w-4 mr-2" /> PDF
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            ))}

                            {isFullyPaid && (
                                <div className="flex items-center justify-between p-3 border border-emerald-500 rounded-lg bg-emerald-500/10">
                                    <div>
                                        <p className="font-medium text-emerald-600">Certificado de Paz y Salvo</p>
                                        <p className="text-xs text-emerald-600/80">Acredita que el servicio está totalmente pagado</p>
                                    </div>
                                    <a href={`/services/${service.uuid}/paz-y-salvo`} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                            <Download className="h-4 w-4 mr-2" /> Descargar
                                        </Button>
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}