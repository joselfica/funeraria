<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Controlador de Sucursales.
 * 
 * Permite gestionar las sedes de la funeraria.
 * Las sucursales no se eliminan físicamente por motivos de auditoría:
 * solo se activan o desactivan.
 */
class BranchController extends Controller
{
    /**
     * Muestra el listado de todas las sucursales registradas.
     */
    public function index()
    {
        $branches = Branch::orderBy('name')->get();

        return Inertia::render('Branches/Index', [
            'branches' => $branches,
        ]);
    }

    /**
     * Muestra el formulario para crear una nueva sucursal.
     */
    public function create()
    {
        return Inertia::render('Branches/Create');
    }

    /**
     * Almacena una nueva sucursal en la base de datos.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:20|unique:branches,code',
            'address' => 'required|string|max:200',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:150',
            'is_active' => 'boolean',
        ]);

        Branch::create($validated);

        return redirect()->route('branches.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Sucursal creada correctamente.',
            ]);
    }

    /**
     * Muestra el formulario para editar una sucursal existente.
     */
    public function edit(Branch $branch)
    {
        return Inertia::render('Branches/Edit', [
            'branch' => $branch,
        ]);
    }

    /**
     * Actualiza los datos de una sucursal existente.
     */
    public function update(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:20|unique:branches,code,' . $branch->id,
            'address' => 'required|string|max:200',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:150',
            'is_active' => 'boolean',
        ]);

        $branch->update($validated);

        return redirect()->route('branches.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Sucursal actualizada correctamente.',
            ]);
    }

    /**
     * Activa o desactiva una sucursal según su estado actual.
     * 
     * Se utiliza en lugar de eliminar para preservar el historial
     * de servicios y mantener la integridad de los datos.
     */
    public function toggleActive(Branch $branch)
    {
        // Invierte el estado actual: activa -> inactiva, inactiva -> activa
        $branch->update(['is_active' => !$branch->is_active]);

        return redirect()->route('branches.index')
            ->with('toast', [
                'type' => 'success',
                'message' => $branch->is_active
                    ? 'Sucursal activada correctamente.'
                    : 'Sucursal desactivada correctamente.',
            ]);
    }
}