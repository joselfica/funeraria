<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ─────────────────────────────────────────────────────────────
// TAREAS PROGRAMADAS
// ─────────────────────────────────────────────────────────────

// Liberar reservas vencidas todos los días a las 00:00
Schedule::command('inventory:release-expired')->daily();