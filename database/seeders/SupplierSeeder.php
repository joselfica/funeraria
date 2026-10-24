<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        Supplier::create([
            'name' => 'Proveedor Talca',
            'city' => 'Talca',
            'contact_name' => 'Contacto Talca',
            'phone' => '+5671123456',
            'email' => 'proveedor@talca.cl',
            'delivery_hours' => 72,
            'color_identifier' => 'verde',
        ]);

        Supplier::create([
            'name' => 'Proveedor Santiago',
            'city' => 'Santiago',
            'contact_name' => 'Contacto Santiago',
            'phone' => '+5622345678',
            'email' => 'proveedor@santiago.cl',
            'delivery_hours' => 24,
            'color_identifier' => 'rojo',
        ]);

        $this->command->info('2 proveedores creados.');
    }
}