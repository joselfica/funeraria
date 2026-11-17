<?php

namespace App\Http\Controllers;

use App\Enums\ItemCondition;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class InventoryController extends Controller
{
    /**
     * Hub de inventario: tarjetas de resumen por categoría (ataúdes / urnas).
     *
     * - total: stock total de items activos de la categoría.
     * - disponibles: stock de items activos en condición `nuevo` o `bueno`.
     */
    public function hub()
    {
        $stats = [];

        foreach (['ataud' => 'ataudes', 'urna' => 'urnas'] as $category => $key) {
            // Cada consulta parte de un builder nuevo y agrupa el OR dentro de
            // un closure, para no perder los filtros de categoría y activo.
            $base = fn () => InventoryItem::active()->where('category', $category);

            $stats[$key] = [
                'total' => (int) $base()->sum('stock'),
                'disponibles' => (int) $base()
                    ->whereIn('condition', ['nuevo', 'bueno'])
                    ->sum('stock'),
            ];
        }

        return Inertia::render('Inventory/Hub', [
            'stats' => $stats,
        ]);
    }

    /**
     * Muestra el listado de inventario con filtros aplicables.
     *
     * Si la ruta trae `{category}` (ataud | urna) funciona como catálogo de esa
     * categoría y solo muestra items activos. Sin categoría, mantiene el listado
     * general anterior.
     *
     * Filtros soportados:
     * - search: búsqueda por código, nombre o material.
     * - condition: filtra por condición física.
     * - category: (solo listado general) filtra por categoría.
     * - low_stock: filtra solo items con stock bajo.
     * - procedencia: filtra por ciudad de origen (Talca | Santiago).
     */
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

        $items = InventoryItem::query()
            ->when($fromCatalog, fn ($q) => $q->active())
            ->when($category, fn ($q) => $q->where('category', $category))
            ->when($search, fn ($q) => $q->search($search)) // agrupa el OR internamente
            ->when($condition, fn ($q) => $q->where('condition', $condition))
            ->when($procedencia, fn ($q) => $q->fromProcedencia($procedencia))
            ->when($lowStock, fn ($q) => $q->lowStock())
            ->orderBy('category')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Inventory/Index', [
            'items' => $items,
            'category' => $category ?: null,
            'filters' => [
                'search' => $search,
                'condition' => $condition,
                'category' => $category,
                'procedencia' => $procedencia,
                'low_stock' => $lowStock,
            ],
            // Opciones para el selector de condición en el listado
            'conditions' => collect(ItemCondition::cases())->map(fn ($c) => [
                'value' => $c->value,
                'label' => $c->label(),
                'color' => $c->color(), // ej. 'bg-emerald-500'
            ]),
        ]);
    }

    /**
     * Muestra el formulario para crear un nuevo item de inventario.
     * La categoría llega por la ruta (inventory/create/{category}) y sirve
     * para preseleccionarla en el formulario.
     */
    public function create(?string $category = null)
    {
        return Inertia::render('Inventory/Create', [
            'category' => in_array($category, ['ataud', 'urna'], true) ? $category : null,
            'conditions' => collect(ItemCondition::cases())->map(fn ($c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ]),
        ]);
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
            'price' => 'required|integer|min:0',
            'stock' => 'required|integer|min:0',
            'stock_minimum' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'condition' => ['required', Rule::enum(ItemCondition::class)],
        ]);

        $item = InventoryItem::create($validated);

        return redirect()->route('inventory.index', $item->category)
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
            'conditions' => collect(ItemCondition::cases())->map(fn ($c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ]),
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
            'price' => 'required|integer|min:0',
            'stock' => 'required|integer|min:0',
            'stock_minimum' => 'required|integer|min:0',
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

    /**
     * Cambia rápidamente la condición física de un item desde el listado.
     *
     * Reglas:
     * - Si la nueva condición es `reservado`, `reserved_until` es obligatorio
     *   y debe ser una fecha futura. Si no se envía, se devuelve un error
     *   controlado (toast) sin lanzar ValidationException.
     * - Si la nueva condición es cualquier otra, `reserved_until` se limpia
     *   automáticamente (null) para no dejar reservas huérfanas.
     *
     * Endpoint ligero: solo valida y actualiza esos dos campos, sin tocar
     * el resto del item. Devuelve `back()` con un toast de confirmación.
     */
    public function updateCondition(Request $request, InventoryItem $inventory)
    {
        $validated = $request->validate([
            'condition' => ['required', Rule::enum(ItemCondition::class)],
            'reserved_until' => 'nullable|date|after:now',
        ]);

        $isReserved = $validated['condition'] === ItemCondition::RESERVADO->value;

        // Si es reservado, exigir la fecha. Se devuelve toast de error en
        // lugar de ValidationException para no romper la navegación de Inertia.
        if ($isReserved && empty($validated['reserved_until'])) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'Debes indicar hasta cuándo estará reservado el item.',
            ]);
        }

        $inventory->update([
            'condition' => $validated['condition'],
            'reserved_until' => $isReserved ? $validated['reserved_until'] : null,
        ]);

        // Tolerante a null: si por alguna razón reserved_until no quedó
        // seteado (p. ej. race condition), no intentamos formatearlo.
        $message = $isReserved && $inventory->reserved_until
            ? "Item reservado hasta {$inventory->reserved_until->format('d/m/Y H:i')}."
            : 'Condición actualizada correctamente.';

        return back()->with('toast', [
            'type' => 'success',
            'message' => $message,
        ]);
    }

    /**
     * Elimina (soft delete) un item del inventario.
     */
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