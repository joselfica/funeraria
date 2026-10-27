<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Service extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid', 'code', 'client_id', 'deceased_id', 'service_type_id',
        'scheduled_at', 'duration_hours', 'ends_at', 'status', 'body_status',
        'base_price', 'additional_charges', 'discount', 'total_price',
        'created_by', 'approved_by', 'approved_at', 'approval_notes', 'rejection_reason',
        'client_notes', 'internal_notes',
        'beneficiary_type', 'afp_amount', 'family_amount', 'municipal_amount',
        'expected_payment_date',
        'seremi_extension_granted',
        'seremi_resolution_number',
        'seremi_resolution_date',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'ends_at' => 'datetime',
        'approved_at' => 'datetime',
        'duration_hours' => 'integer',
        'base_price' => 'decimal:2',
        'additional_charges' => 'decimal:2',
        'discount' => 'decimal:2',
        'total_price' => 'decimal:2',
        'expected_payment_date' => 'date',
        'afp_amount' => 'decimal:2',
        'family_amount' => 'decimal:2',
        'municipal_amount' => 'decimal:2',
        'seremi_extension_granted' => 'boolean',
        'seremi_resolution_date' => 'date',
    ];

    // 🔒 Ocultar notas internas (solo visibles para Admin)
    protected $hidden = [
        'internal_notes',
        'rejection_reason',
    ];

    protected static function booted(): void
    {
        static::creating(function (Service $service) {
            if (empty($service->uuid)) {
                $service->uuid = (string) Str::uuid();
            }
            if (empty($service->code)) {
                $service->code = self::generateCode();
            }
        });
    }

    public static function generateCode(): string
    {
        $year = date('Y');
        $last = self::whereYear('created_at', $year)->count() + 1;
        return sprintf('SRV-%d-%04d', $year, $last);
    }

    // Relaciones
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function deceased()
    {
        return $this->belongsTo(Deceased::class);
    }

    public function serviceType()
    {
        return $this->belongsTo(ServiceType::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Scopes
    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('code', 'ILIKE', "%{$term}%")
              ->orWhereHas('client', fn ($c) => $c->where('name', 'ILIKE', "%{$term}%"))
              ->orWhereHas('deceased', fn ($d) => $d->where('full_name', 'ILIKE', "%{$term}%"));
        });
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', ['pending', 'in_review', 'with_observations']);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['accepted', 'in_progress']);
    }

    // Accessors
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'pending' => 'Pendiente',
            'in_review' => 'En revisión',
            'with_observations' => 'Con observaciones',
            'accepted' => 'Aceptada',
            'rejected' => 'No aplica',
            'in_progress' => 'En ejecución',
            'completed' => 'Completada',
            'cancelled' => 'Cancelada',
            default => $this->status,
        };
    }

    public function getBeneficiaryLabelAttribute(): string
    {
        return \App\Enums\BeneficiaryType::tryFrom($this->beneficiary_type)?->label()
            ?? $this->beneficiary_type;
    }

    /**
     * Relación: pagos/abonos del servicio.
     */
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Accessor: total pagado hasta ahora.
     * Calculado dinámicamente desde la suma de payments.
     */
    public function getTotalPaidAttribute(): float
    {
        return (float) $this->payments()->sum('amount');
    }

    /**
     * Accessor: saldo pendiente por pagar.
     * = total_price - total_paid
     */
    public function getBalanceAttribute(): float
    {
        return (float) $this->total_price - $this->total_paid;
    }

    /**
     * Accessor: ¿está totalmente pagado?
     */
    public function getIsFullyPaidAttribute(): bool
    {
        return $this->balance <= 0.01; // margen por redondeo
    }

    /**
     * Accessor: estado del pago legible.
     */
    public function getPaymentStatusAttribute(): string
    {
        if ($this->is_fully_paid) {
            return 'Pagado';
        }
        if ($this->total_paid > 0) {
            return 'Parcialmente pagado';
        }
        return 'Sin pagos';
    }

    /**
     * Relación: items de inventario asignados al servicio (ataúdes, urnas).
     *
     * Relación N:M con la tabla pivot `service_inventory_item`.
     * Incluye los datos históricos de la asignación (precio, cantidad, notas).
     */
    public function inventoryItems()
    {
        return $this->belongsToMany(InventoryItem::class, 'service_inventory_item')
            ->withPivot(['quantity', 'unit_price', 'notes', 'assigned_by', 'assigned_at'])
            ->withTimestamps();
    }

    /**
     * Relación: vehículos asignados al servicio (carrozas, acompañamiento).
     *
     * Relación N:M con la tabla pivot `service_vehicle`.
     * Incluye horarios específicos del uso del vehículo.
     */
    public function vehicles()
    {
        return $this->belongsToMany(Vehicle::class, 'service_vehicle')
            ->withPivot(['departs_at', 'returns_at', 'notes', 'assigned_by', 'assigned_at'])
            ->withTimestamps();
    }

    /**
     * Relación: empleados asignados al servicio.
     */
    public function assignments()
    {
        return $this->hasMany(ServiceAssignment::class);
    }

    /**
     * Relación: usuarios asignados (a través de assignments).
     */
    public function assignedUsers()
    {
        return $this->belongsToMany(User::class, 'service_assignments')
            ->withPivot(['role_in_service', 'notes', 'assigned_at'])
            ->withTimestamps();
    }

    /**
     * Relación: sucursal a la que pertenece el servicio.
     *
     * N:1 con la tabla `branches`. Actualmente hay 2 sucursales
     * (calle Blanco 1 y 2).
     */
    public function branch()
    {
        return $this->belongsTo(\App\Models\Branch::class);
    }
}