<?php

namespace App\Http\Controllers;

use App\Exports\PaymentsExport;
use App\Exports\ServicesExport;
use App\Models\Client;
use App\Models\InventoryItem;
use App\Models\Payment;
use App\Models\Service;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Controlador de Reportes (PDF y Excel).
 *
 * Genera reportes consolidados para la administración y la Seremi.
 */
class ReportController extends Controller
{
    /**
     * Página principal con resumen de reportes disponibles.
     */
    public function index()
    {
        return Inertia::render('Reports/Index', [
            'summary' => [
                'total_services' => \App\Models\Service::count(),
                'total_payments' => \App\Models\Payment::count(),
                'total_clients' => \App\Models\Client::count(),
                'total_inventory' => \App\Models\InventoryItem::count(),
            ],
        ]);
    }

    /**
     * Reporte de Servicios en PDF.
     *
     * Nota: ya no se hace eager load de `serviceType` porque la relación
     * fue eliminada del modelo Service (migró a `service_type` enum string).
     * El nombre legible se obtiene con `service_type_label` en la vista.
     */
    public function servicesPdf(Request $request)
    {
        $services = Service::with(['client', 'deceased', 'branch'])
            ->when($request->from, fn ($q) => $q->where('scheduled_at', '>=', $request->from))
            ->when($request->to, fn ($q) => $q->where('scheduled_at', '<=', $request->to))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->orderByDesc('scheduled_at')
            ->get();

        $pdf = Pdf::loadView('pdfs.reports.services', [
            'services' => $services,
            'from' => $request->from,
            'to' => $request->to,
            'status' => $request->status,
            'generatedAt' => now(),
        ])
            ->setPaper('a4', 'portrait');

        return $pdf->download('reporte-servicios-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Reporte de Servicios en Excel.
     */
    public function servicesExcel(Request $request)
    {
        return Excel::download(
            new ServicesExport($request->from, $request->to, $request->status),
            'reporte-servicios-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    /**
     * Reporte de Ingresos en PDF.
     */
    public function paymentsPdf(Request $request)
    {
        $payments = Payment::with(['service.client'])
            ->when($request->from, fn ($q) => $q->where('payment_date', '>=', $request->from))
            ->when($request->to, fn ($q) => $q->where('payment_date', '<=', $request->to))
            ->orderByDesc('payment_date')
            ->get();

        $total = $payments->sum('amount');

        $pdf = Pdf::loadView('pdfs.reports.payments', [
            'payments' => $payments,
            'total' => $total,
            'from' => $request->from,
            'to' => $request->to,
            'generatedAt' => now(),
        ])
            ->setPaper('a4', 'portrait');

        return $pdf->download('reporte-ingresos-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Reporte de Ingresos en Excel.
     */
    public function paymentsExcel(Request $request)
    {
        return Excel::download(
            new PaymentsExport($request->from, $request->to),
            'reporte-ingresos-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    /**
     * Reporte de Inventario en PDF.
     */
    public function inventoryPdf()
    {
        $items = InventoryItem::orderBy('category')->orderBy('name')->get();
        $totalValue = $items->sum(fn ($i) => $i->stock * $i->price);

        $pdf = Pdf::loadView('pdfs.reports.inventory', [
            'items' => $items,
            'totalValue' => $totalValue,
            'generatedAt' => now(),
        ])
            ->setPaper('a4', 'portrait');

        return $pdf->download('reporte-inventario-' . now()->format('Y-m-d') . '.pdf');
    }
}