<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class StockReservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid', 'inventory_item_id', 'service_id', 'branch_id',
        'quantity', 'reserved_until', 'status', 'notes', 'reserved_by',
    ];

    protected $casts = [
        'reserved_until' => 'datetime',
        'quantity' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function ($reservation) {
            if (empty($reservation->uuid)) {
                $reservation->uuid = (string) Str::uuid();
            }
        });
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function reservedBy()
    {
        return $this->belongsTo(User::class, 'reserved_by');
    }
}