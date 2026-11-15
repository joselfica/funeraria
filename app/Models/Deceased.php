<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Deceased extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'deceased';

    protected $fillable = [
        'uuid', 'full_name', 'rut', 'is_active', 'gender', 'birth_date', 'death_date', 'death_time',
        'death_certificate_number', 'death_certificate_office', 'death_certificate_date',
        'cause_of_death', 'death_location', 'current_location',
        'cemetery', 'niche_location', 'notes',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'death_date' => 'date',
        'death_certificate_date' => 'date',
        'death_time' => 'datetime:H:i',
        'is_active' => 'boolean',
        'cause_of_death' => 'encrypted', // 🔒 Encriptación automática
    ];

    // 🔒 Ocultar campos sensibles en respuestas JSON
    protected $hidden = [
        'cause_of_death',           // Causa del fallecimiento
        'death_certificate_number', // Número de certificado
    ];

    protected static function booted(): void
    {
        static::creating(function (Deceased $deceased) {
            if (empty($deceased->uuid)) {
                $deceased->uuid = (string) Str::uuid();
            }
        });
    }

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('full_name', 'ILIKE', "%{$term}%")
              ->orWhere('rut', 'ILIKE', "%{$term}%")
              ->orWhere('death_certificate_number', 'ILIKE', "%{$term}%");
        });
    }

    // Accessor: edad al fallecer
    public function getAgeAtDeathAttribute(): ?int
    {
        if (! $this->birth_date || ! $this->death_date) {
            return null;
        }
        return $this->birth_date->diffInYears($this->death_date);
    }
}