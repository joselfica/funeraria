<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Agrega la columna `agreement_id` a la tabla `services`.
 *
 * Esta FK permite asociar un servicio funerario a un convenio (Agreement)
 * que le otorga un descuento a la institución o grupo correspondiente
 * (club deportivo, municipalidad, AFP, empresa, etc.).
 *
 * Decisiones de diseño:
 *   - `nullable()`: no todos los servicios tienen convenio (por ejemplo,
 *     los particulares sin descuento).
 *   - `nullOnDelete()`: si un convenio se elimina físicamente (aunque en
 *     la práctica no se elimina, solo se desactiva con `is_active`), los
 *     servicios que lo usaron quedan con `agreement_id = null` en lugar
 *     de romper la integridad referencial. La trazabilidad histórica se
 *     preserva porque el modelo Agreement usa SoftDeletes.
 *   - Se coloca después de `client_id` para mantener un orden lógico:
 *     cliente → convenio → fallecido → etc.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            // Relación opcional (nullable) porque no todos los servicios tienen convenio.
            $table->foreignId('agreement_id')
                ->nullable()
                ->after('client_id')
                ->constrained('agreements')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            // Se elimina primero la FK y luego la columna.
            // `dropConstrainedForeignId` hace ambas cosas en un solo paso
            // (Laravel 8+), garantizando que no quede la restricción huérfana.
            $table->dropConstrainedForeignId('agreement_id');
        });
    }
};