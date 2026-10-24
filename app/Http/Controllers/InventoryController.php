<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $category = $request->input('category', '');
        $lowStock = $request->boolean('low_stock', false);

        $items = InventoryItem::query()
            ->when($search, fn ($q) => $q->search($search))
            ->when($category, fn ($q) => $q->where('category', $category))
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
                'low_stock' => $lowStock,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Inventory/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|in:ataud,urna',
            'code' => 'required|string|max:50|unique:inventory_items,code',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'material' => 'nullable|string|max:100',
            'dimensions' => 'nullable|string|max:100',
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

    public function show(InventoryItem $inventory)
    {
        return Inertia::render('Inventory/Show', [
            'item' => $inventory,
        ]);
    }

    public function edit(InventoryItem $inventory)
    {
        return Inertia::render('Inventory/Edit', [
            'item' => $inventory,
        ]);
    }

    public function update(Request $request, InventoryItem $inventory)
    {
        $validated = $request->validate([
            'category' => 'required|in:ataud,urna',
            'code' => 'required|string|max:50|unique:inventory_items,code,' . $inventory->id,
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'material' => 'nullable|string|max:100',
            'dimensions' => 'nullable|string|max:100',
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