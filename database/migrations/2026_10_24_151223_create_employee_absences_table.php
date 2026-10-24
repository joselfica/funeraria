<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabla de ausencias de empleados (vacaciones, permisos, licencias).
 *
 * Registra todas las ausencias del personal con su estado de aprobación.
 * Al aprobar una ausencia, el sistema verifica conflictos con servicios
 * ya asignados y notifica al administrador.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_absences', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            // Usuario que solicita la ausencia
            $table->foreignId('user_id')
                ->constrained()
                ->onDelete('cascade')
                ->comment('Empleado que solicita la ausencia');

            // Tipo de ausencia
            $table->enum('type', [
                'vacation',      // Vacaciones anuales
                'permission',    // Permiso administrativo
                'medical',       // Licencia médica
                'personal',      // Día personal
                'bereavement',   // Duelo
                'unpaid',        // Permiso sin goce de sueldo
                'training',      // Capacitación
                'other',         // Otros
            ])->comment('Categoría de la ausencia');

            // Rango de fechas
            $table->date('starts_at')->comment('Fecha de inicio');
            $table->date('ends_at')->comment('Fecha de término');

            // Documento de respaldo (certificado médico, etc.)
            $table->string('document_path')->nullable()
                ->comment('Ruta del documento en storage');

            // Motivo y notas
            $table->text('reason')->nullable()
                ->comment('Motivo de la solicitud (visible para el empleado)');
            $table->text('notes')->nullable()
                ->comment('Notas internas del administrador');

            // Estado del flujo
            $table->enum('status', [
                'pending',    // Solicitado, sin aprobar
                'approved',   // Aprobado
                'rejected',   // Rechazado
                'cancelled',  // Cancelado por el empleado
            ])->default('pending');

            // Aprobación
            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->onDelete('set null')
                ->comment('Administrador que aprobó/rechazó');

            $table->dateTime('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Índices para consultas frecuentes
            $table->index(['user_id', 'status']);
            $table->index(['starts_at', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_absences');
    }
};