<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * Ausencia de un empleado (vacaciones, permisos, licencias).
 *
 * Reglas de negocio:
 * - Solo las aprobadas bloquean al empleado en el calendario
 * - Las vacaciones descuentan días del cupo anual
 * - Al aprobar, se validan conflictos con servicios asignados
 */
class EmployeeAbsence extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'user_id',
        'type',
        'starts_at',
        'ends_at',
        'document_path',
        'reason',
        'notes',
        'status',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected $casts = [
        'starts_at' => 'date',
        'ends_at' => 'date',
        'approved_at' => 'datetime',
    ];

    /**
     * Accessors que viajan siempre en el JSON (hacia Inertia/React).
     */
    protected $appends = [
        'type_label',
        'status_label',
        'business_days',
    ];

    protected static function booted(): void
    {
        static::creating(function (EmployeeAbsence $absence) {
            if (empty($absence->uuid)) {
                $absence->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Relación: el empleado que solicita la ausencia.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación: quién aprobó/rechazó la ausencia.
     */
    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scope: solo ausencias aprobadas (las que bloquean al empleado).
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope: ausencias activas en una fecha específica.
     */
    public function scopeActiveOn($query, Carbon $date)
    {
        return $query->where('status', 'approved')
            ->where('starts_at', '<=', $date)
            ->where('ends_at', '>=', $date);
    }

    /**
     * Accessor: días hábiles de la ausencia.
     * Ejemplo: lunes a viernes = 5 días.
     */
    public function getBusinessDaysAttribute(): int
    {
        return $this->starts_at->diffInWeekdays($this->ends_at) + 1;
    }

    /**
     * Accessor: etiqueta legible del tipo.
     */
    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            'vacation' => 'Vacaciones',
            'permission' => 'Permiso',
            'medical' => 'Licencia médica',
            'personal' => 'Día personal',
            'bereavement' => 'Duelo',
            'unpaid' => 'Permiso sin goce',
            'training' => 'Capacitación',
            'other' => 'Otro',
            default => $this->type,
        };
    }

    /**
     * Accessor: etiqueta legible del estado.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'pending' => 'Pendiente',
            'approved' => 'Aprobada',
            'rejected' => 'Rechazada',
            'cancelled' => 'Cancelada',
            default => $this->status,
        };
    }
}