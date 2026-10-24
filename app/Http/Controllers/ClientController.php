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
        return Inertia::render('Clients/Show', [
            'client' => $client,
        ]);
    }

    public function edit(Client $client)
    {
        return Inertia::render('Clients/Edit', [
            'client' => $client,
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

        return redirect()->route('clients.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Cliente actualizado correctamente.',
            ]);
    }

    public function destroy(Client $client)
    {
        $client->delete();

        return redirect()->route('clients.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Cliente eliminado correctamente.',
            ]);
    }
}
