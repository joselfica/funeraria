<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deceased', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            
            // Datos personales
            $table->string('full_name', 200)->comment('Nombre completo del fallecido');
            $table->string('rut', 12)->nullable()->unique()->comment('RUT del fallecido');
            $table->enum('gender', ['M', 'F', 'otro'])->nullable();
            $table->date('birth_date')->nullable();
            $table->date('death_date')->comment('Fecha de fallecimiento');
            $table->time('death_time')->nullable();
            
            // Certificado de defunción (dato legal sensible)
            $table->string('death_certificate_number', 50)->nullable()->comment('Número de certificado');
            $table->string('death_certificate_office', 150)->nullable()->comment('Registro Civil / oficina');
            $table->date('death_certificate_date')->nullable();
            
            // Causa (dato MUY sensible, encriptado)
            $table->text('cause_of_death')->nullable()->comment('Causa del fallecimiento (encriptado)');
            
            // Lugar (para logística)
            $table->string('death_location', 200)->nullable()->comment('Lugar donde ocurrió');
            $table->string('current_location', 200)->nullable()->comment('Lugar actual del cuerpo');
            
            // Cementerio/crematorio
            $table->string('cemetery', 200)->nullable();
            $table->string('niche_location', 100)->nullable()->comment('Ubicación de nicho/sepultura');
            
            // Observaciones
            $table->text('notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('full_name');
            $table->index('death_date');
            $table->index('rut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deceased');
    }
};