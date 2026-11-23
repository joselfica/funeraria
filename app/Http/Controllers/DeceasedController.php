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
        $status = $request->input('status', 'all'); // all | active | inactive

        $deceased = Deceased::query()
            ->when($search, fn ($q) => $q->search($search))
            ->when($status === 'active', fn ($q) => $q->where('is_active', true))
            ->when($status === 'inactive', fn ($q) => $q->where('is_active', false))
            ->orderByDesc('death_date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Deceased/Index', [
            'deceased' => $deceased,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'counts' => [
                'all' => Deceased::count(),
                'active' => Deceased::where('is_active', true)->count(),
                'inactive' => Deceased::where('is_active', false)->count(),
            ],
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
            'rut' => 'required|string|max:12|unique:deceased,rut',
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
        $deceased->load(['services' => function ($q) {
            $q->orderByDesc('scheduled_at')->limit(10);
        }]);

        // Normalizar fechas para evitar desfase de zona horaria en el frontend.
        // El frontend recibe "YYYY-MM-DD" en vez de ISO con UTC.
        $deceased->death_date = $deceased->death_date?->format('Y-m-d');
        $deceased->birth_date = $deceased->birth_date?->format('Y-m-d');
        $deceased->death_certificate_date = $deceased->death_certificate_date?->format('Y-m-d');

        return Inertia::render('Deceased/Show', [
            'deceased' => $deceased,
        ]);
    }

    public function edit(Deceased $deceased, Request $request)
    {
        // Solo en la edición se exponen los campos ocultos del modelo (causa de
        // muerte y N° de certificado); en el resto de la app siguen en $hidden.
        $deceased->makeVisible(['cause_of_death', 'death_certificate_number']);

        // Se envía un arreglo (no el modelo) con las fechas como "YYYY-MM-DD".
        // Asignarlas al modelo no sirve: el cast 'date' las vuelve a serializar
        // como ISO con hora y zona, y los <input type="date"> las ven vacías.
        $data = $deceased->toArray();
        $data['death_date'] = $deceased->death_date?->format('Y-m-d');
        $data['birth_date'] = $deceased->birth_date?->format('Y-m-d');
        $data['death_certificate_date'] = $deceased->death_certificate_date?->format('Y-m-d');

        return Inertia::render('Deceased/Edit', [
            'deceased' => $data,
            'redirect_to' => $request->input('from'),
        ]);
    }

    public function update(Request $request, Deceased $deceased)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:200',
            'rut' => 'required|string|max:12|unique:deceased,rut,' . $deceased->id,
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

    /**
     * Los fallecidos NO se eliminan físicamente por razones de auditoría.
     * Solo se pueden desactivar (soft delete lógico vía is_active).
     */
    public function destroy(Deceased $deceased)
    {
        abort(403, 'Por razones de auditoría, los fallecidos no se pueden eliminar. Solo desactivar.');
    }

    /**
     * Activa o desactiva un fallecido.
     */
    public function toggleActive(Deceased $deceased)
    {
        if (! auth()->user()->hasAnyRole(['Administrador', 'Encargado'])) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }

        $deceased->update(['is_active' => ! $deceased->is_active]);

        $action = $deceased->is_active ? 'activado' : 'desactivado';

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Fallecido {$deceased->full_name} {$action} correctamente.",
        ]);
    }
}