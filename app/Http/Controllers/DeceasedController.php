<?php

namespace App\Http\Controllers;

use App\Models\Deceased;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeceasedController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search', '');

        $deceased = Deceased::query()
            ->when($search, fn ($q) => $q->search($search))
            ->orderByDesc('death_date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Deceased/Index', [
            'deceased' => $deceased,
            'filters' => ['search' => $search],
        ]);
    }

    public function create()
    {
        return Inertia::render('Deceased/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:200',
            'rut' => 'nullable|string|max:12|unique:deceased,rut',
            'gender' => 'nullable|in:M,F,otro',
            'birth_date' => 'nullable|date|before:death_date',
            'death_date' => 'required|date|before_or_equal:today',
            'death_time' => 'nullable|date_format:H:i',
            'death_certificate_number' => 'nullable|string|max:50',
            'death_certificate_office' => 'nullable|string|max:150',
            'death_certificate_date' => 'nullable|date',
            'cause_of_death' => 'nullable|string|max:500',
            'death_location' => 'nullable|string|max:200',
            'current_location' => 'nullable|string|max:200',
            'cemetery' => 'nullable|string|max:200',
            'niche_location' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        Deceased::create($validated);

        return redirect()->route('deceased.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Fallecido registrado correctamente.',
            ]);
    }

    public function show(Deceased $deceased)
    {
        // Cargar servicios asociados
        $deceased->load(['services' => function ($q) {
            $q->orderByDesc('scheduled_at')->limit(10);
        }]);

        return Inertia::render('Deceased/Show', [
            'deceased' => $deceased,
        ]);
    }

    public function edit(Deceased $deceased, Request $request)
    {
        return Inertia::render('Deceased/Edit', [
            'deceased' => $deceased,
            'redirect_to' => $request->input('from'),
        ]);
    }

    public function update(Request $request, Deceased $deceased)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:200',
            'rut' => 'nullable|string|max:12|unique:deceased,rut,' . $deceased->id,
            'gender' => 'nullable|in:M,F,otro',
            'birth_date' => 'nullable|date',
            'death_date' => 'required|date',
            'death_time' => 'nullable|date_format:H:i',
            'death_certificate_number' => 'nullable|string|max:50',
            'death_certificate_office' => 'nullable|string|max:150',
            'death_certificate_date' => 'nullable|date',
            'cause_of_death' => 'nullable|string|max:500',
            'death_location' => 'nullable|string|max:200',
            'current_location' => 'nullable|string|max:200',
            'cemetery' => 'nullable|string|max:200',
            'niche_location' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        $deceased->update($validated);

        // Redirigir según el contexto (solo rutas internas)
        $redirectTo = $request->input('redirect_to');
        if ($redirectTo && str_starts_with($redirectTo, '/') && ! str_starts_with($redirectTo, '//')) {
            return redirect($redirectTo)
                ->with('toast', [
                    'type' => 'success',
                    'message' => 'Fallecido actualizado correctamente.',
                ]);
        }

        return redirect()->route('deceased.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Fallecido actualizado correctamente.',
            ]);
    }

    public function destroy(Deceased $deceased)
    {
        // Verificar que no tenga servicios asociados
        if ($deceased->services()->count() > 0) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'No se puede eliminar: tiene servicios asociados.',
            ]);
        }

        $deceased->delete();

        return redirect()->route('deceased.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Fallecido eliminado correctamente.',
            ]);
    }
}