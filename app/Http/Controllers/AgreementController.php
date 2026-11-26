<?php

namespace App\Http\Controllers;

use App\Models\Agreement;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Controlador de Convenios (Agreements).
 *
 * Gestiona el CRUD básico de convenios comerciales con instituciones
 * externas (club deportivo, municipalidad, AFP, empresa, etc.) que
 * otorgan descuentos a sus asociados en servicios funerarios.
 *
 * Reglas de negocio:
 *   - Los convenios NO se eliminan: se "desactivan" con `is_active = false`
 *     (ver `toggleActive`). Así los servicios históricos que los usaron
 *     conservan la referencia.
 *   - `rut` es único cuando viene informado, pero puede ser null (grupos
 *     informales sin RUT formal).
 *   - `discount_percentage` es un porcentaje entre 0 y 100.
 */
class AgreementController extends Controller
{
    /**
     * Listado de convenios.
     *
     * Ordena primero los convenios activos (`is_active = true`) y, dentro
     * de cada grupo, alfabéticamente por nombre. De esta forma el admin ve
     * arriba los convenios vigentes sin tener que filtrar.
     */
    public function index()
    {
        $agreements = Agreement::orderByDesc('is_active')
            ->orderBy('name')
            ->get();

        return Inertia::render('Agreements/Index', [
            'agreements' => $agreements,
        ]);
    }

    /**
     * Crea un nuevo convenio.
     *
     * Validaciones:
     *   - `name`: obligatorio, string, máx. 255.
     *   - `rut`: opcional, único en `agreements.rut` si viene informado.
     *   - `contact_person`, `phone`, `email`: opcionales y con formato
     *     de email válido para este último.
     *   - `discount_percentage`: obligatorio, numérico, entre 0 y 100.
     *   - `notes`: opcional, texto libre.
     *
     * El convenio se crea siempre como activo (`is_active = true`); para
     * desactivarlo después se usa `toggleActive()`.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rut' => 'nullable|string|max:20|unique:agreements,rut',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'discount_percentage' => 'required|numeric|min:0|max:100',
            'notes' => 'nullable|string',
        ]);

        Agreement::create([
            ...$validated,
            'is_active' => true,
        ]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Convenio registrado correctamente.',
        ]);
    }

    /**
     * Activa o desactiva un convenio (toggle).
     *
     * No elimina el convenio: solo invierte `is_active`. Esto preserva la
     * trazabilidad histórica (los servicios que lo usaron siguen
     * apuntando a un convenio existente).
     *
     * Devuelve un toast con el nuevo estado para feedback inmediato.
     */
    public function toggleActive(Agreement $agreement)
    {
        $agreement->update([
            'is_active' => !$agreement->is_active,
        ]);

        $status = $agreement->is_active ? 'activado' : 'desactivado';

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Convenio {$agreement->name} {$status}.",
        ]);
    }
}