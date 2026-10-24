<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Asignación de empleados a servicios funerarios.
 *
 * Permite que un servicio tenga múltiples coordinadores/asistentes.
 * Al asignar, se valida que el empleado esté disponible
 * (no tenga ausencia aprobada en esa fecha).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')
                ->constrained()
                ->onDelete('cascade');

            $table->foreignId('user_id')
                ->constrained()
                ->onDelete('restrict')
                ->comment('Empleado asignado al servicio');

            // Rol dentro del servicio
            $table->enum('role_in_service', [
                'coordinator',  // Coordinador principal
                'assistant',    // Asistente
                'driver',       // Conductor
            ])->default('coordinator');

            $table->text('notes')->nullable()
                ->comment('Observaciones sobre la asignación');

            // Auditoría
            $table->foreignId('assigned_by')
                ->nullable()
                ->constrained('users')
                ->onDelete('set null');

            $table->timestamp('assigned_at')->nullable();
            $table->timestamps();

            // Un empleado no puede estar asignado 2 veces al mismo servicio
            $table->unique(['service_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_assignments');
    }
};