<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search', '');

        $clients = Client::query()
            ->when($search, fn ($q) => $q->search($search))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Clients/Index', [
            'clients' => $clients,
            'filters' => ['search' => $search],
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
        // Cargar servicios del cliente con sus relaciones
        $services = $client->services()
            ->with(['deceased:id,full_name', 'serviceType:id,name', 'branch:id,name'])
            ->withSum('payments', 'amount')
            ->orderByDesc('scheduled_at')
            ->get()
            ->map(function ($service) {
                $paid = (float) ($service->payments_sum_amount ?? 0);
                $total = (float) $service->total_price;
                $balance = $total - $paid;

                return [
                    'id' => $service->id,
                    'code' => $service->code,
                    'scheduled_at' => $service->scheduled_at->toIso8601String(),
                    'scheduled_date' => $service->scheduled_at->translatedFormat('d M Y'),
                    'status' => $service->status,
                    'status_label' => $service->status_label,
                    'deceased' => $service->deceased?->full_name,
                    'service_type' => $service->serviceType?->name,
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
        // Verificar que no tenga servicios asociados
        if ($client->services()->count() > 0) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'No se puede eliminar: el cliente tiene servicios registrados.',
            ]);
        }

        $client->delete();

        return redirect()->route('clients.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Cliente eliminado.',
            ]);
    }
}