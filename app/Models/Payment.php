<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * Modelo de pagos/abonos.
 *
 * Cada pago reduce el saldo pendiente del servicio.
 * El saldo se calcula dinámicamente (no se persiste).
 */
class Payment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'service_id',
        'receipt_number',
        'amount',
        'payment_method',
        'reference',
        'payment_date',
        'receipt_path',
        'notes',
        'registered_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Accessors calculados
    protected $appends = [
        'payment_method_label',
    ];

    /**
     * Auto-genera UUID y número de comprobante al crear.
     */
    protected static function booted(): void
    {
        static::creating(function (Payment $payment) {
            if (empty($payment->uuid)) {
                $payment->uuid = (string) Str::uuid();
            }
            if (empty($payment->receipt_number)) {
                $payment->receipt_number = self::generateReceiptNumber();
            }
        });
    }

    /**
     * Genera el siguiente número de comprobante del año.
     * Formato: PAG-2026-0001
     *
     * CORREGIDO: Usa MAX() en lugar de COUNT() para evitar duplicados
     * cuando hay pagos eliminados (soft delete).
     */
    public static function generateReceiptNumber(): string
    {
        $year = date('Y');
        
        // Buscar el último número de comprobante del año (incluyendo eliminados)
        $lastNumber = self::withTrashed()
            ->whereYear('created_at', $year)
            ->orderByDesc('receipt_number')
            ->value('receipt_number');

        if ($lastNumber) {
            // Extraer el número secuencial (ej: PAG-2026-0042 → 42)
            $lastSequence = (int) substr($lastNumber, -4);
            $nextSequence = $lastSequence + 1;
        } else {
            $nextSequence = 1;
        }

        return sprintf('PAG-%d-%04d', $year, $nextSequence);
    }

    /**
     * Relación: el pago pertenece a un servicio.
     */
    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Relación: quién registró el pago.
     */
    public function registeredBy()
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    /**
     * Accessor: etiqueta legible del medio de pago.
     *
     * CORREGIDO: Siempre devuelve un string, incluso si payment_method
     * es null o tiene un valor desconocido.
     */
    public function getPaymentMethodLabelAttribute(): string
    {
        return match ($this->payment_method) {
            'efectivo' => 'Efectivo',
            'transferencia' => 'Transferencia',
            'tarjeta_credito' => 'Tarjeta de crédito',
            'tarjeta_debito' => 'Tarjeta de débito',
            'cheque' => 'Cheque',
            'convenio' => 'Convenio / Cuota mortuoria',
            null, '' => 'Sin método',
            default => ucfirst((string) $this->payment_method),
        };
    }

    /**
     * Scope: filtrar por servicio.
     */
    public function scopeForService($query, int $serviceId)
    {
        return $query->where('service_id', $serviceId);
    }

    /**
     * Scope: filtrar por rango de fechas.
     */
    public function scopeBetweenDates($query, string $from, string $to)
    {
        return $query->whereBetween('payment_date', [$from, $to]);
    }
}