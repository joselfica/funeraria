<?php

namespace App\Listeners\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class HandleLoginAttempts
{
    /**
     * Escucha múltiples eventos: Failed (login fallido) y Login (login exitoso).
     */
    public function handle(Failed|Login $event): void
    {
        // Ambos eventos exponen el usuario en $event->user.
        // En Failed es null si el email no existe; Login no trae "credentials".
        $user = $event->user;

        if (! $user instanceof User) {
            return;
        }

        // ─────────────────────────────────────────────────────────
        // CASO 1: LOGIN FALLIDO
        // ─────────────────────────────────────────────────────────
        if ($event instanceof Failed) {
            // Si ya está bloqueado, no seguir sumando intentos
            if ($user->is_locked) {
                return;
            }

            $user->increment('failed_login_attempts');

            if ($user->failed_login_attempts >= 3) {
                $user->update(['locked_until' => now()->addMinutes(15)]);
                Log::warning("Cuenta bloqueada por 15 minutos: {$user->email}");

                throw ValidationException::withMessages([
                    'email' => 'Demasiados intentos fallidos. Tu cuenta ha sido bloqueada por 15 minutos.',
                ]);
            }

            return;
        }

        // ─────────────────────────────────────────────────────────
        // CASO 2: LOGIN EXITOSO
        // ─────────────────────────────────────────────────────────
        if ($user->failed_login_attempts > 0 || $user->locked_until) {
            $user->update([
                'failed_login_attempts' => 0,
                'locked_until' => null,
            ]);
        }
    }
}