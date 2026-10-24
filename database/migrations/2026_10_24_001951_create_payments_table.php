<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabla de pagos/abonos asociados a un servicio funerario.
 *
 * Cada registro representa un pago parcial o total del contrato.
 * El saldo pendiente se calcula como: total_price - SUM(payments.amount)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            
            // Servicio al que corresponde el pago
            $table->foreignId('service_id')
                ->constrained()
                ->onDelete('cascade')
                ->comment('Servicio funerario al que se abona');

            // Número de comprobante autogenerado (ej: PAG-2026-0001)
            $table->string('receipt_number', 20)->unique()
                ->comment('Número de comprobante interno');

            // Monto pagado
            $table->decimal('amount', 12, 2)
                ->comment('Monto abonado');

            // Medio de pago (efectivo, transferencia, tarjeta, cheque)
            $table->enum('payment_method', [
                'efectivo',
                'transferencia',
                'tarjeta_credito',
                'tarjeta_debito',
                'cheque',
                'convenio',
            ])->comment('Medio de pago utilizado');

            // Referencia externa (número de transferencia, últimos dígitos tarjeta, etc.)
            $table->string('reference', 100)->nullable()
                ->comment('Referencia del pago (ej: últimos 4 dígitos tarjeta)');

            // Fecha real del pago
            $table->date('payment_date')
                ->comment('Fecha en que se realizó el pago');

            // Comprobante PDF (ruta en storage)
            $table->string('receipt_path')->nullable()
                ->comment('Ruta del comprobante PDF en storage');

            // Notas internas
            $table->text('notes')->nullable()
                ->comment('Observaciones sobre el pago');

            // Auditoría: quién registró el pago
            $table->foreignId('registered_by')
                ->nullable()
                ->constrained('users')
                ->onDelete('set null')
                ->comment('Usuario que registró el pago');

            $table->timestamps();
            $table->softDeletes();

            // Índices para búsquedas
            $table->index('service_id');
            $table->index('payment_date');
            $table->index('payment_method');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};