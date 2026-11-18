<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Valores antiguos → nuevos valores del enum ItemCondition
        $map = [
            'nuevo'          => 'disponible',
            'bueno'          => 'disponible',
            'con_detalles'   => 'en_reparacion',
            'danado'         => 'en_reparacion',
            'para_reparar'   => 'en_reparacion',
            'en_servicio'    => 'reservado',
            'en_transito'    => 'disponible', // ajusta según tu negocio
        ];

        foreach ($map as $old => $new) {
            DB::table('inventory_items')
                ->where('condition', $old)
                ->update(['condition' => $new]);
        }

        // Por seguridad: cualquier valor no reconocido → disponible
        $valid = ['disponible', 'en_reparacion', 'reservado', 'no_disponible'];
        DB::table('inventory_items')
            ->whereNotIn('condition', $valid)
            ->whereNotNull('condition')
            ->update(['condition' => 'disponible']);

        // Items sin condición → disponible
        DB::table('inventory_items')
            ->whereNull('condition')
            ->update(['condition' => 'disponible']);
    }

    public function down(): void
    {
        // Reversión aproximada (no recupera el valor exacto original)
        DB::table('inventory_items')
            ->where('condition', 'en_reparacion')
            ->update(['condition' => 'con_detalles']);
    }
};