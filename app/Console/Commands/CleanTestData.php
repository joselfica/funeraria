<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Branch;

class CleanTestData extends Command
{
    protected $signature = 'app:clean-test-data';
    protected $description = 'Elimina sucursales de prueba creadas durante el desarrollo';

    public function handle()
    {
        $branches = Branch::whereIn('code', ['suc-03', 'SUC-TEST'])->get();

        if ($branches->isEmpty()) {
            $this->info('No se encontraron sucursales de prueba para eliminar.');
            return;
        }

        foreach ($branches as $branch) {
            $branch->forceDelete();
            $this->info("Sucursal '{$branch->name}' eliminada.");
        }

        $this->info('Limpieza completada.');
    }
}