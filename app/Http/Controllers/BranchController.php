<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Controlador de Sucursales.
 * 
 * Permite a Renato gestionar las sedes de la funeraria.
 */
class BranchController extends Controller
{
    public function index()
    {
        $branches = Branch::orderBy('name')->get();

        return Inertia::render('Branches/Index', [
            'branches' => $branches,
        ]);
    }

    public function create()
    {
        return Inertia::render('Branches/Create');
    }

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

    public function edit(Branch $branch)
    {
        return Inertia::render('Branches/Edit', [
            'branch' => $branch,
        ]);
    }

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

    public function destroy(Branch $branch)
    {
        // Verificar que no tenga servicios asociados
        if ($branch->services()->count() > 0) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'No se puede eliminar: tiene servicios asociados.',
            ]);
        }

        $branch->delete();

        return redirect()->route('branches.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Sucursal eliminada correctamente.',
            ]);
    }
}