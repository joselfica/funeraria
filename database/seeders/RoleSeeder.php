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
            // Inventario (urnas)
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
            'reports.view', 'reports.export', 'reports.financial',
            // Personal
            'staff.view', 'staff.manage',
            // Sucursales
            'branches.view', 'branches.manage',
            // Usuarios y configuración
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'settings.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // ─────────────────────────────────────────────────────────
        // ROL: ADMINISTRADOR (ve TODO)
        // ─────────────────────────────────────────────────────────
        $admin = Role::firstOrCreate(['name' => 'Administrador']);
        $admin->syncPermissions(Permission::all());

        // ─────────────────────────────────────────────────────────
        // ROL: ENCARGADO (todo MENOS finanzas)
        // ─────────────────────────────────────────────────────────
        $encargado = Role::firstOrCreate(['name' => 'Encargado']);
        $encargado->syncPermissions([
            'clients.view', 'clients.create', 'clients.edit',
            'inventory.view', 'inventory.create', 'inventory.edit',
            'vehicles.view', 'vehicles.create', 'vehicles.edit',
            'services.view', 'services.create', 'services.edit',
            'reservations.view', 'reservations.create', 'reservations.cancel',
            'reports.view', 'reports.export', // Reportes operativos (sin dinero)
            'staff.view',
            'branches.view',
            // ❌ NO tiene: payments.view, payments.create, reports.financial, users.*, settings.manage
        ]);

        // ─────────────────────────────────────────────────────────
        // ROL: CHOFER (solo bodega e itinerario)
        // ─────────────────────────────────────────────────────────
        $chofer = Role::firstOrCreate(['name' => 'Chofer']);
        $chofer->syncPermissions([
            'inventory.view',  // Ver bodega
            'services.view',   // Ver sus servicios asignados (itinerario)
        ]);

        $this->command->info('✅ Roles configurados: Administrador, Encargado, Chofer');
    }
}