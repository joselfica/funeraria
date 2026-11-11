<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Branch;

class CleanTestData extends Command
{
    // El nombre con el que llamarás al comando
    protected $signature = 'app:clean-test-data';

    // La descripción que verás en php artisan list
    protected $description = 'Elimina sucursales de prueba creadas durante el desarrollo';

    public function handle()
    {
        // Busca sucursales cuyo código empiece con "suc-" y sean de prueba
        // (Ajusta esta lógica según tus necesidades)
        $branches = Branch::whereIn('code', ['suc-03', 'SUC-TEST'])->get();

        if ($branches->isEmpty()) {
            $this->info('No se encontraron sucursales de prueba para eliminar.');
            return;
        }

        foreach ($branches as $branch) {
            $branch->forceDelete(); // Borra físicamente ignorando el soft delete si lo tuvieras
            $this->info("Sucursal '{$branch->name}' eliminada.");
        }

        $this->info('Limpieza completada.');
    }
}