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

    /**
     * Mostrar formulario para crear un nuevo usuario.
     */
    public function create()
    {
        return Inertia::render('Staff/Create', [
            'roles' => \Spatie\Permission\Models\Role::all(['id', 'name']),
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
     * Cambiar contraseña de un usuario (solo Admin).
     */
    public function updatePassword(Request $request, \App\Models\User $user)
    {
        if (! auth()->user()->hasRole('Administrador')) {
            abort(403, 'Solo el Administrador puede cambiar contraseñas.');
        }

        $validated = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user->update([
            'password' => bcrypt($validated['password']),
        ]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Contraseña actualizada correctamente.',
        ]);
    }

    /**
     * Eliminar (soft delete) un usuario.
     */
    public function destroy(\App\Models\User $user)
    {
        // Protección: nunca eliminar usuarios desde la UI
        abort(403, 'Por razones de auditoría, los usuarios no se pueden eliminar. Solo desactivar.');

        if (! auth()->user()->hasRole('Administrador')) {
            abort(403, 'Solo el Administrador puede eliminar usuarios.');
        }

        // No permitir que el admin se elimine a sí mismo
        if ($user->id === auth()->id()) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'No puedes eliminar tu propio usuario.',
            ]);
        }

        // Si es chofer, eliminar también el registro de driver
        if ($user->hasRole('Chofer') && $user->driver) {
            $user->driver->delete();
        }

        $user->delete();

        return redirect()->route('staff.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Usuario eliminado correctamente.',
            ]);
    }

    /**
     * Desbloquea la cuenta de un empleado (resetea los intentos fallidos).
     * Solo el Administrador puede desbloquear.
     */
    public function unlock(User $user)
    {
        if (! auth()->user()->hasRole('Administrador')) {
            abort(403, 'Solo el Administrador puede desbloquear cuentas.');
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
     * Al desactivar, las sesiones activas se invalidan automáticamente.
     */
    public function toggleActive(User $user)
    {
        $currentUser = auth()->user();

        // Solo el Admin puede activar/desactivar usuarios
        if (! $currentUser->hasRole('Administrador')) {
            abort(403, 'Solo el Administrador puede activar o desactivar usuarios.');
        }

        // No permitir que el admin se desactive a sí mismo
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