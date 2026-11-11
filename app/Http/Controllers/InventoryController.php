<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryController extends Controller
{
    /**
     * Muestra el listado de inventario con filtros aplicables.
     *
     * Filtros soportados:
     * - search: búsqueda por código, nombre o material.
     * - category: filtra por categoría (ataud | urna).
     * - low_stock: filtra solo items con stock bajo.
     * - procedencia: filtra por ciudad de origen (Talca | Santiago).
     */
    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $category = $request->input('category', '');
        $procedencia = $request->input('procedencia', '');
        $lowStock = $request->boolean('low_stock', false);

        $items = InventoryItem::query()
            ->when($search, fn ($q) => $q->search($search))
            ->when($category, fn ($q) => $q->where('category', $category))
            ->when($procedencia, fn ($q) => $q->fromProcedencia($procedencia))
            ->when($lowStock, fn ($q) => $q->lowStock())
            ->orderBy('category')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Inventory/Index', [
            'items' => $items,
            'filters' => [
                'search' => $search,
                'category' => $category,
                'procedencia' => $procedencia,
                'low_stock' => $lowStock,
            ],
        ]);
    }

    /**
     * Muestra el formulario para crear un nuevo item de inventario.
     */
    public function create()
    {
        return Inertia::render('Inventory/Create');
    }

    /**
     * Almacena un nuevo item de inventario en la base de datos.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|in:ataud,urna',
            'code' => 'required|string|max:50|unique:inventory_items,code',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'material' => 'nullable|string|max:100',
            'procedencia' => 'required|string|in:Talca,Santiago',
            'dimensions' => 'nullable|string|max:100',
            'size_cm' => 'nullable|integer|min:1|max:200',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'stock_minimum' => 'required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        InventoryItem::create($validated);

        return redirect()->route('inventory.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Item creado correctamente.',
            ]);
    }

    /**
     * Muestra el detalle de un item específico.
     */
    public function show(InventoryItem $inventory)
    {
        return Inertia::render('Inventory/Show', [
            'item' => $inventory,
        ]);
    }

    /**
     * Muestra el formulario para editar un item existente.
     */
    public function edit(InventoryItem $inventory)
    {
        return Inertia::render('Inventory/Edit', [
            'item' => $inventory,
        ]);
    }

    /**
     * Actualiza un item existente en la base de datos.
     */
    public function update(Request $request, InventoryItem $inventory)
    {
        $validated = $request->validate([
            'category' => 'required|in:ataud,urna',
            'code' => 'required|string|max:50|unique:inventory_items,code,' . $inventory->id,
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'material' => 'nullable|string|max:100',
            'procedencia' => 'required|string|in:Talca,Santiago',
            'dimensions' => 'nullable|string|max:100',
            'size_cm' => 'nullable|integer|min:1|max:200',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'stock_minimum' => 'required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $inventory->update($validated);

        return redirect()->route('inventory.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Item actualizado correctamente.',
            ]);
    }

    /**
     * Elimina (soft delete) un item del inventario.
     */
    public function destroy(InventoryItem $inventory)
    {
        $inventory->delete();

        return redirect()->route('inventory.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Item eliminado correctamente.',
            ]);
    }
}