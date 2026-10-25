<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Controlador del Portal del Cliente.
 * 
 * Aquí el cliente (la familia) puede ver sus expedientes.
 * Seguridad: Un cliente solo puede ver SUS PROPIOS servicios.
 */
class PortalController extends Controller
{
    /**
     * Dashboard del cliente. Muestra todos sus servicios.
     */
    public function index(Request $request)
    {
        // Buscamos el perfil de cliente asociado al usuario logueado
        $client = $request->user()->client;

        if (! $client) {
            abort(403, 'No tenés un perfil de cliente asociado.');
        }

        // Traemos los servicios del cliente con sus pagos
        $services = Service::with(['deceased', 'serviceType', 'payments'])
            ->where('client_id', $client->id)
            ->orderByDesc('scheduled_at')
            ->get()
            ->map(function ($service) {
                return [
                    'id' => $service->id,
                    'uuid' => $service->uuid,
                    'code' => $service->code,
                    'status' => $service->status,
                    'status_label' => $service->status_label,
                    'scheduled_at' => $service->scheduled_at,
                    'total_price' => $service->total_price,
                    'total_paid' => (float) $service->payments->sum('amount'),
                    'balance' => (float) $service->total_price - (float) $service->payments->sum('amount'),
                    'is_fully_paid' => $service->balance <= 0.01,
                    'deceased_name' => $service->deceased->full_name,
                    'service_type' => $service->serviceType->name,
                ];
            });

        return Inertia::render('Portal/Index', [
            'client' => [
                'name' => $client->name,
                'rut' => $client->rut,
            ],
            'services' => $services,
        ]);
    }

    /**
     * Detalle de un servicio específico (con verificación de seguridad).
     */
    public function show(Request $request, Service $service)
    {
        $client = $request->user()->client;

        // Verificar que el servicio le pertenezca a este cliente
        if (! $client || $service->client_id !== $client->id) {
            abort(403, 'No tenés permiso para ver este expediente.');
        }

        $service->load(['deceased', 'serviceType', 'payments', 'branch']);

        return Inertia::render('Portal/Show', [
            'service' => $service,
        ]);
    }
}