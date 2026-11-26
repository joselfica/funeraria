<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Carbon\Carbon;
use Inertia\Inertia;

/**
 * Controlador del Panel Principal para Choferes.
 *
 * Este controlador gestiona la vista del chofer autenticado. A diferencia del
 * DashboardController (que muestra métricas globales del negocio), aquí solo
 * se exponen los servicios que le fueron asignados al chofer logueado.
 *
 * Reglas de negocio clave:
 *   - Un chofer solo ve los servicios donde figura como asignado en la tabla
 *     de asignaciones (relación `assignments` del modelo Service).
 *   - El alcance de cada sección (hoy / próximos / detalle) siempre se filtra
 *     por ese `user_id`, para evitar que un chofer vea servicios de otro.
 *   - Solo se consideran servicios en estados operativos ('accepted',
 *     'in_progress'); los 'pending' o 'rejected' no son relevantes para el
 *     chofer porque aún no están aprobados o ya fueron descartados.
 */
class DriverController extends Controller
{
    /**
     * Fecha del hito que le importa al chofer, según el tipo de servicio:
     *   - Urna (cremación): scheduled_at (el momento real de la cremación).
     *   - Ataúd (entierro): burial_at (la fecha del sepelio).
     * Si un entierro aún no tiene burial_at, la expresión es NULL y el servicio
     * no aparece en ninguna lista hasta que se le asigne fecha.
     */
    private const EVENT_AT = "CASE WHEN services.service_type = 'urna' THEN services.scheduled_at ELSE services.burial_at END";

    /**
     * Panel principal del chofer.
     *
     * Devuelve dos bloques de datos a la vista:
     *   1. todayServices:    el sepelio/cremación que ocurre exactamente HOY
     *                        (sin anticipación: nada de días anteriores ni posteriores).
     *   2. upcomingServices: los próximos sepelios/cremaciones (desde mañana en
     *                        adelante), limitados a 10.
     *
     * Cada bloque se formatea con `formatService()` para mantener un contrato
     * estable y liviano hacia el frontend (solo los campos que la vista usa).
     */
    public function index()
    {
        $user = auth()->user();

        // Límites del día en hora de Chile, convertidos a la zona de la app para
        // compararlos correctamente con lo guardado en la base de datos.
        $appTz = config('app.timezone');
        $startOfDay = Carbon::now('America/Santiago')->startOfDay()->setTimezone($appTz)->toDateTimeString();
        $endOfDay = Carbon::now('America/Santiago')->endOfDay()->setTimezone($appTz)->toDateTimeString();

        // La consulta base: Solo los servicios donde este chofer está asignado
        // (Ajusta 'assignments' o 'driver_id' según cómo manejes la relación en tu modelo Service)
        $baseQuery = Service::with(['client:id,name,phone', 'deceased:id,full_name', 'branch:id,name,address'])
            ->whereHas('assignments', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->whereIn('status', ['accepted', 'in_progress']); // Solo servicios activos

        // 1. SERVICIOS DE HOY: solo el sepelio/cremación que ocurre hoy, sin anticipación
        $todayServices = (clone $baseQuery)
            ->whereRaw('('.self::EVENT_AT.') BETWEEN ? AND ?', [$startOfDay, $endOfDay])
            ->orderByRaw(self::EVENT_AT.' asc')
            ->get();

        // 2. PRÓXIMOS SERVICIOS: los siguientes sepelios/cremaciones (desde mañana en adelante)
        $upcomingServices = (clone $baseQuery)
            ->whereRaw('('.self::EVENT_AT.') > ?', [$endOfDay])
            ->orderByRaw(self::EVENT_AT.' asc')
            ->limit(10) // Límite para no saturar
            ->get();

        // Formateamos para React
        return Inertia::render('Driver/Dashboard', [
            'todayServices' => $todayServices->map(fn ($s) => $this->formatService($s)),
            'upcomingServices' => $upcomingServices->map(fn ($s) => $this->formatService($s)),
        ]);
    }

    // Helper para no repetir el mapeo
    private function formatService($s)
    {
        return [
            'id' => $s->id,
            'uuid' => $s->uuid,
            'code' => $s->code,
            'scheduled_at' => $s->scheduled_at->toIso8601String(),
            // Momento del sepelio (ataúd) o de la cremación (urna): es el que define en qué lista aparece
            'event_at' => ($s->service_type?->value === 'urna' ? $s->scheduled_at : $s->burial_at)?->toIso8601String(),
            'event_type' => $s->service_type?->value === 'urna' ? 'cremacion' : 'sepelio',
            'status' => $s->status,
            'status_label' => $s->status_label,
            'service_type_label' => $s->service_type_label,
            'client' => [
                'name' => $s->client?->name ?? 'Sin cliente',
                'phone' => $s->client?->phone,
            ],
            'deceased' => [
                'full_name' => $s->deceased?->full_name ?? 'Sin fallecido',
            ],
            'branch' => $s->branch ? [
                'name' => $s->branch->name,
                'address' => $s->branch->address,
            ] : null,
        ];
    }

    /**
     * Detalle de un servicio asignado al chofer.
     *
     * Reglas de acceso:
     *   - El servicio debe estar asignado al chofer logueado como 'driver'.
     *     Si no, se responde 403 (Forbidden).
     *
     * Se cargan las relaciones `client`, `deceased` y `branch` porque la
     * vista de detalle del chofer las necesita (direcciones, contactos,
     * datos del fallecido, etc.). Los atributos calculados `service_type_label`,
     * `status_label` y `beneficiary_label` se anexan al JSON vía $appends
     * del modelo para no tener que calcularlos en el frontend.
     */
    public function showService(Service $service)
    {
        $user = auth()->user();

        // Verificar que el servicio esté asignado al chofer logueado.
        // Se filtra también por role_in_service='driver' para que un
        // coordinador o asistente asignado no pueda entrar por esta ruta.
        $isAssigned = $service->assignments()
            ->where('user_id', $user->id)
            ->where('role_in_service', 'driver')
            ->exists();

        if (! $isAssigned) {
            abort(403, 'No tienes permiso para ver este servicio.');
        }

        // Cargar relaciones necesarias para la vista de detalle.
        // (No se carga serviceType porque ese enum ya no es una relación).
        $service->load(['client', 'deceased', 'branch']);

        // Anexar atributos calculados al JSON (labels legibles para el front).
        $service->append(['service_type_label', 'status_label', 'beneficiary_label']);

        return Inertia::render('Driver/ServiceShow', [
            'service' => $service,
        ]);
    }
}