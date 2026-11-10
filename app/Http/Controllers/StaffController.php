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
        ->where('is_active', true)
        // Esta es la línea mágica que excluye a los clientes
        ->whereHas('roles', function ($query) {
            $query->whereIn('name', ['Administrador', 'Encargado', 'Chofer']);
        })
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
            \App\Models\Driver::create([
                'user_id' => $user->id,
                'rut' => $request->input('rut', ''),
                'phone' => $request->input('phone', ''),
                'license_number' => $request->input('license_number', ''),
                'license_type' => $request->input('license_type', 'A1'),
                'license_expires_at' => now()->addYears(2),
                'plate' => $request->input('plate', ''),
                'vehicle_brand' => $request->input('vehicle_brand', ''),
                'vehicle_model' => $request->input('vehicle_model', ''),
                'vehicle_color' => $request->input('vehicle_color', ''),
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
}