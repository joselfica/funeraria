<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        Branch::create([
            'name' => 'Sucursal Blanco 1',
            'code' => 'SUC-01',
            'address' => 'Calle Blanco 123, Temuco',
            'phone' => '+56452123456',
            'email' => 'sucursal1@funerariacristorey.cl',
        ]);

        Branch::create([
            'name' => 'Sucursal Blanco 2',
            'code' => 'SUC-02',
            'address' => 'Calle Blanco 456, Temuco',
            'phone' => '+56452654321',
            'email' => 'sucursal2@funerariacristorey.cl',
        ]);

        $this->command->info('2 sucursales creadas.');
    }
}