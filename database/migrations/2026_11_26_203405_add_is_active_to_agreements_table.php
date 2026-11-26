<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agreements', function (Blueprint $table) {
            // Agregamos la columna si no existe
            if (!Schema::hasColumn('agreements', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('discount_percentage');
            }
        });
    }

    public function down(): void
    {
        Schema::table('agreements', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }
};