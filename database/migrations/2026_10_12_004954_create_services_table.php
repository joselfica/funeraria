<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('code', 20)->unique()->comment('Código interno (ej: SRV-2026-0001)');
            
            // Relaciones principales
            $table->foreignId('client_id')->constrained()->onDelete('restrict');
            $table->foreignId('deceased_id')->constrained('deceased')->onDelete('restrict');
            $table->foreignId('service_type_id')->constrained('service_types')->onDelete('restrict');
            
            // Programación
            $table->dateTime('scheduled_at')->comment('Fecha y hora del servicio');
            $table->integer('duration_hours')->default(24);
            $table->dateTime('ends_at')->nullable()->comment('Fecha/hora de término');
            
            // Estado del flujo
            $table->enum('status', [
                'pending',           // Solicitud creada, sin revisar
                'in_review',         // En revisión por Admin
                'with_observations', // Con observaciones para corregir
                'accepted',          // Aprobada
                'rejected',          // Rechazada ("no aplica")
                'in_progress',       // En ejecución
                'completed',         // Completada
                'cancelled',         // Cancelada por el cliente
            ])->default('pending');
            
            // Estado del cuerpo (para el contexto funerario)
            $table->enum('body_status', [
                'in_site',          // En dependencias de la funeraria
                'in_transit',       // En traslado
                'in_cemetery',      // En cementerio
                'cremated',         // Cremado
                'delivered',        // Entregado a la familia
            ])->nullable();
            
            // Precios
            $table->decimal('base_price', 12, 2)->default(0)->comment('Precio del tipo de servicio');
            $table->decimal('additional_charges', 12, 2)->default(0)->comment('Cargos adicionales');
            $table->decimal('discount', 12, 2)->default(0)->comment('Descuentos');
            $table->decimal('total_price', 12, 2)->default(0)->comment('Total a pagar');
            
            // Aprobación
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->dateTime('approved_at')->nullable();
            $table->text('approval_notes')->nullable();
            $table->text('rejection_reason')->nullable();
            
            // Notas
            $table->text('client_notes')->nullable()->comment('Mensaje del solicitante');
            $table->text('internal_notes')->nullable()->comment('Notas internas (solo Admin)');
            
            $table->timestamps();
            $table->softDeletes();
            
            // Índices críticos para performance
            $table->index('status');
            $table->index('scheduled_at');
            $table->index('client_id');
            $table->index('deceased_id');
            $table->index('code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};