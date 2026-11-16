<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega la columna `reserved_until` a la tabla `inventory_items`.
     *
     * Esta columna registra hasta cuándo un item está reservado para un
     * servicio específico (por ejemplo, un ataúd apartado para un velorio
     * programado). Se usa junto con la condición `RESERVADO`:
     *
     * - `condition = 'reservado'` + `reserved_until` en el futuro → reserva activa.
     * - `condition = 'reservado'` + `reserved_until` vencido o null → reserva huérfana
     *   (se puede liberar automáticamente con un job o manualmente desde la UI).
     *
     * Es nullable porque la gran mayoría de los items no están reservados.
     * Solo los items con `condition = 'reservado'` deberían tener un valor aquí.
     */
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            // Fecha/hora hasta la que el item está reservado. NULL si no está reservado.
            $table->timestamp('reserved_until')
                ->nullable()
                ->after('condition');
        });
    }

    /**
     * Revierte el cambio eliminando la columna `reserved_until`.
     *
     * ⚠️ Al hacer rollback se pierde la fecha de reserva de cada item.
     * Si tienes reservas activas, libéralas antes de ejecutar
     * `php artisan migrate:rollback` para evitar items "atascados"
     * en estado RESERVADO sin fecha de expiración.
     */
    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropColumn('reserved_until');
        });
    }
};