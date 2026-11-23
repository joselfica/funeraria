<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * Modelo de Donaciones.
 *
 * Registra los aportes (en dinero o en especie) que la funeraria
 * recibe de equipos, instituciones o personas, junto con el
 * comprobante firmado y el usuario que la registró.
 */
class Donation extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Campos asignables masivamente.
     */
    protected $fillable = [
        'uuid',
        'beneficiary_name',
        'beneficiary_rut',
        'contact_person',
        'type',
        'amount',
        'description',
        'donation_date',
        'receipt_path',
        'notes',
        'created_by',
    ];

    /**
     * Tipos de datos nativos.
     */
    protected $casts = [
        'donation_date' => 'date',
        'amount' => 'decimal:2',
    ];

    /**
     * Genera el UUID automáticamente al crear una donación.
     */
    protected static function booted(): void
    {
        static::creating(function (Donation $donation) {
            if (empty($donation->uuid)) {
                $donation->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Usuario que registró la donación.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}