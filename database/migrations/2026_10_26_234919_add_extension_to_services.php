<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->boolean('seremi_extension_granted')->default(false)->after('duration_hours')
                ->comment('True si la Seremi otorgó extensión');
            $table->string('seremi_resolution_number', 50)->nullable()->after('seremi_extension_granted')
                ->comment('Número de resolución de la Seremi');
            $table->date('seremi_resolution_date')->nullable()->after('seremi_resolution_number')
                ->comment('Fecha de la resolución');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['seremi_extension_granted', 'seremi_resolution_number', 'seremi_resolution_date']);
        });
    }
};