<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Driver extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid', 'user_id', 'branch_id', 'rut', 'phone',
        'license_number', 'license_type', 'license_expires_at',
        'plate', 'vehicle_brand', 'vehicle_model', 'vehicle_year',
        'vehicle_color', 'is_carroza', 'is_active',
    ];

    protected $casts = [
        'license_expires_at' => 'date',
        'is_carroza' => 'boolean',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (Driver $driver) {
            if (empty($driver->uuid)) {
                $driver->uuid = (string) Str::uuid();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function services()
    {
        return $this->belongsToMany(Service::class, 'service_driver')
            ->withPivot(['departs_at', 'returns_at', 'notes'])
            ->withTimestamps();
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getFullNameAttribute(): string
    {
        return $this->user->name;
    }
}