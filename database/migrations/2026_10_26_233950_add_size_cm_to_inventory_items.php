<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->integer('size_cm')->nullable()->after('dimensions')
                ->comment('Tamaño en cm (30, 40, 60, 70, etc.)');
            $table->boolean('is_seremi_required')->default(false)->after('size_cm')
                ->comment('True si es una urna obligatoria por Seremi (30, 40, 60)');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropColumn(['size_cm', 'is_seremi_required']);
        });
    }
};