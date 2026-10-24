<?php

namespace App\Http\Controllers;

use App\Models\EmployeeAbsence;
use App\Models\User;
use App\Services\AvailabilityService;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Controlador de ausencias de empleados.
 *
 * Maneja:
 * - Solicitudes de ausencia (empleado)
 * - Aprobación/rechazo (admin)
 * - Calendario de disponibilidad (admin)
 */
class EmployeeAbsenceController extends Controller
{
    /**
     * Listado de ausencias (admin) o propias (empleado).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $isAdmin = $user->hasRole('Administrador');

        // Si es admin, ve todas las ausencias.
        // Si es empleado, solo las propias.
        $query = EmployeeAbsence::with(['user:id,name,email', 'approvedBy:id,name'])
            ->when(! $isAdmin, fn ($q) => $q->where('user_id', $user->id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->orderByDesc('starts_at');

        return Inertia::render('Absences/Index', [
            'absences' => $query->paginate(20),
            'filters' => [
                'status' => $request->status,
            ],
            'is_admin' => $isAdmin,
            'vacation_days' => [
                'total' => $user->vacation_days_total,
                'used' => $user->vacation_days_used,
                'available' => $user->vacation_days_available,
            ],
        ]);
    }

    /**
     * Muestra el formulario de solicitud de ausencia.
     *
     * Si el usuario es Admin, le pasamos la lista de empleados
     * para que pueda solicitar ausencias en nombre de otros.
     */
    public function create(Request $request)
    {
        $isAdmin = $request->user()->hasRole('Administrador');

        return Inertia::render('Absences/Create', [
            'is_admin' => $isAdmin,
            // Solo cargar empleados si es admin (para el selector)
            'employees' => $isAdmin
                ? \App\Models\User::where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'name', 'email'])
                : [],
        ]);
    }

    /**
     * Guardar solicitud de ausencia.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:vacation,permission,medical,personal,bereavement,unpaid,training,other',
            'starts_at' => 'required|date|after_or_equal:today',
            'ends_at' => 'required|date|after_or_equal:starts_at',
            'reason' => 'nullable|string|max:500',
            'user_id' => 'nullable|exists:users,id', // ← NUEVO
        ]);

        // Si es Admin y eligió un empleado, usar ese. Si no, usar el logueado.
        $isAdmin = auth()->user()->hasRole('Administrador');
        $validated['user_id'] = ($isAdmin && isset($validated['user_id']) && $validated['user_id'])
            ? $validated['user_id']
            : auth()->id();

        $validated['status'] = 'pending';

        // Si es Admin creando la ausencia, la aprobamos directamente
        if ($isAdmin) {
            $validated['status'] = 'approved';
            $validated['approved_by'] = auth()->id();
            $validated['approved_at'] = now();

            // Descontar días si es vacación
            if ($validated['type'] === 'vacation') {
                $absence = EmployeeAbsence::create($validated);
                $absence->user->increment('vacation_days_used', $absence->business_days);

                return redirect()->route('absences.index')
                    ->with('toast', [
                        'type' => 'success',
                        'message' => 'Ausencia creada y aprobada automáticamente.',
                    ]);
            }
        }

        EmployeeAbsence::create($validated);

        return redirect()->route('absences.index')
            ->with('toast', [
                'type' => 'success',
                'message' => $isAdmin
                    ? 'Ausencia creada y aprobada.'
                    : 'Solicitud enviada. Pendiente de aprobación.',
            ]);
    }

    /**
     * Ver detalle de una ausencia.
     */
    public function show(EmployeeAbsence $absence)
    {
        $absence->load(['user', 'approvedBy']);

        return Inertia::render('Absences/Show', [
            'absence' => $absence,
        ]);
    }

    /**
     * Aprobar una ausencia (solo admin).
     *
     * Al aprobar:
     * 1. Cambia status a "approved"
     * 2. Si es vacación, descuenta días del cupo
     * 3. Verifica conflictos con servicios asignados
     */
    public function approve(EmployeeAbsence $absence, AvailabilityService $availability)
    {
        if (! auth()->user()->hasRole('Administrador')) {
            abort(403);
        }

        $absence->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        // Si es vacación, descontar días
        if ($absence->type === 'vacation') {
            $days = $absence->business_days;
            $absence->user->increment('vacation_days_used', $days);
        }

        // Verificar conflictos con servicios ya asignados
        $conflicts = $availability->getAbsenceConflicts($absence);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Ausencia aprobada.' . 
                (count($conflicts) > 0 
                    ? " ⚠️ Tiene " . count($conflicts) . " servicio(s) asignado(s). Revisá el calendario."
                    : ''),
        ]);
    }

    /**
     * Rechazar una ausencia (solo admin).
     */
    public function reject(Request $request, EmployeeAbsence $absence)
    {
        if (! auth()->user()->hasRole('Administrador')) {
            abort(403);
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $absence->update([
            'status' => 'rejected',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Ausencia rechazada.',
        ]);
    }
}