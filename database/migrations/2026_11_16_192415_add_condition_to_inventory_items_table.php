<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega la columna `condition` a la tabla `inventory_items`.
     *
     * Esta columna registra el estado físico del item (nuevo, usado, etc.)
     * para diferenciar productos en stock y aplicar reglas de negocio
     * (por ejemplo, precios distintos o disponibilidad limitada).
     *
     * Valores sugeridos: 'nuevo', 'usado', 'reacondicionado', 'dañado'.
     * Por defecto se asume 'nuevo' para no romper registros existentes.
     */
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            // Estado físico del item. Default 'nuevo' para filas existentes.
            $table->string('condition')
                ->default('nuevo')
                ->after('is_active');
        });
    }

    /**
     * Revierte el cambio eliminando la columna `condition`.
     *
     * ⚠️ Al hacer rollback se pierde el estado físico registrado en cada item.
     * Si necesitas conservar esa información, respáldala antes de ejecutar
     * `php artisan migrate:rollback`.
     */
    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropColumn('condition');
        });
    }
};