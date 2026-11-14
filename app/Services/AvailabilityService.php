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
     * Verifica si un usuario puede ser asignado a un servicio.
     *
     * Valida:
     * - Disponibilidad en la fecha (activo y sin ausencia aprobada)
     * - Que no esté ya asignado al mismo servicio
     * - Que no tenga otro servicio en el mismo horario
     *
     * @throws \Exception Si el usuario no está disponible
     */
    public function validateAssignment(User $user, $service): void
    {
        $serviceDate = Carbon::parse($service->scheduled_at);

        if (! $this->isUserAvailable($user, $serviceDate)) {
            throw new \Exception(
                "El empleado {$user->name} no está disponible en la fecha del servicio."
            );
        }

        // Verificar que no esté ya asignado
        if ($service->assignments()->where('user_id', $user->id)->exists()) {
            throw new \Exception(
                "El empleado {$user->name} ya está asignado a este servicio."
            );
        }

        // Verificar choque de agenda con otros servicios
        if ($this->hasScheduleConflict($user, $service)) {
            throw new \Exception(
                "El empleado {$user->name} ya tiene otro servicio asignado en ese horario."
            );
        }
    }
}