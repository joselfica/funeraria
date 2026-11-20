<?php

namespace App\Http\Controllers;

use App\Enums\ServiceTypeEnum;
use App\Models\Client;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $status = in_array($request->input('status'), ['active', 'inactive'], true)
            ? $request->input('status')
            : 'all';

        $clients = Client::query()
            ->when($search, fn ($q) => $q->search($search))
            ->when($status === 'active', fn ($q) => $q->where('is_active', true))
            ->when($status === 'inactive', fn ($q) => $q->where('is_active', false))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Clients/Index', [
            'clients' => $clients,
            'filters' => ['search' => $search, 'status' => $status],
            'counts' => [
                'all' => Client::count(),
                'active' => Client::where('is_active', true)->count(),
                'inactive' => Client::where('is_active', false)->count(),
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Clients/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'rut' => 'required|string|max:12|unique:clients,rut',
            'name' => 'required|string|max:150',
            'email' => 'nullable|email|max:150',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        Client::create($validated);

        return redirect()->route('clients.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Cliente creado correctamente.',
            ]);
    }

    public function show(Client $client)
    {
        // Cargar servicios del cliente con sus relaciones.
        // NOTA: 'service_type' es un Enum guardado como string en la tabla services,
        //       no una relación; por eso no se hace eager loading de él.
        $services = $client->services()
            ->with(['deceased:id,full_name', 'branch:id,name'])
            ->withSum('payments', 'amount')
            ->orderByDesc('scheduled_at')
            ->get()
            ->map(function ($service) {
                $paid = (float) ($service->payments_sum_amount ?? 0);
                $total = (float) $service->total_price;
                $balance = $total - $paid;

                // El modelo puede o no castear service_type al Enum; cubrimos ambos casos.
                $serviceType = $service->service_type;
                $serviceTypeLabel = $serviceType instanceof ServiceTypeEnum
                    ? $serviceType->label()
                    : ServiceTypeEnum::from($serviceType)->label();

                return [
                    'id' => $service->id,
                    'code' => $service->code,
                    'scheduled_at' => $service->scheduled_at->toIso8601String(),
                    'scheduled_date' => $service->scheduled_at->translatedFormat('d M Y'),
                    'status' => $service->status,
                    'status_label' => $service->status_label,
                    'deceased' => $service->deceased?->full_name,
                    'service_type' => $serviceTypeLabel,
                    'branch' => $service->branch?->name,
                    'total_price' => $total,
                    'total_paid' => $paid,
                    'balance' => $balance,
                    'is_fully_paid' => $balance <= 0.01,
                ];
            });

        return Inertia::render('Clients/Show', [
            'client' => $client,
            'services' => $services,
            'stats' => [
                'total_services' => $services->count(),
                'total_billed' => $services->sum('total_price'),
                'total_paid' => $services->sum('total_paid'),
                'total_pending' => $services->sum('balance'),
            ],
        ]);
    }

    public function edit(Client $client, Request $request)
    {
        return Inertia::render('Clients/Edit', [
            'client' => $client,
            'redirect_to' => $request->input('from'),
        ]);
    }

    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'rut' => 'required|string|max:12|unique:clients,rut,'.$client->id,
            'name' => 'required|string|max:150',
            'email' => 'nullable|email|max:150',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $client->update($validated);

        // Redirigir según el contexto (solo rutas internas)
        $redirectTo = $request->input('redirect_to');
        if ($redirectTo && str_starts_with($redirectTo, '/') && ! str_starts_with($redirectTo, '//')) {
            return redirect($redirectTo)
                ->with('toast', [
                    'type' => 'success',
                    'message' => 'Cliente actualizado correctamente.',
                ]);
        }

        return redirect()->route('clients.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Cliente actualizado correctamente.',
            ]);
    }

    public function destroy(Client $client)
    {
        // Protección: nunca eliminar clientes desde la UI
        abort(403, 'Por razones de auditoría, los clientes no se pueden eliminar. Solo desactivar.');
    }

    /**
     * Activar o desactivar un cliente.
     * 
     * Los clientes NO se eliminan para preservar el historial de servicios.
     */
    public function toggleActive(Client $client)
    {
        // Verificar que sea Admin o Encargado
        if (! auth()->user()->hasAnyRole(['Administrador', 'Encargado'])) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }

        // Si se está desactivando, verificar que no tenga servicios en curso
        if ($client->is_active) {
            $activeServices = $client->services()
                ->whereIn('status', ['pending', 'in_review', 'accepted', 'in_progress'])
                ->count();

            if ($activeServices > 0) {
                return back()->with('toast', [
                    'type' => 'error',
                    'message' => "No se puede desactivar: el cliente tiene {$activeServices} servicio(s) activo(s).",
                ]);
            }
        }

        $client->update(['is_active' => ! $client->is_active]);

        $action = $client->is_active ? 'activado' : 'desactivado';

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Cliente {$client->name} {$action} correctamente.",
        ]);
    }
}