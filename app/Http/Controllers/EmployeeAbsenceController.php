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
     * Formulario para solicitar nueva ausencia.
     */
    public function create()
    {
        return Inertia::render('Absences/Create');
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
        ]);

        $validated['user_id'] = auth()->id();
        $validated['status'] = 'pending';

        EmployeeAbsence::create($validated);

        return redirect()->route('absences.index')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Solicitud de ausencia enviada. Pendiente de aprobación.',
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