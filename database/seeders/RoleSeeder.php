<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Limpiar caché de permisos
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Definir permisos por módulo
        $permissions = [
            // Clientes
            'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
            
            // Inventario (urnas, ataúdes)
            'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
            
            // Vehículos
            'vehicles.view', 'vehicles.create', 'vehicles.edit', 'vehicles.delete',
            
            // Servicios
            'services.view', 'services.create', 'services.edit', 'services.delete',
            
            // Reservas
            'reservations.view', 'reservations.create', 'reservations.approve', 'reservations.cancel',
            
            // Financiero
            'payments.view', 'payments.create',
            
            // Reportes
            'reports.view', 'reports.export',
            
            // Usuarios y configuración
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'settings.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Crear roles
        $admin = Role::firstOrCreate(['name' => 'Administrador']);
        $admin->syncPermissions(Permission::all());

        $coordinador = Role::firstOrCreate(['name' => 'Coordinador']);
        $coordinador->syncPermissions([
            'clients.view', 'clients.create', 'clients.edit',
            'inventory.view',
            'vehicles.view',
            'services.view', 'services.create', 'services.edit',
            'reservations.view', 'reservations.create', 'reservations.cancel',
            'payments.view', 'payments.create',
            'reports.view',
        ]);

        $conductor = Role::firstOrCreate(['name' => 'Conductor']);
        $conductor->syncPermissions([
            'services.view',
        ]);

        $this->command->info('Roles y permisos creados correctamente.');
    }
}