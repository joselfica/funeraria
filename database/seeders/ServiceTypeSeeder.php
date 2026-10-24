<?php

namespace Database\Seeders;

use App\Models\ServiceType;
use Illuminate\Database\Seeder;

class ServiceTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'code' => 'VEL-24H',
                'name' => 'Velatorio 24 horas',
                'description' => 'Velatorio en capilla por 24 horas con servicio completo',
                'base_price' => 850000,
                'duration_hours' => 24,
                'sort_order' => 1,
            ],
            [
                'code' => 'VEL-12H',
                'name' => 'Velatorio 12 horas',
                'description' => 'Velatorio en capilla por 12 horas',
                'base_price' => 550000,
                'duration_hours' => 12,
                'sort_order' => 2,
            ],
            [
                'code' => 'CRE-001',
                'name' => 'Cremación',
                'description' => 'Servicio de cremación con urna básica incluida',
                'base_price' => 650000,
                'duration_hours' => 4,
                'sort_order' => 3,
            ],
            [
                'code' => 'INH-001',
                'name' => 'Inhumación',
                'description' => 'Servicio de inhumación en cementerio',
                'base_price' => 450000,
                'duration_hours' => 4,
                'sort_order' => 4,
            ],
            [
                'code' => 'TRA-001',
                'name' => 'Traslado',
                'description' => 'Traslado de cuerpo a otra ciudad o región',
                'base_price' => 350000,
                'duration_hours' => 8,
                'sort_order' => 5,
            ],
            [
                'code' => 'SRV-BAS',
                'name' => 'Servicio básico',
                'description' => 'Servicio funerario básico sin velatorio',
                'base_price' => 250000,
                'duration_hours' => 2,
                'sort_order' => 6,
            ],
        ];

        foreach ($types as $type) {
            ServiceType::create($type);
        }

        $this->command->info('6 tipos de servicio creados.');
    }
}