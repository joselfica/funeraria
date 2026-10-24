<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid', 'name', 'city', 'contact_name', 'phone', 'email',
        'delivery_hours', 'color_identifier', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'delivery_hours' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (Supplier $supplier) {
            if (empty($supplier->uuid)) {
                $supplier->uuid = (string) Str::uuid();
            }
        });
    }

    public function inventoryItems()
    {
        return $this->hasMany(InventoryItem::class);
    }
}