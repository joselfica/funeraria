<?php

namespace App\Listeners\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Log;

class HandleLoginAttempts
{
    public function handle(Failed|Login $event): void
    {
        $email = $event->credentials['email'] ?? null;
        
        if (!$email) {
            return;
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            return;
        }

        // ─────────────────────────────────────────────────────────
        // CASO 1: LOGIN FALLIDO
        // ─────────────────────────────────────────────────────────
        if ($event instanceof Failed) {
            // Si ya está bloqueado, no seguir sumando
            if ($user->locked_until && $user->locked_until->isFuture()) {
                return;
            }

            $user->increment('failed_login_attempts');

            if ($user->failed_login_attempts >= 3) {
                // 🔒 Desactivar la cuenta y marcarla como bloqueada
                $user->update([
                    'is_active' => false,
                    'locked_until' => now()->addYears(10), // Bloqueo "permanente" hasta que el admin lo reactive
                ]);
                Log::warning("Cuenta desactivada por intentos fallidos: {$user->email}");
            }
        }

        // ─────────────────────────────────────────────────────────
        // CASO 2: LOGIN EXITOSO
        // ─────────────────────────────────────────────────────────
        if ($event instanceof Login) {
            // Solo limpiamos el contador si la cuenta está activa
            // (no reactivamos automáticamente, eso lo hace el admin)
            if ($user->is_active && $user->failed_login_attempts > 0) {
                $user->update([
                    'failed_login_attempts' => 0,
                    'locked_until' => null,
                ]);
            }
        }
    }
}