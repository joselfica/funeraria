<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Service;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * Controlador de pagos/abonos.
 *
 * Permite registrar pagos parciales de un servicio y generar
 * comprobantes en PDF que se almacenan en storage.
 */
class PaymentController extends Controller
{
    /**
     * Registra un nuevo pago para un servicio.
     *
     * Endpoint: POST /services/{service}/payments
     *
     * Flujo:
     * 1. Valida los datos del pago
     * 2. Crea el registro
     * 3. Genera el comprobante PDF
     * 4. Redirige al detalle del servicio
     */
    public function store(Request $request, Service $service)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1|max:' . $service->balance,
            'payment_method' => 'required|in:efectivo,transferencia,tarjeta_credito,tarjeta_debito,cheque,convenio',
            'reference' => 'nullable|string|max:100',
            'payment_date' => 'required|date|before_or_equal:today',
            'notes' => 'nullable|string|max:500',
        ]);

        // Forzar tipos (vienen como strings del frontend)
        $validated['amount'] = (float) $validated['amount'];
        $validated['service_id'] = $service->id;
        $validated['registered_by'] = auth()->id();

        // Crear pago
        $payment = Payment::create($validated);

        // Generar comprobante PDF
        $this->generateReceiptPdf($payment);

        return redirect()->route('services.show', $service->id)
            ->with('toast', [
                'type' => 'success',
                'message' => "Pago registrado. Comprobante: {$payment->receipt_number}",
            ]);
    }

    /**
     * Descarga el comprobante PDF de un pago.
     *
     * Endpoint: GET /payments/{payment}/pdf
     */
    public function downloadPdf(Payment $payment)
    {
        // Si no existe el PDF, generarlo
        if (! $payment->receipt_path || ! Storage::exists($payment->receipt_path)) {
            $this->generateReceiptPdf($payment);
            $payment->refresh();
        }

        return Storage::download(
            $payment->receipt_path,
            "comprobante-{$payment->receipt_number}.pdf"
        );
    }

    /**
     * Elimina un pago (soft delete).
     *
     * Endpoint: DELETE /payments/{payment}
     *
     * Solo se permite a Administrador.
     */
    public function destroy(Payment $payment)
    {
        if (! auth()->user()->hasRole('Administrador')) {
            abort(403, 'Solo el Administrador puede eliminar pagos.');
        }

        $payment->delete();

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Pago eliminado.',
        ]);
    }

    /**
     * Genera el PDF del comprobante y lo guarda en storage.
     *
     * El PDF se guarda en: storage/app/receipts/{uuid}.pdf
     * La ruta se persiste en payment.receipt_path para acceso posterior.
     *
     * @param Payment $payment Pago para el que generar comprobante
     */
    public function generateReceiptPdf(Payment $payment): void
    {
        // Cargar relaciones necesarias para el PDF
        $payment->load(['service.client', 'service.deceased', 'service.serviceType']);

        // Generar PDF desde vista Blade
        $pdf = Pdf::loadView('pdfs.receipt', [
            'payment' => $payment,
            'service' => $payment->service,
        ]);

        // Guardar en storage
        $path = "receipts/{$payment->uuid}.pdf";
        Storage::put($path, $pdf->output());

        // Actualizar path en BD
        $payment->update(['receipt_path' => $path]);
    }
}