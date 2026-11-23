<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crea la tabla de donaciones.
     *
     * Registra los aportes (en dinero o en especie) que la funeraria
     * recibe de equipos, instituciones o personas, junto con el
     * comprobante firmado y el usuario que la registró.
     */
    public function up(): void
    {
        Schema::create('donations', function (Blueprint $table) {
            $table->id();

            // Identificador público (se usa en URLs y reportes)
            $table->uuid('uuid')->unique();

            // Datos del beneficiario (equipo, institución o representante)
            $table->string('beneficiary_name');                 // Nombre del equipo o institución
            $table->string('beneficiary_rut')->nullable();      // RUT de la institución o representante
            $table->string('contact_person')->nullable();       // Nombre del dirigente o encargado

            // Tipo de donación: dinero o especie (ej. ropa, balones, insumos)
            $table->enum('type', ['dinero', 'especie']);

            // Monto (solo si type = 'dinero')
            $table->decimal('amount', 12, 2)->nullable();       // Monto donado en pesos

            // Descripción del bien (solo si type = 'especie')
            $table->string('description')->nullable();          // Ej: "20 balones", "5 cajas de insumos"

            // Fecha en que se realizó la donación
            $table->date('donation_date');

            // Ruta del comprobante firmado o fotografía del aporte
            $table->string('receipt_path')->nullable();

            // Observaciones libres
            $table->text('notes')->nullable();

            // Usuario que registró la donación en el sistema
            $table->foreignId('created_by')->constrained('users');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Elimina la tabla de donaciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('donations');
    }
};