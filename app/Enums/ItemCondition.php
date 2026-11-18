<?php

namespace App\Enums;

/**
 * Condición / estado de un item de inventario.
 *
 * Define la situación operativa en que se encuentra un ataúd, urna o
 * cualquier producto del inventario. Se usa para:
 *
 * - Mostrar un badge con color en el listado y el detalle.
 * - Filtrar items por estado (por ejemplo, solo disponibles para asignar).
 * - Restringir la asignación a servicios: un item que no esté DISPONIBLE
 *   no debería poder asignarse a un expediente.
 * - Llevar trazabilidad del ciclo de vida del producto.
 *
 * El caso RESERVADO indica que el item está comprometido para un servicio
 * específico y no debe ofrecerse como disponible para otros servicios.
 *
 * El caso NO_DISPONIBLE representa items que ya fueron vendidos y no
 * volverán al inventario disponible.
 *
 * ⚠️ Los valores string se guardan en la columna `condition` de
 * `inventory_items`. Si renombras un caso, debes actualizar los datos
 * existentes en la base de datos.
 */
enum ItemCondition: string
{
    /** Item libre, listo para asignarse a un servicio. */
    case DISPONIBLE = 'disponible';

    /** Item que requiere reparación antes de volver a usarse. */
    case EN_REPARACION = 'en_reparacion';

    /** Item comprometido para un servicio específico. */
    case RESERVADO = 'reservado';

    /** Item ya vendido; no vuelve al inventario disponible. */
    case NO_DISPONIBLE = 'no_disponible';

    /**
     * Etiqueta legible para mostrar en la UI.
     *
     * Se usa en badges, selects y tablas. No debe contener HTML.
     */
    public function label(): string
    {
        return match ($this) {
            self::DISPONIBLE => 'Disponible',
            self::EN_REPARACION => 'En reparación',
            self::RESERVADO => 'Reservado',
            self::NO_DISPONIBLE => 'No disponible (vendido)',
        };
    }

    /**
     * Clases de Tailwind para pintar el badge según el estado.
     *
     * Devuelve una combinación de `bg-*`, `text-*` y `border-*` lista
     * para usar en el atributo `className` de un `<Badge>` o `<span>`.
     *
     * Paleta:
     * - Verde   → DISPONIBLE (libre para asignar).
     * - Ámbar   → EN_REPARACION (no disponible, pendiente de reparación).
     * - Púrpura → RESERVADO (comprometido para un servicio).
     * - Rojo    → NO_DISPONIBLE (vendido, fuera de inventario).
     */
    public function color(): string
    {
        return match ($this) {
            self::DISPONIBLE => 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
            self::EN_REPARACION => 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
            self::RESERVADO => 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300',
            self::NO_DISPONIBLE => 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300',
        };
    }

    /**
     * Indica si el item está disponible para asignarse a un servicio.
     *
     * Solo DISPONIBLE puede asignarse. El resto de estados (en reparación,
     * reservado o vendido) bloquea la asignación. Este helper centraliza
     * la regla para que el controlador y el frontend no la dupliquen.
     */
    public function isAvailable(): bool
    {
        return $this === self::DISPONIBLE;
    }

    /**
     * Estados que se ofrecen al crear/editar un item manualmente.
     *
     * Excluye RESERVADO y NO_DISPONIBLE porque no tiene sentido crear un
     * item ya comprometido o vendido. Esos estados sí se pueden cambiar
     * después desde el selector de estado del listado.
     *
     * @return array<int, self>
     */
    public static function manualOptions(): array
    {
        return [
            self::DISPONIBLE,
            self::EN_REPARACION,
        ];
    }
}