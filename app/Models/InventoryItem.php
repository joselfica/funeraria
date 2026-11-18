<?php

namespace App\Models;

use App\Enums\ItemCondition;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class InventoryItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'category',
        'code',
        'name',
        'description',
        'material',
        'procedencia',
        'dimensions',
        'price',
        'condition',
        'alert_threshold',
        'stock_minimum', // Se mantiene por compatibilidad con datos viejos
        'photos',
        'is_active',
        'size_cm',
        'is_seremi_required',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'alert_threshold' => 'integer',
        'stock_minimum' => 'integer',
        'photos' => 'array',
        'is_active' => 'boolean',
        'size_cm' => 'integer',
        'is_seremi_required' => 'boolean',
        'condition' => ItemCondition::class,
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $appends = [
        'category_label',
        'category_icon',
        'category_description',
        'condition_label',
        'condition_color',
        'available_stock',
        'is_low_stock',
    ];

    protected static function booted(): void
    {
        static::creating(function (InventoryItem $item) {
            if (empty($item->uuid)) {
                $item->uuid = (string) Str::uuid();
            }

            // El código (SKU) se genera solo según la categoría: ATA-001, URN-001...
            if (empty($item->code)) {
                $item->code = static::nextCode((string) $item->category);
            }

            // Marcar automáticamente como obligatorio Seremi si es 30, 40 o 60 cm
            if (in_array($item->size_cm, [30, 40, 60])) {
                $item->is_seremi_required = true;
            }
        });

        static::updating(function (InventoryItem $item) {
            if (in_array($item->size_cm, [30, 40, 60])) {
                $item->is_seremi_required = true;
            } else {
                $item->is_seremi_required = false;
            }
        });
    }

    /**
     * Siguiente código (SKU) libre para una categoría.
     *
     * ataud => ATA-001, ATA-002, ...   urna => URN-001, URN-002, ...
     * Incluye unidades eliminadas (soft delete): el índice único de `code`
     * también las cuenta, así que no se puede reutilizar su número.
     */
    public static function nextCode(string $category): string
    {
        $prefix = match ($category) {
            'ataud' => 'ATA',
            'urna' => 'URN',
            default => 'ITM',
        };

        $max = static::withTrashed()
            ->where('code', 'LIKE', $prefix . '-%')
            ->pluck('code')
            ->map(fn ($code) => preg_match('/^' . $prefix . '-(\d+)/', $code, $m) ? (int) $m[1] : 0)
            ->max() ?? 0;

        return sprintf('%s-%03d', $prefix, $max + 1);
    }

    // ─────────────────────────────────────────────────────────
    // SCOPES
    // ─────────────────────────────────────────────────────────

    /**
     * Scope: solo items activos
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: solo items disponibles (nuevos o en buen estado)
     */
    public function scopeAvailable($query)
    {
        return $query->whereIn('condition', ['nuevo', 'bueno']);
    }

    /**
     * Scope: unidades que se pueden asignar ahora a un servicio.
     *
     * Activas y con una condición que ItemCondition::isAvailable() considera
     * disponible (nuevo, bueno, con_detalles). Las reservadas, dañadas o para
     * reparar quedan fuera.
     */
    public function scopeAssignable($query)
    {
        $values = collect(ItemCondition::cases())
            ->filter(fn (ItemCondition $c) => $c->isAvailable())
            ->map(fn (ItemCondition $c) => $c->value)
            ->all();

        return $query->active()->whereIn('condition', $values);
    }

    /**
     * Scope: urnas obligatorias por Seremi que están bajo el umbral de alerta.
     *
     * Nota: como ahora cada fila es una unidad física, el "stock" se calcula
     * contando cuántas unidades disponibles (nuevo/bueno) hay para el mismo
     * nombre. El scope usa un subquery para hacerlo eficientemente en SQL.
     */
    public function scopeSeremiCritical($query)
    {
        return $query->where('is_seremi_required', true)
            ->whereRaw('(
                SELECT COUNT(*) 
                FROM inventory_items AS i2 
                WHERE i2.name = inventory_items.name 
                  AND i2.is_active = true 
                  AND i2.condition IN (\'nuevo\', \'bueno\')
            ) <= inventory_items.alert_threshold');
    }

    /**
     * Scope: filtra por procedencia (ciudad de origen: Talca | Santiago)
     */
    public function scopeFromProcedencia($query, string $procedencia)
    {
        return $query->where('procedencia', $procedencia);
    }

    /**
     * Scope: búsqueda por código, nombre o material
     */
    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('code', 'ILIKE', "%{$term}%")
              ->orWhere('name', 'ILIKE', "%{$term}%")
              ->orWhere('material', 'ILIKE', "%{$term}%");
        });
    }

    // ─────────────────────────────────────────────────────────
    // ACCESSORS
    // ─────────────────────────────────────────────────────────

    /**
     * Accessor: nombre formateado de la categoría
     */
    public function getCategoryLabelAttribute(): string
    {
        return match ($this->category) {
            'ataud' => 'Ataúd',
            'urna' => 'Urna',
            null => 'Sin categoría',
            default => (string) $this->category,
        };
    }

    /**
     * Icono visual según la categoría.
     */
    public function getCategoryIconAttribute(): string
    {
        return match ($this->category) {
            'ataud' => 'coffin',
            'urna' => 'urn',
            default => 'package',
        };
    }

    /**
     * Descripción larga para tooltips.
     */
    public function getCategoryDescriptionAttribute(): string
    {
        return match ($this->category) {
            'ataud' => 'Ataúd (para velatorio e inhumación)',
            'urna' => 'Urna (para cenizas de cremación)',
            default => 'Producto',
        };
    }

    /**
     * Accessor: etiqueta de la condición
     */
    public function getConditionLabelAttribute(): string
    {
        return $this->condition?->label() ?? 'Sin condición';
    }

    /**
     * Accessor: color de la condición
     */
    public function getConditionColorAttribute(): string
    {
        return $this->condition?->color() ?? 'bg-slate-100 text-slate-800 border-slate-200';
    }

    /**
     * Accessor: stock dinámico.
     *
     * Cuenta cuántas unidades con el mismo nombre están activas y disponibles
     * (condición 'nuevo' o 'bueno'). No confundir con `total_stock`, que
     * cuenta todas las unidades sin importar su condición.
     *
     * ⚠️ Este accessor hace una consulta a la BD cada vez que se llama.
     * Para listados grandes, considera usar `withCount` en el controlador.
     */
    public function getAvailableStockAttribute(): int
    {
        return self::where('name', $this->name)
            ->where('is_active', true)
            ->whereIn('condition', ['nuevo', 'bueno'])
            ->count();
    }

    /**
     * Accessor: ¿el stock disponible está bajo el umbral de alerta?
     */
    public function getIsLowStockAttribute(): bool
    {
        return $this->available_stock <= ($this->alert_threshold ?? 2);
    }

    /**
     * Relación: servicios en los que se ha usado este item.
     */
    public function services()
    {
        return $this->belongsToMany(Service::class, 'service_inventory_item')
            ->withPivot(['quantity', 'unit_price', 'notes'])
            ->withTimestamps();
    }
}