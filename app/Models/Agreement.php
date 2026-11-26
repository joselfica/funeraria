<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Modelo Agreement (Convenio).
 *
 * Representa un convenio o acuerdo comercial entre la funeraria y una
 * institución externa (club deportivo, municipalidad, AFP, empresa, etc.)
 * que otorga a sus asociados/beneficiarios un descuento sobre el precio
 * de los servicios funerarios.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ESTRUCTURA DE LA TABLA (migración `agreements`)
 * ─────────────────────────────────────────────────────────────────────
 *
 *  - id                  : bigint unsigned, PK autoincremental.
 *  - name                : string, nombre del convenio.
 *  - rut                 : string(único, nullable), RUT de la institución.
 *  - contact_person      : string nullable, persona de contacto.
 *  - phone               : string nullable, teléfono de contacto.
 *  - email               : string nullable, correo de contacto.
 *  - discount_percentage : decimal(5,2), % de descuento (10.00 por defecto).
 *  - is_active           : boolean, convenio vigente (true por defecto).
 *  - notes               : text nullable, observaciones internas.
 *  - timestamps          : created_at / updated_at.
 *  - deleted_at          : soft delete (nunca se borra físicamente).
 *
 * ─────────────────────────────────────────────────────────────────────
 * REGLAS DE NEGOCIO CLAVE
 * ─────────────────────────────────────────────────────────────────────
 *
 *  1. Los convenios NUNCA se eliminan físicamente: usan SoftDeletes.
 *     Para "desactivar" un convenio se prefiere `is_active = false` antes
 *     que borrarlo, porque los servicios ya facturados deben seguir
 *     mostrando el convenio que se les aplicó.
 *
 *  2. `discount_percentage` es un porcentaje sobre el precio total del
 *     servicio. Se castea como `decimal:2` para que el valor llegue al
 *     frontend siempre como string con 2 decimales ("10.00"), evitando
 *     problemas de redondeo binario de los float.
 *
 *  3. `rut` es único pero nullable, porque algunos convenios (grupos
 *     informales) pueden no tener RUT formal.
 *
 * ─────────────────────────────────────────────────────────────────────
 * RELACIONES
 * ─────────────────────────────────────────────────────────────────────
 *
 *  - services(): un convenio puede aplicarse a muchos servicios.
 *    Requiere que la tabla `services` tenga una columna `agreement_id`
 *    como FK. Si esa columna no existe todavía, esta relación fallará
 *    al consultarse (ver nota en el método).
 */
class Agreement extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Campos asignables en masa.
     *
     * Se listan explícitamente todos los campos editables desde formularios
     * o seeders. `id`, `created_at`, `updated_at` y `deleted_at` quedan
     * fuera por ser gestionados automáticamente por Eloquent.
     */
    protected $fillable = [
        'name',
        'rut',
        'contact_person',
        'phone',
        'email',
        'discount_percentage',
        'is_active',
        'notes',
    ];

    /**
     * Conversión de tipos al leer/escribir.
     *
     *  - discount_percentage: decimal:2 → llega como string "10.00" con
     *    exactamente 2 decimales. Ventaja: no hay sorpresas de punto
     *    flotante (0.1 + 0.2 = 0.30000000000000004). Si necesitas operar
     *    matemáticamente, castea a float en el punto de uso:
     *      $pct = (float) $agreement->discount_percentage;
     *
     *  - is_active: boolean real (true/false), no "1"/"0" ni "t"/"f",
     *    para que las comparaciones en el frontend sean directas.
     */
    protected $casts = [
        'discount_percentage' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Servicios funerarios a los que se aplicó este convenio.
     *
     * ⚠️ Esta relación asume que la tabla `services` tiene una columna
     * `agreement_id` que apunta a `agreements.id`. Si esa columna aún no
     * existe (no está en las migraciones actuales), la relación fallará
     * con un error de columna inexistente. Cuando se implemente la
     * aplicación de convenios a servicios, agregar la FK con una migración
     * como:
     *
     *   Schema::table('services', function (Blueprint $table) {
     *       $table->foreignId('agreement_id')
           *           ->nullable()
     *           ->after('client_id')
     *           ->constrained('agreements')
     *           ->nullOnDelete();
     *   });
     */
    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    // ─────────────────────────────────────────────────────────────
    // SCOPES
    // ─────────────────────────────────────────────────────────────

    /**
     * Solo convenios vigentes (`is_active = true`).
     *
     * Nota: los convenios con soft delete (deleted_at no nulo) ya quedan
     * excluidos automáticamente por el trait SoftDeletes, así que este
     * scope solo filtra por el flag lógico.
     *
     * Uso: Agreement::active()->get();
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}