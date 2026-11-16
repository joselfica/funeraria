<?php

namespace App\Enums;

/**
 * Condición física de un item de inventario.
 *
 * Define el estado en que se encuentra un ataúd, urna o cualquier
 * producto del inventario. Se usa para:
 *
 * - Mostrar un badge con color en el listado y el detalle.
 * - Filtrar items por estado (por ejemplo, solo disponibles para asignar).
 * - Restringir la asignación a servicios: un item DAÑADO o PARA_REPARAR
 *   no debería poder asignarse a un expediente.
 * - Llevar trazabilidad del ciclo de vida del producto (nuevo → bueno →
 *   con detalles → para reparar → dañado).
 *
 * El caso RESERVADO es especial: indica que el item ya está comprometido
 * para un servicio (por ejemplo, un ataúd apartado para un velorio
 * próximo) y no debe ofrecerse como disponible para otros servicios.
 *
 * ⚠️ Los valores string se guardan en la columna `condition` de
 * `inventory_items`. Si renombras un caso, debes actualizar los datos
 * existentes en la base de datos.
 */
enum ItemCondition: string
{
    /** Item recién ingresado, sin uso. */
    case NUEVO = 'nuevo';

    /** Item usado pero en buen estado general. */
    case BUENO = 'bueno';

    /** Item con detalles estéticos o funcionales menores. */
    case CON_DETALLES = 'con_detalles';

    /** Item dañado, no apto para uso. */
    case DAÑADO = 'danado';       // Sin ñ para evitar problemas de encoding

    /** Item que requiere reparación antes de volver a usarse. */
    case PARA_REPARAR = 'para_reparar';

    /** Item comprometido para un servicio específico. */
    case RESERVADO = 'reservado';

    /**
     * Etiqueta legible para mostrar en la UI.
     *
     * Se usa en badges, selects y tablas. No debe contener HTML.
     */
    public function label(): string
    {
        return match ($this) {
            self::NUEVO => 'Nuevo',
            self::BUENO => 'Buen estado',
            self::CON_DETALLES => 'Con detalles',
            self::DAÑADO => 'Dañado',
            self::PARA_REPARAR => 'Para reparar',
            self::RESERVADO => 'Reservado',
        };
    }

    /**
     * Clases de Tailwind para pintar el badge según el estado.
     *
     * Devuelve una combinación de `bg-*`, `text-*` y `border-*` lista
     * para usar en el atributo `className` de un `<Badge>` o `<span>`.
     *
     * Paleta:
     * - Verde   → NUEVO (disponible, recién ingresado).
     * - Azul    → BUENO (disponible, con uso previo).
     * - Ámbar   → CON_DETALLES (disponible con reservas).
     * - Rojo    → DAÑADO (no disponible).
     * - Gris    → PARA_REPARAR (no disponible, pendiente de reparación).
     * - Púrpura → RESERVADO (comprometido para un servicio).
     */
    public function color(): string
    {
        return match ($this) {
            self::NUEVO => 'bg-emerald-100 text-emerald-800 border-emerald-200',
            self::BUENO => 'bg-blue-100 text-blue-800 border-blue-200',
            self::CON_DETALLES => 'bg-amber-100 text-amber-800 border-amber-200',
            self::DAÑADO => 'bg-rose-100 text-rose-800 border-rose-200',
            self::PARA_REPARAR => 'bg-slate-100 text-slate-800 border-slate-200',
            self::RESERVADO => 'bg-purple-100 text-purple-800 border-purple-200',
        };
    }

    /**
     * Indica si el item está disponible para asignarse a un servicio.
     *
     * Un item reservado, dañado o para reparar no debería asignarse
     * a un nuevo expediente. Este helper centraliza esa regla para que
     * el controlador y el frontend no la dupliquen.
     */
    public function isAvailable(): bool
    {
        return match ($this) {
            self::NUEVO, self::BUENO, self::CON_DETALLES => true,
            self::DAÑADO, self::PARA_REPARAR, self::RESERVADO => false,
        };
    }

    /**
     * Estados que se ofrecen al crear/editar un item manualmente.
     *
     * Excluye RESERVADO porque ese estado lo asigna el sistema al
     * comprometer el item con un servicio, no el usuario desde el CRUD.
     * Si quieres permitir reservarlo manualmente, agrega el caso aquí.
     *
     * @return array<int, self>
     */
    public static function manualOptions(): array
    {
        return array_filter(
            self::cases(),
            fn (self $case) => $case !== self::RESERVADO
        );
    }
}