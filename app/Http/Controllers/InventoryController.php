<?php

namespace App\Http\Controllers;

use App\Enums\ItemCondition;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function hub()
    {
        $stats = [];

        foreach (['ataud' => 'ataudes', 'urna' => 'urnas'] as $category => $key) {
            $base = fn () => InventoryItem::active()->where('category', $category);

            $stats[$key] = [
                'total' => (int) $base()->count(),
                'disponibles' => (int) $base()
                    ->where('condition', ItemCondition::DISPONIBLE->value)
                    ->count(),
            ];
        }

        return Inertia::render('Inventory/Hub', [
            'stats' => $stats,
        ]);
    }

    public function index(Request $request, ?string $category = null)
    {
        $fromCatalog = $category !== null;

        if ($fromCatalog && ! in_array($category, ['ataud', 'urna'], true)) {
            abort(404);
        }

        $category ??= $request->input('category', '');
        $search = $request->input('search', '');
        $condition = $request->input('condition', '');
        $procedencia = $request->input('procedencia', '');
        $lowStock = $request->boolean('low_stock', false);

        $rawItems = InventoryItem::query()
            ->when($fromCatalog, fn ($q) => $q->active())
            ->when($category, fn ($q) => $q->where('category', $category))
            ->when($search, fn ($q) => $q->search($search))
            ->when($condition, fn ($q) => $q->where('condition', $condition))
            ->when($procedencia, fn ($q) => $q->fromProcedencia($procedencia))
            ->orderBy('category')
            ->orderBy('code')
            ->get();

        $stockByName = InventoryItem::active()
            ->selectRaw('name, COUNT(*) AS total, SUM(CASE WHEN "condition" = ? THEN 1 ELSE 0 END) AS available', [ItemCondition::DISPONIBLE->value])
            ->groupBy('name')
            ->get()
            ->keyBy('name');

        $items = $rawItems
            ->map(function ($item) use ($stockByName) {
                $row = $stockByName->get($item->name);
                $available = (int) ($row?->available ?? 0);
                $threshold = $item->alert_threshold ?? 2;

                return [
                    'id' => $item->id,
                    'uuid' => $item->uuid,
                    'code' => $item->code,
                    'name' => $item->name,
                    'category' => $item->category,
                    'category_label' => $item->category_label,
                    'material' => $item->material,
                    'procedencia' => $item->procedencia,
                    'price' => $item->price,
                    'is_active' => (bool) $item->is_active,
                    'condition' => $item->condition?->value,
                    'condition_label' => $item->condition_label,
                    'condition_color' => $item->condition_color,
                    'available_stock' => $available,
                    'total_stock' => (int) ($row?->total ?? 1),
                    'alert_threshold' => $threshold,
                    'is_low_stock' => $available <= $threshold,
                ];
            })
            ->values();

        if ($lowStock) {
            $items = $items->filter(fn ($item) => $item['is_low_stock'])->values();
        }

        return Inertia::render('Inventory/Index', [
            'items' => [
                'data' => $items,
                'total' => $items->count(),
            ],
            'category' => $category ?: null,
            'filters' => [
                'search' => $search,
                'condition' => $condition,
                'category' => $category,
                'procedencia' => $procedencia,
                'low_stock' => $lowStock,
            ],
            'conditions' => collect(ItemCondition::cases())->map(fn ($c) => [
                'value' => $c->value,
                'label' => $c->label(),
                'color' => $c->color(),
            ]),
        ]);
    }

    public function create(?string $category = null)
    {
        return Inertia::render('Inventory/Create', [
            'category' => in_array($category, ['ataud', 'urna'], true) ? $category : null,
            'conditions' => collect(ItemCondition::manualOptions())->map(fn ($c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|in:ataud,urna',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'material' => 'nullable|string|max:100',
            'procedencia' => 'required|string|in:Talca,Santiago',
            'dimensions' => 'nullable|string|max:100',
            'size_cm' => 'nullable|integer|min:1|max:200',
            'price' => 'required|numeric|min:0',
            'alert_threshold' => 'required|integer|min:1',
            'is_active' => 'boolean',
            'condition' => ['required', Rule::enum(ItemCondition::class)],
        ]);

        $item = InventoryItem::create([
            'category' => $validated['category'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'material' => $validated['material'] ?? null,
            'procedencia' => $validated['procedencia'],
            'dimensions' => $validated['dimensions'] ?? null,
            'size_cm' => $validated['size_cm'] ?? null,
            'price' => $validated['price'],
            'condition' => ItemCondition::from($validated['condition']),
            'alert_threshold' => $validated['alert_threshold'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('inventory.index', $validated['category'])
            ->with('toast', [
                'type' => 'success',
                'message' => "Se agregó {$item->name} con el código {$item->code}.",
            ]);
    }

    public function show(InventoryItem $inventory)
    {
        return Inertia::render('Inventory/Show', [
            'item' => [
                'id' => $inventory->id,
                'uuid' => $inventory->uuid,
                'category' => $inventory->category,
                'category_label' => $inventory->category_label,
                'code' => $inventory->code,
                'name' => $inventory->name,
                'description' => $inventory->description,
                'material' => $inventory->material,
                'procedencia' => $inventory->procedencia,
                'dimensions' => $inventory->dimensions,
                'size_cm' => $inventory->size_cm,
                'price' => $inventory->price,
                'alert_threshold' => $inventory->alert_threshold ?? 2,
                'is_active' => (bool) $inventory->is_active,
                'is_seremi_required' => (bool) ($inventory->is_seremi_required ?? false),
                'condition' => $inventory->condition?->value,
                'condition_label' => $inventory->condition_label,
                'condition_color' => $inventory->condition_color,
                'reserved_until' => $inventory->reserved_until?->toIso8601String(),
                'reserved_note' => $inventory->reserved_note,
                'service_id' => $inventory->service_id,
            ],
            'conditions' => collect(ItemCondition::cases())->map(fn ($c) => [
                'value' => $c->value,
                'label' => $c->label(),
                'color' => $c->color(),
            ])->values(),
        ]);
    }

    public function edit(InventoryItem $inventory)
    {
        return Inertia::render('Inventory/Edit', [
            'item' => $inventory,
            'conditions' => collect(ItemCondition::cases())->map(fn ($c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ]),
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
            'procedencia' => 'required|string|in:Talca,Santiago',
            'dimensions' => 'nullable|string|max:100',
            'size_cm' => 'nullable|integer|min:1|max:200',
            'price' => 'required|numeric|min:0',
            'alert_threshold' => 'required|integer|min:1',
            'is_active' => 'boolean',
            'condition' => ['required', Rule::enum(ItemCondition::class)],
        ]);

        $inventory->update($validated);

        return redirect()->route('inventory.index', $inventory->category)
            ->with('toast', [
                'type' => 'success',
                'message' => 'Item actualizado correctamente.',
            ]);
    }

    public function updateCondition(Request $request, InventoryItem $inventory)
    {
        $validated = $request->validate([
            'condition' => ['required', Rule::enum(ItemCondition::class)],
            'reserved_until' => 'nullable|date|after:now',
            'reserved_note' => 'nullable|string|max:255',
        ]);

        $isReserved = $validated['condition'] === ItemCondition::RESERVADO->value;

        $inventory->update([
            'condition' => $validated['condition'],
            'reserved_until' => $isReserved ? ($validated['reserved_until'] ?? null) : null,
            'reserved_note' => $isReserved ? ($validated['reserved_note'] ?? null) : null,
        ]);

        $message = $isReserved && $inventory->reserved_until
            ? "Item reservado hasta {$inventory->reserved_until->format('d/m/Y H:i')}."
            : 'Estado actualizado correctamente.';

        return back()->with('toast', [
            'type' => 'success',
            'message' => $message,
        ]);
    }

    public function destroy(InventoryItem $inventory)
    {
        $category = $inventory->category;
        $inventory->delete();

        return redirect()->route('inventory.index', $category)
            ->with('toast', [
                'type' => 'success',
                'message' => 'Item eliminado correctamente.',
            ]);
    }
}