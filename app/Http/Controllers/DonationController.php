<?php

namespace App\Http\Controllers;

use App\Models\Donation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * Controlador de Donaciones.
 *
 * Permite listar, ver el detalle, registrar, editar y eliminar
 * los aportes (en dinero o en especie) que recibe la funeraria.
 */
class DonationController extends Controller
{
    /**
     * Listado de donaciones.
     */
    public function index()
    {
        $donations = Donation::with('creator:id,name')
            ->latest('donation_date')
            ->get();

        return Inertia::render('Donations/Index', [
            'donations' => $donations,
        ]);
    }

    /**
     * Detalle de una donación.
     */
    public function show(Donation $donation)
    {
        $donation->load('creator:id,name');

        return Inertia::render('Donations/Show', [
            'donation' => $donation,
        ]);
    }

    /**
     * Registrar una nueva donación.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'beneficiary_name' => 'required|string|max:255',
            'beneficiary_rut' => 'nullable|string|max:20',
            'contact_person' => 'nullable|string|max:255',
            'type' => 'required|in:dinero,especie',
            'amount' => 'required_if:type,dinero|nullable|numeric|min:0',
            'description' => 'required_if:type,especie|nullable|string|max:255',
            'donation_date' => 'required|date',
            'receipt' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'notes' => 'nullable|string',
        ]);

        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $receiptPath = $request->file('receipt')->store('donations', 'local');
        }

        Donation::create([
            'beneficiary_name' => $validated['beneficiary_name'],
            'beneficiary_rut' => $validated['beneficiary_rut'] ?? null,
            'contact_person' => $validated['contact_person'] ?? null,
            'type' => $validated['type'],
            'amount' => $validated['type'] === 'dinero' ? $validated['amount'] : null,
            'description' => $validated['type'] === 'especie' ? $validated['description'] : null,
            'donation_date' => $validated['donation_date'],
            'receipt_path' => $receiptPath,
            'notes' => $validated['notes'] ?? null,
            'created_by' => auth()->id(),
        ]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Donación registrada correctamente.',
        ]);
    }

    /**
     * Actualizar una donación existente.
     *
     * Reemplaza el comprobante solo si se sube uno nuevo.
     * Si el tipo cambia, se limpia el campo que ya no aplica.
     */
    public function update(Request $request, Donation $donation)
    {
        $validated = $request->validate([
            'beneficiary_name' => 'required|string|max:255',
            'beneficiary_rut' => 'nullable|string|max:20',
            'contact_person' => 'nullable|string|max:255',
            'type' => 'required|in:dinero,especie',
            'amount' => 'required_if:type,dinero|nullable|numeric|min:0',
            'description' => 'required_if:type,especie|nullable|string|max:255',
            'donation_date' => 'required|date',
            'receipt' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'notes' => 'nullable|string',
        ]);

        $receiptPath = $donation->receipt_path;

        if ($request->hasFile('receipt')) {
            // Borrar el comprobante anterior si existía
            if ($donation->receipt_path && Storage::disk('local')->exists($donation->receipt_path)) {
                Storage::disk('local')->delete($donation->receipt_path);
            }
            $receiptPath = $request->file('receipt')->store('donations', 'local');
        }

        $donation->update([
            'beneficiary_name' => $validated['beneficiary_name'],
            'beneficiary_rut' => $validated['beneficiary_rut'] ?? null,
            'contact_person' => $validated['contact_person'] ?? null,
            'type' => $validated['type'],
            'amount' => $validated['type'] === 'dinero' ? $validated['amount'] : null,
            'description' => $validated['type'] === 'especie' ? $validated['description'] : null,
            'donation_date' => $validated['donation_date'],
            'receipt_path' => $receiptPath,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('donations.show', $donation)
            ->with('toast', [
                'type' => 'success',
                'message' => 'Donación actualizada correctamente.',
            ]);
    }

    /**
     * Eliminar (soft delete) una donación.
     */
    public function destroy(Donation $donation)
    {
        $donation->delete();

        return redirect()->route('donations.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Donación eliminada correctamente.',
            ]);
    }

    /**
     * Descargar el comprobante (protegido, no público).
     */
    public function downloadReceipt(Donation $donation)
    {
        if (! $donation->receipt_path || ! Storage::disk('local')->exists($donation->receipt_path)) {
            abort(404, 'Comprobante no encontrado.');
        }

        return Storage::disk('local')->download($donation->receipt_path);
    }
}