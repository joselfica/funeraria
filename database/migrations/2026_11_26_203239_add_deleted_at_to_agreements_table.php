<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Agrega la columna `deleted_at` a la tabla `agreements`.
 *
 * El modelo Agreement usa el trait SoftDeletes, que requiere esta columna
 * para funcionar. Sin ella, cualquier consulta a `agreements` falla con
 * "no existe la columna agreements.deleted_at".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agreements', function (Blueprint $table) {
            $table->softDeletes(); // agrega `deleted_at` nullable
        });
    }

    public function down(): void
    {
        Schema::table('agreements', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};