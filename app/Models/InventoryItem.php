<?php

namespace App\Models;

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
        'dimensions',
        'price',
        'stock',
        'stock_minimum',
        'photos',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock' => 'integer',
        'stock_minimum' => 'integer',
        'photos' => 'array',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $appends = [
        'category_label',
        'needs_restock',
    ];

    protected static function booted(): void
    {
        static::creating(function (InventoryItem $item) {
            if (empty($item->uuid)) {
                $item->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Scope: solo items activos
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: solo items con stock bajo (necesitan reposición)
     */
    public function scopeLowStock($query)
    {
        return $query->whereColumn('stock', '<=', 'stock_minimum');
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
     * Accessor: ¿necesita reposición?
     */
    public function getNeedsRestockAttribute(): bool
    {
        return ($this->stock ?? 0) <= ($this->stock_minimum ?? 0);
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