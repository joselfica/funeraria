<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('login_guard_lockouts', function (Blueprint $table) {
            $table->id();
            $table->string('subject', 16);
            $table->string('identifier');
            $table->unsignedSmallInteger('level')->default(1);
            $table->timestamp('locked_until');
            $table->timestamp('last_locked_at');
            $table->timestamps();

            $table->unique(['subject', 'identifier']);
            $table->index('locked_until');
        });

        Schema::create('login_guard_events', function (Blueprint $table) {
            $table->id();
            $table->string('type', 32);
            $table->string('ip', 45)->nullable();
            $table->string('username')->nullable();
            $table->string('user_agent')->nullable();
            $table->json('details')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['type', 'created_at']);
            $table->index(['ip', 'created_at']);
            $table->index(['username', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('login_guard_events');
        Schema::dropIfExists('login_guard_lockouts');
    }
};
