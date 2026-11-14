<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega los campos para rastrear intentos fallidos y bloqueo de cuenta.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Contador de intentos fallidos
            $table->integer('failed_login_attempts')->default(0)->after('password');
            
            // Fecha hasta la cual la cuenta está bloqueada (null = no bloqueada)
            $table->timestamp('locked_until')->nullable()->after('failed_login_attempts');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['failed_login_attempts', 'locked_until']);
        });
    }
};