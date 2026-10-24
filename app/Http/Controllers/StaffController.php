<?php

namespace App\Http\Controllers;

use App\Models\EmployeeAbsence;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Controlador para la gestión del Personal (Modo Renato).
 * 
 * Muestra a todos los empleados, su estado actual (disponible/ausente),
 * sus roles y permite asignarles ausencias rápidamente.
 */
class StaffController extends Controller
{
    /**
     * Listado de todo el personal.
     */
    public function index()
    {
        $today = Carbon::today();

        // Traemos todos los usuarios con sus roles y sus ausencias de hoy
        $staff = User::with(['roles', 'absences' => function ($q) use ($today) {
            $q->where('status', 'approved')
              ->where('starts_at', '<=', $today)
              ->where('ends_at', '>=', $today);
        }])
        ->where('is_active', true)
        ->orderBy('name')
        ->get()
        ->map(function ($user) {
            // Verificar si está ausente hoy
            $currentAbsence = $user->absences->first();
            
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name'),
                'is_available' => ! $currentAbsence, // Si no tiene ausencia, está disponible
                'current_absence' => $currentAbsence ? [
                    'type' => $currentAbsence->type_label,
                    'ends_at' => $currentAbsence->ends_at->format('d/m/Y'),
                ] : null,
                'vacation_days_available' => $user->vacation_days_available,
                'vacation_days_total' => $user->vacation_days_total,
            ];
        });

        return Inertia::render('Staff/Index', [
            'staff' => $staff,
        ]);
    }

    /**
     * Ficha individual del empleado.
     */
    public function show(User $user)
    {
        $user->load(['roles', 'absences' => function ($q) {
            $q->orderByDesc('starts_at');
        }]);

        return Inertia::render('Staff/Show', [
            'employee' => $user,
            'all_roles' => \Spatie\Permission\Models\Role::all(['id', 'name']),
        ]);
    }

    /**
     * Actualiza los roles del empleado (Solo Admin).
     */
    public function updateRoles(Request $request, User $user)
    {
        if (! auth()->user()->hasRole('Administrador')) {
            abort(403, 'Solo el Administrador puede cambiar roles.');
        }

        $validated = $request->validate([
            'roles' => 'array',
            'roles.*' => 'exists:roles,name',
        ]);

        $user->syncRoles($validated['roles'] ?? []);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Roles actualizados correctamente.',
        ]);
    }
}