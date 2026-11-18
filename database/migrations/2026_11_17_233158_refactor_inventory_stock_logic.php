<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            // 1. Agregar umbral de alerta (por defecto 2)
            $table->integer('alert_threshold')->default(2)->after('condition');
            
            // 2. Eliminar el campo stock (ya no se usa)
            $table->dropColumn('stock');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->integer('stock')->default(0)->after('condition');
            $table->dropColumn('alert_threshold');
        });
    }
};