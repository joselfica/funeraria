<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            // De dónde viene el fallecido
            $table->string('origin_location', 200)->nullable()->after('body_status')
                ->comment('Lugar de donde viene el fallecido (hospital, domicilio, SML, etc.)');
            
            // A dónde se va (cementerio o crematorio)
            $table->string('destination_location', 200)->nullable()->after('origin_location')
                ->comment('Cementerio o crematorio de destino');
            
            // Fecha del entierro/cremación (puede diferir de la fecha del servicio)
            $table->dateTime('burial_at')->nullable()->after('destination_location')
                ->comment('Fecha y hora del entierro o cremación');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['origin_location', 'destination_location', 'burial_at']);
        });
    }
};