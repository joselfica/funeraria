<?php

namespace App\Http\Controllers;

use App\Models\EmployeeAbsence;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
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
     * Verifica si el usuario actual tiene permiso sobre el usuario objetivo.
     *
     * - Administrador: puede gestionar a cualquiera.
     * - Encargado: puede gestionar a Choferes y a otros Encargados,
     *   pero NO a Administradores.
     */
    private function authorizeUserManagement(User $targetUser): void
    {
        $currentUser = auth()->user();

        // Si el usuario actual es Administrador, puede hacer todo.
        if ($currentUser->hasRole('Administrador')) {
            return;
        }

        // Si el usuario actual es Encargado y quiere modificar a un Administrador, lo bloqueamos.
        if ($currentUser->hasRole('Encargado') && $targetUser->hasRole('Administrador')) {
            abort(403, 'No tienes permisos para modificar a un Administrador.');
        }
    }

    /**
     * Listado de todo el personal.
     */
    public function index()
    {
        $today = Carbon::today();

        // 🛡️ FILTRO: Solo traemos usuarios que tengan alguno de los roles de empleados
        $staff = User::with(['roles', 'absences' => function ($q) use ($today) {
            $q->where('status', 'approved')
              ->where('starts_at', '<=', $today)
              ->where('ends_at', '>=', $today);
        }])
        // Esta es la línea mágica que excluye a los clientes
        ->whereHas('roles', function ($query) {
            $query->whereIn('name', ['Administrador', 'Encargado', 'Chofer']);
        })
        ->orderByDesc('is_active') // activos primero, desactivados al final
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
                'is_active' => $user->is_active,
                'is_available' => ! $currentAbsence, // Si no tiene ausencia, está disponible
                'current_absence' => $currentAbsence ? [
                    'type' => $currentAbsence->type_label,
                    'ends_at' => $currentAbsence->ends_at->format('d/m/Y'),
                ] : null,
                'vacation_days_available' => $user->vacation_days_available,
                'vacation_days_total' => $user->vacation_days_total,
                // Estado de bloqueo por intentos fallidos de login
                'failed_login_attempts' => $user->failed_login_attempts ?? 0,
                'is_locked' => $user->is_locked,
                'locked_until' => $user->locked_until?->format('d/m/Y H:i'),
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
        $this->authorizeUserManagement($user);

        $user->load(['roles', 'absences' => function ($q) {
            $q->orderByDesc('starts_at');
        }]);

        // Estadísticas de ausencias
        $absencesStats = [
            'total' => $user->absences()->count(),
            'approved' => $user->absences()->where('status', 'approved')->count(),
            'pending' => $user->absences()->where('status', 'pending')->count(),
            'rejected' => $user->absences()->where('status', 'rejected')->count(),
            'vacation_days_used' => $user->absences()
                ->where('type', 'vacation')
                ->where('status', 'approved')
                ->get()
                ->sum(fn ($a) => $a->business_days),
        ];

        return Inertia::render('Staff/Show', [
            'employee' => $user,
            'all_roles' => \Spatie\Permission\Models\Role::all(['id', 'name']),
            'absencesStats' => $absencesStats,
        ]);
    }

    /**
     * Actualiza los roles del empleado.
     * Admin y Encargado pueden; Encargado nunca sobre un Administrador
     * ni puede asignar el rol de Administrador.
     */
    public function updateRoles(Request $request, User $user)
    {
        $this->authorizeUserManagement($user);

        if (! auth()->user()->hasAnyRole(['Administrador', 'Encargado'])) {
            abort(403, 'No tienes permiso para cambiar roles.');
        }

        $validated = $request->validate([
            'roles' => 'array',
            'roles.*' => 'exists:roles,name',
        ]);

        // Un Encargado no puede asignar el rol de Administrador a nadie.
        if (auth()->user()->hasRole('Encargado') && in_array('Administrador', $validated['roles'] ?? [], true)) {
            abort(403, 'No tienes permisos para asignar el rol de Administrador.');
        }

        $user->syncRoles($validated['roles'] ?? []);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Roles actualizados correctamente.',
        ]);
    }

    /**
     * Mostrar formulario para crear un nuevo usuario.
     */
    public function create()
    {
        $roles = \Spatie\Permission\Models\Role::query()
            ->when(
                auth()->user()->hasRole('Encargado'),
                fn ($q) => $q->where('name', '!=', 'Administrador')
            )
            ->get(['id', 'name']);

        return Inertia::render('Staff/Create', [
            'roles' => $roles,
        ]);
    }

    /**
     * Guardar un nuevo usuario en el sistema.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'required|email|max:150|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|exists:roles,name',
            'is_active' => 'boolean',

            // Datos del chofer (obligatorios solo si el rol es Chofer)
            'rut' => 'required_if:role,Chofer|nullable|string|max:12',
            'phone' => 'required_if:role,Chofer|nullable|string|max:20',
            'license_number' => 'required_if:role,Chofer|nullable|string|max:50',
            'license_type' => 'nullable|string|max:10',
            'plate' => 'nullable|string|max:20',
            'vehicle_brand' => 'nullable|string|max:50',
            'vehicle_model' => 'nullable|string|max:50',
            'vehicle_color' => 'nullable|string|max:30',
        ]);

        // 👇 VALIDACIÓN: Si soy Encargado, no puedo crear un Administrador
        if (auth()->user()->hasRole('Encargado') && $validated['role'] === 'Administrador') {
            abort(403, 'No tienes permisos para crear Administradores.');
        }

        $user = \App\Models\User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'email_verified_at' => now(), // Verificado por el admin
            'is_active' => $validated['is_active'] ?? true,
        ]);

        // Asignar rol
        $user->assignRole($validated['role']);

        // Si es Chofer, crear el registro en la tabla drivers
        if ($validated['role'] === 'Chofer') {
            // Laravel convierte '' en null (ConvertEmptyStringsToNull), por eso
            // se usa ?? '' para las columnas NOT NULL de la tabla drivers.
            \App\Models\Driver::create([
                'user_id' => $user->id,
                'rut' => $validated['rut'] ?? '',
                'phone' => $validated['phone'] ?? '',
                'license_number' => $validated['license_number'] ?? '',
                'license_type' => $validated['license_type'] ?? 'A1',
                'license_expires_at' => now()->addYears(2),
                'plate' => $validated['plate'] ?? '',
                'vehicle_brand' => $validated['vehicle_brand'] ?? '',
                'vehicle_model' => $validated['vehicle_model'] ?? '',
                'vehicle_color' => $validated['vehicle_color'] ?? '',
                'is_carroza' => $request->boolean('is_carroza', false),
                'is_active' => true,
            ]);
        }

        return redirect()->route('staff.index')
            ->with('toast', [
                'type' => 'success',
                'message' => "Usuario {$user->name} creado con rol {$validated['role']}.",
            ]);
    }

    /**
     * Cambiar contraseña de un usuario.
     *
     * - Administrador: puede cambiar la contraseña a cualquiera.
     * - Encargado: puede cambiar la contraseña a cualquiera EXCEPTO a un Administrador.
     */
    public function updatePassword(Request $request, User $user)
    {
        // 1. Bloqueo fino: Encargado no puede tocar a un Administrador.
        $this->authorizeUserManagement($user);

        // 2. Solo Admin y Encargado pueden cambiar contraseñas.
        if (! auth()->user()->hasAnyRole(['Administrador', 'Encargado'])) {
            abort(403, 'No tienes permiso para cambiar contraseñas.');
        }

        // 3. Validamos la nueva contraseña.
        $validated = $request->validate([
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // 4. Actualizamos.
        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Contraseña actualizada correctamente.',
        ]);
    }

    /**
     * Eliminar (soft delete) un usuario.
     */
    public function destroy(User $user)
    {
        // Protección: nunca eliminar usuarios desde la UI
        abort(403, 'Por razones de auditoría, los usuarios no se pueden eliminar. Solo desactivar.');
    }

    /**
     * Desbloquea la cuenta de un empleado (resetea los intentos fallidos).
     * Admin y Encargado pueden; Encargado nunca sobre un Administrador.
     */
    public function unlock(User $user)
    {
        $this->authorizeUserManagement($user);

        if (! auth()->user()->hasAnyRole(['Administrador', 'Encargado'])) {
            abort(403, 'No tienes permiso para desbloquear cuentas.');
        }

        $user->update([
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => "La cuenta de {$user->name} ha sido desbloqueada.",
        ]);
    }

    /**
     * Activar o desactivar un usuario.
     * Admin y Encargado pueden; Encargado nunca sobre un Administrador.
     */
    public function toggleActive(User $user)
    {
        $this->authorizeUserManagement($user);

        $currentUser = auth()->user();

        // Admin y Encargado pueden activar/desactivar.
        if (! $currentUser->hasAnyRole(['Administrador', 'Encargado'])) {
            abort(403, 'No tienes permiso para activar o desactivar usuarios.');
        }

        // Nadie puede desactivarse a sí mismo.
        if ($user->id === $currentUser->id) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'No puedes desactivar tu propio usuario.',
            ]);
        }

        $activating = ! $user->is_active;

        // Toggle. Al activar, también se limpian los intentos fallidos y el
        // bloqueo en la misma operación (un solo UPDATE).
        $user->update($activating
            ? [
                'is_active' => true,
                'failed_login_attempts' => 0,
                'locked_until' => null,
            ]
            : ['is_active' => false]
        );

        if ($activating) {
            return back()->with('toast', [
                'type' => 'success',
                'message' => "Usuario {$user->name} reactivado. Ya puede iniciar sesión.",
            ]);
        }

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Usuario {$user->name} desactivado. Sus sesiones fueron cerradas.",
        ]);
    }
}