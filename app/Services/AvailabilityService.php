<?php

namespace App\Services;

use App\Models\EmployeeAbsence;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;

/**
 * Servicio de disponibilidad de personal.
 *
 * Centraliza la lógica de "quién puede trabajar en qué fecha".
 * Se usa antes de asignar empleados a servicios.
 */
class AvailabilityService
{
    /**
     * Verifica si un usuario está disponible en una fecha específica.
     *
     * Reglas:
     * 1. Debe estar activo (is_active = true)
     * 2. No debe tener ausencia aprobada en esa fecha
     *
     * @param User $user
     * @param Carbon $date
     * @return bool
     */
    public function isUserAvailable(User $user, Carbon $date): bool
    {
        // Verificar que esté activo en la empresa
        if (! $user->is_active) {
            return false;
        }

        // Verificar que no tenga ausencia aprobada en esa fecha
        $hasAbsence = EmployeeAbsence::where('user_id', $user->id)
            ->where('status', 'approved')
            ->where('starts_at', '<=', $date->toDateString())
            ->where('ends_at', '>=', $date->toDateString())
            ->exists();

        return ! $hasAbsence;
    }

    /**
     * Obtiene todos los usuarios disponibles en una fecha.
     *
     * @param Carbon $date
     * @param string|null $role Filtro opcional por rol (ej: 'Encargado')
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAvailableUsers(Carbon $date, ?string $role = null)
    {
        $query = User::where('is_active', true)
            ->whereDoesntHave('absences', function ($q) use ($date) {
                $q->where('status', 'approved')
                    ->where('starts_at', '<=', $date->toDateString())
                    ->where('ends_at', '>=', $date->toDateString());
            });

        if ($role) {
            $query->role($role);
        }

        return $query->orderBy('name')->get();
    }

    /**
     * Verifica si una ausencia tiene conflictos con servicios asignados.
     *
     * Se usa al aprobar una ausencia: si el empleado ya tiene servicios
     * en esas fechas, se debe notificar al admin para que reasigne.
     *
     * @param EmployeeAbsence $absence
     * @return array Lista de servicios en conflicto
     */
    public function getAbsenceConflicts(EmployeeAbsence $absence): array
    {
        return $absence->user->assignedServices()
            ->whereBetween('services.scheduled_at', [
                $absence->starts_at->startOfDay(),
                $absence->ends_at->endOfDay(),
            ])
            ->get()
            ->toArray();
    }

    /**
     * Verifica si el usuario ya tiene otro servicio asignado que se solape
     * en el tiempo con el servicio dado.
     *
     * Dos rangos se solapan cuando cada uno empieza antes de que termine el
     * otro. Esto cubre todos los casos (empieza dentro, termina dentro o
     * engloba al otro). Servicios consecutivos (uno termina justo cuando
     * empieza el otro) no cuentan como choque.
     *
     * Se ignoran el propio servicio (útil al editar) y los rechazados.
     */
    public function hasScheduleConflict(User $user, Service $service): bool
    {
        $start = Carbon::parse($service->scheduled_at);
        $end = $service->ends_at
            ? Carbon::parse($service->ends_at)
            : $start->copy()->addHours((int) ($service->duration_hours ?: 1));

        return Service::query()
            ->where('id', '!=', $service->id)
            ->where('status', '!=', 'rejected')
            ->whereHas('assignments', fn ($q) => $q->where('user_id', $user->id))
            ->where('scheduled_at', '<', $end)
            ->where('ends_at', '>', $start)
            ->exists();
    }

    /**
     * Valida que el usuario esté disponible para el servicio.
     *
     * Reglas:
     * 1. No debe tener ausencias aprobadas en la fecha.
     * 2. No debe tener otro servicio asignado en un horario que se solape,
     *    considerando un margen de seguridad para traslados.
     *
     * Se permite múltiples servicios el mismo día siempre que no se solapen
     * y respeten el margen entre uno y otro.
     *
     * @throws \Exception si no está disponible
     */
    public function validateAssignment(User $user, Service $service): void
    {
        // ─────────────────────────────────────────────────────────
        // 1. Verificar ausencias aprobadas
        // ─────────────────────────────────────────────────────────
        $hasAbsence = $user->absences()
            ->where('status', 'approved')
            ->where(function ($q) use ($service) {
                $q->whereBetween('starts_at', [$service->scheduled_at, $service->ends_at])
                  ->orWhereBetween('ends_at', [$service->scheduled_at, $service->ends_at])
                  ->orWhere(function ($sub) use ($service) {
                      $sub->where('starts_at', '<=', $service->scheduled_at)
                          ->where('ends_at', '>=', $service->ends_at);
                  });
            })
            ->exists();

        if ($hasAbsence) {
            throw new \Exception("{$user->name} no está disponible: tiene una ausencia aprobada en esa fecha.");
        }

        // ─────────────────────────────────────────────────────────
        // 2. Verificar choque de horarios con otros servicios
        // ─────────────────────────────────────────────────────────

        // Calcular el inicio y fin del nuevo servicio
        $start = Carbon::parse($service->scheduled_at);
        $end = $service->ends_at
            ? Carbon::parse($service->ends_at)
            : $start->copy()->addHours($service->duration_hours);

        // Margen de seguridad para traslados en La Araucanía: 4 horas
        // (cubre trayectos largos entre comunas: Angol, Villarrica, Pucón, etc.)
        $bufferHours = 4;
        $adjustedStart = $start->copy()->subHours($bufferHours);
        $adjustedEnd = $end->copy()->addHours($bufferHours);

        // Buscar servicios del usuario que se solapen con el rango ajustado
        $conflict = $user->serviceAssignments()
            ->whereHas('service', function ($query) use ($adjustedStart, $adjustedEnd, $service) {
                $query->where('id', '!=', $service->id) // Excluir el servicio actual (en caso de edición)
                    ->where(function ($q) use ($adjustedStart, $adjustedEnd) {
                        // Hay conflicto si:
                        // A) El servicio existente empieza dentro del rango ajustado
                        // B) El servicio existente termina dentro del rango ajustado
                        // C) El servicio existente engloba completamente el rango ajustado
                        $q->whereBetween('scheduled_at', [$adjustedStart, $adjustedEnd])
                          ->orWhereBetween('ends_at', [$adjustedStart, $adjustedEnd])
                          ->orWhere(function ($sub) use ($adjustedStart, $adjustedEnd) {
                              $sub->where('scheduled_at', '<=', $adjustedStart)
                                  ->where('ends_at', '>=', $adjustedEnd);
                          });
                    });
            })
            ->exists();

        if ($conflict) {
            $hours = $bufferHours > 0 ? " (con {$bufferHours}h de margen)" : '';
            throw new \Exception("{$user->name} ya tiene otro servicio asignado en ese horario{$hours}.");
        }
    }
}