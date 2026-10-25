<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Campos que se pueden asignar masivamente.
     */
    protected $fillable = [
        'uuid',
        'rut',
        'name',
        'email',
        'phone',
        'address',
        'notes',
        'is_active',
        'user_id',
    ];

    /**
     * Casts de tipos.
     */
    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Boot: generar UUID automáticamente al crear.
     */
    protected static function booted(): void
    {
        static::creating(function (Client $client) {
            if (empty($client->uuid)) {
                $client->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Scope: solo clientes activos.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: búsqueda por nombre o RUT.
     */
    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'ILIKE', "%{$term}%")
                ->orWhere('rut', 'ILIKE', "%{$term}%")
                ->orWhere('email', 'ILIKE', "%{$term}%");
        });
    }

    /**
     * Relación: cliente asociado a un usuario del sistema.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}