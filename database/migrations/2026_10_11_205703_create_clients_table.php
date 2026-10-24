<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('rut', 12)->unique()->comment('RUT del cliente (ej: 12.345.678-9)');
            $table->string('name', 150)->comment('Nombre completo del cliente');
            $table->string('email', 150)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('address', 255)->nullable();
            $table->text('notes')->nullable()->comment('Notas internas sobre el cliente');
            $table->boolean('is_active')->default(true)->comment('Si el cliente está activo en el sistema');
            $table->timestamps();
            $table->softDeletes();

            // Índices para búsquedas rápidas
            $table->index('name');
            $table->index('rut');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
