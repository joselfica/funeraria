<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->enum('type', ['carroza', 'acompanamiento', 'furgon'])->comment('Tipo de vehículo');
            $table->string('plate', 10)->unique()->comment('Patente del vehículo');
            $table->string('brand', 100)->nullable()->comment('Marca (Mercedes, Ford, etc.)');
            $table->string('model', 100)->nullable()->comment('Modelo');
            $table->year('year')->nullable()->comment('Año del vehículo');
            $table->string('color', 50)->nullable();
            $table->integer('capacity')->default(1)->comment('Capacidad de pasajeros/feretros');
            $table->enum('status', ['disponible', 'en_servicio', 'mantenimiento', 'fuera_servicio'])
                ->default('disponible')
                ->comment('Estado actual');
            $table->date('last_maintenance_at')->nullable()->comment('Última mantención');
            $table->date('next_maintenance_at')->nullable()->comment('Próxima mantención');
            $table->decimal('hourly_rate', 10, 2)->default(0)->comment('Tarifa por hora (opcional)');
            $table->jsonb('photos')->nullable()->comment('Array de URLs de fotos');
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            // Índices
            $table->index('type');
            $table->index('plate');
            $table->index('status');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};