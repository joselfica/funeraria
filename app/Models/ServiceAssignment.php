<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Asignación de un empleado a un servicio funerario.
 *
 * Un servicio puede tener múltiples asignaciones (encargado + asistente).
 * Al crear una asignación, se valida que el empleado esté disponible.
 */
class ServiceAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_id',
        'user_id',
        'role_in_service',
        'notes',
        'assigned_by',
        'assigned_at',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    /**
     * Accessor: etiqueta del rol dentro del servicio.
     */
    public function getRoleLabelAttribute(): string
    {
        return match ($this->role_in_service) {
            'coordinator' => 'Encargado',
            'assistant' => 'Asistente',
            'driver' => 'Conductor',
            default => $this->role_in_service,
        };
    }
}