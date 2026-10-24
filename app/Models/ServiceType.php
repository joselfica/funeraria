<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class ServiceType extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid', 'code', 'name', 'description',
        'base_price', 'duration_hours', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'duration_hours' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (ServiceType $type) {
            if (empty($type->uuid)) {
                $type->uuid = (string) Str::uuid();
            }
        });
    }

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}