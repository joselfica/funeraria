<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('cascade')
                ->comment('Login del conductor');
            $table->foreignId('branch_id')->nullable()->constrained()
                ->onDelete('set null');
            
            $table->string('rut', 12)->unique();
            $table->string('phone', 20);
            
            // Licencia
            $table->string('license_number', 20);
            $table->string('license_type', 10)->comment('A1, A2, A3, A4, A5');
            $table->date('license_expires_at');
            
            // Vehículo propio (patente y datos del vehículo)
            $table->string('plate', 10);
            $table->string('vehicle_brand', 100);
            $table->string('vehicle_model', 100);
            $table->string('vehicle_year', 10)->nullable();
            $table->string('vehicle_color', 50);
            $table->boolean('is_carroza')->default(false)
                ->comment('True si es carroza, false si es acompañamiento');
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};