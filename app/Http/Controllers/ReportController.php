<?php

namespace App\Http\Controllers;

use App\Exports\DonationsExport;
use App\Exports\PaymentsExport;
use App\Exports\ServicesExport;
use App\Models\Client;
use App\Models\Donation;
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
     *
     * Cada fila de inventory_items es una unidad física (no hay columna stock),
     * por lo que el valor del inventario es la suma de los precios de cada ítem.
     */
    public function inventoryPdf()
    {
        $items = InventoryItem::orderBy('category')->orderBy('name')->get();

        // Total valorizado del inventario
        $totalValue = $items->sum(fn ($i) => (float) $i->price);

        // Totales por categoría para el resumen del PDF
        $totalAtaudes = $items->where('category', 'ataud')->sum(fn ($i) => (float) $i->price);
        $totalUrnas = $items->where('category', 'urna')->sum(fn ($i) => (float) $i->price);

        $pdf = Pdf::loadView('pdfs.reports.inventory', [
            'items' => $items,
            'totalValue' => $totalValue,
            'totalAtaudes' => $totalAtaudes,
            'totalUrnas' => $totalUrnas,
            'generatedAt' => now(),
        ])
            ->setPaper('a4', 'portrait');

        return $pdf->download('reporte-inventario-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Exportar Donaciones a Excel
     */
    public function donationsExcel(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        return Excel::download(
            new DonationsExport($startDate, $endDate),
            'Reporte_Donaciones_' . now()->format('d-m-Y') . '.xlsx'
        );
    }

    /**
     * Exportar Donaciones a PDF
     *
     * Acepta filtros opcionales por fecha (start_date / end_date):
     *   - Ambos presentes: rango entre ambas fechas (inclusivo).
     *   - Solo start_date: desde esa fecha en adelante.
     *   - Solo end_date:   hasta esa fecha.
     *   - Ninguno:         histórico completo.
     *
     * Los totales se calculan solo sobre las donaciones cuyo `type` es
     * 'dinero' (comparación insensible a mayúsculas y espacios), para no
     * sumar aportes en especie (que no tienen monto monetario).
     *
     * La vista `pdfs.reports.donations` recibe:
     *   - $donations: colección de donaciones filtradas.
     *   - $totalDinero: suma de montos en dinero.
     *   - $startDate: fecha inicial del filtro (o null).
     *   - $endDate: fecha final del filtro (o null).
     */
    public function donationsPdf(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query = Donation::with('creator:id,name');

        // ─────────────────────────────────────────────────────────────
        // Filtro de fechas: soporta rango, solo inicio o solo fin.
        // Antes solo se filtraba si AMBOS estaban presentes, lo que
        // ignoraba filtros parciales (p. ej. "desde enero" sin fecha fin).
        // ─────────────────────────────────────────────────────────────
        if ($startDate && $endDate) {
            $query->whereBetween('donation_date', [$startDate, $endDate]);
        } elseif ($startDate) {
            $query->where('donation_date', '>=', $startDate);
        } elseif ($endDate) {
            $query->where('donation_date', '<=', $endDate);
        }

        $donations = $query->orderBy('donation_date', 'desc')->get();

        // Total de dinero: solo donaciones de tipo 'dinero'
        // (trim + strtolower para tolerar variaciones de mayúsculas/espacios).
        $totalDinero = $donations
            ->filter(fn ($d) => strtolower(trim((string) $d->type)) === 'dinero')
            ->sum(fn ($d) => (float) $d->amount);

        // 👇 Se pasan $startDate y $endDate explícitamente a la vista
        $pdf = Pdf::loadView('pdfs.reports.donations', compact('donations', 'totalDinero', 'startDate', 'endDate'));

        return $pdf->download('Reporte_Donaciones_' . now()->format('d-m-Y') . '.pdf');
    }
}