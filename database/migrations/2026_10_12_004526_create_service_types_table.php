<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_types', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('code', 20)->unique()->comment('Código único (ej: VEL001)');
            $table->string('name', 100)->comment('Ej: Velatorio 24 horas');
            $table->text('description')->nullable();
            $table->decimal('base_price', 12, 2)->default(0)->comment('Precio base del servicio');
            $table->integer('duration_hours')->default(24)->comment('Duración típica en horas');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0)->comment('Orden de visualización');
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('is_active');
            $table->index('sort_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_types');
    }
};