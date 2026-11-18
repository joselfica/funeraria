<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Mapeo de valores antiguos -> nuevos
        $map = [
            'nuevo'   => 'disponible',
            'bueno'   => 'disponible',
            'regular' => 'con_detalles', // o 'disponible' según tu criterio
            'danado'  => 'con_detalles',
            'dañado'  => 'con_detalles', // por si acaso
            'reservado' => 'reservado',
            'en_servicio' => 'en_servicio',
            'en_transito' => 'en_transito',
            'disponible' => 'disponible',
            'con_detalles' => 'con_detalles',
        ];

        foreach ($map as $old => $new) {
            DB::table('inventory_items')
                ->where('condition', $old)
                ->update(['condition' => $new]);
        }
    }

    public function down(): void
    {
        // Revertir: volver a los valores anteriores
        // (opcional, pero útil si haces rollback)
        DB::table('inventory_items')
            ->where('condition', 'con_detalles')
            ->update(['condition' => 'danado']);

        DB::table('inventory_items')
            ->where('condition', 'disponible')
            ->update(['condition' => 'nuevo']);
    }
};