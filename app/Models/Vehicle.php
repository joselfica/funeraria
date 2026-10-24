<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Vehicle extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'type',
        'plate',
        'brand',
        'model',
        'year',
        'color',
        'capacity',
        'status',
        'last_maintenance_at',
        'next_maintenance_at',
        'hourly_rate',
        'photos',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'year' => 'integer',
        'capacity' => 'integer',
        'hourly_rate' => 'decimal:2',
        'photos' => 'array',
        'is_active' => 'boolean',
        'last_maintenance_at' => 'date',
        'next_maintenance_at' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $appends = [
        'type_label',
        'status_label',
        'needs_maintenance',
    ];

    protected static function booted(): void
    {
        static::creating(function (Vehicle $vehicle) {
            if (empty($vehicle->uuid)) {
                $vehicle->uuid = (string) Str::uuid();
            }
        });
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'disponible')->where('is_active', true);
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('plate', 'ILIKE', "%{$term}%")
              ->orWhere('brand', 'ILIKE', "%{$term}%")
              ->orWhere('model', 'ILIKE', "%{$term}%");
        });
    }

    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            'carroza' => 'Carroza',
            'acompanamiento' => 'Acompañamiento',
            'furgon' => 'Furgón',
            default => $this->type,
        };
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'disponible' => 'Disponible',
            'en_servicio' => 'En servicio',
            'mantenimiento' => 'Mantenimiento',
            'fuera_servicio' => 'Fuera de servicio',
            default => $this->status,
        };
    }

    public function getNeedsMaintenanceAttribute(): bool
    {
        if (! $this->next_maintenance_at) {
            return false;
        }
        return $this->next_maintenance_at->isPast();
    }

    /**
     * Relación: servicios en los que se ha usado este vehículo.
     */
    public function services()
    {
        return $this->belongsToMany(Service::class, 'service_vehicle')
            ->withPivot(['departs_at', 'returns_at', 'notes'])
            ->withTimestamps();
    }
}