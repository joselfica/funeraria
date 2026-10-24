<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->enum('category', ['ataud', 'urna'])->comment('Tipo de producto');
            $table->string('code', 50)->unique()->comment('SKU interno (ej: ATA-001)');
            $table->string('name', 150)->comment('Nombre del producto');
            $table->text('description')->nullable();
            $table->string('material', 100)->nullable()->comment('Roble, pino, metal, etc.');
            $table->string('dimensions', 100)->nullable()->comment('Ej: 200x60x40 cm');
            $table->decimal('price', 12, 2)->default(0)->comment('Precio de venta');
            $table->integer('stock')->default(0)->comment('Cantidad disponible');
            $table->integer('stock_minimum')->default(0)->comment('Umbral para alertas');
            $table->jsonb('photos')->nullable()->comment('Array de URLs de fotos');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            // Índices para búsquedas rápidas
            $table->index('category');
            $table->index('code');
            $table->index('name');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};