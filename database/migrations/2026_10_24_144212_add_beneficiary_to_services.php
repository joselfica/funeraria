<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->string('beneficiary_type', 30)->default('particular')
                ->after('status')
                ->comment('afp, adulto_mayor, menor_sin_beneficio, municipal, particular');
            
            $table->decimal('afp_amount', 12, 2)->default(0)
                ->comment('Monto cubierto por la AFP');
            
            $table->decimal('family_amount', 12, 2)->default(0)
                ->comment('Monto pagado por la familia');
            
            $table->decimal('municipal_amount', 12, 2)->default(0)
                ->comment('Monto cubierto por municipalidad');
            
            $table->date('expected_payment_date')->nullable()
                ->comment('Fecha esperada de pago (para municipales: +3 meses)');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn([
                'beneficiary_type', 'afp_amount', 'family_amount',
                'municipal_amount', 'expected_payment_date',
            ]);
        });
    }
};