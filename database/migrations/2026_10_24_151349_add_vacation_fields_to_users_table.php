<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Agrega campos de gestión de vacaciones al modelo User.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)
                ->after('email_verified_at')
                ->comment('Si el empleado sigue activo en la empresa');

            $table->integer('vacation_days_total')->default(15)
                ->after('is_active')
                ->comment('Días de vacaciones anuales (Chile: 15)');

            $table->integer('vacation_days_used')->default(0)
                ->after('vacation_days_total')
                ->comment('Días de vacaciones usados este año');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_active', 'vacation_days_total', 'vacation_days_used']);
        });
    }
};