<?php

namespace App\Console\Commands;

use App\Enums\ItemCondition;
use App\Models\InventoryItem;
use Illuminate\Console\Command;

class ReleaseExpiredReservations extends Command
{
    /**
     * Firma del comando.
     *
     * Uso: php artisan inventory:release-expired
     */
    protected $signature = 'inventory:release-expired';

    /**
     * Descripción mostrada en `php artisan list`.
     */
    protected $description = 'Libera items reservados cuya fecha de reserva expiró';

    /**
     * Ejecuta el comando.
     *
     * Busca todos los items con condición RESERVADO y `reserved_until`
     * en el pasado, y los devuelve a BUENO (estado disponible más común).
     *
     * ¿Por qué BUENO y no NUEVO?
     * - Un item reservado ya estuvo en uso (aunque sea brevemente), así que
     *   no debería volver a NUEVO.
     * - BUENO indica "usado, en buen estado, disponible para asignar".
     * - Si el item estaba en CON_DETALLES antes de reservarse, se pierde esa
     *   información. Si eso importa, considera agregar una columna
     *   `condition_before_reservation` para restaurar el estado previo.
     *
     * Programado en `routes/console.php` o `app/Console/Kernel.php` para
     * ejecutarse cada hora. También puede invocarse manualmente.
     */
    public function handle(): int
    {
        $this->info('Buscando reservas expiradas...');

        $released = InventoryItem::where('condition', ItemCondition::RESERVADO)
            ->whereNotNull('reserved_until')
            ->where('reserved_until', '<', now())
            ->update([
                'condition' => ItemCondition::BUENO,
                'reserved_until' => null,
            ]);

        if ($released === 0) {
            $this->info('No había reservas expiradas.');
            return self::SUCCESS;
        }

        $this->info("Se liberaron {$released} items reservados.");

        return self::SUCCESS;
    }
}