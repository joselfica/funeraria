<?php

use App\Http\Controllers\ClientController;
use App\Http\Controllers\EmployeeAbsenceController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\VehicleController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DeceasedController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportController;

// Página pública
Route::inertia('/', 'welcome')->name('home');

// Rutas protegidas (requieren autenticación + email verificado)
Route::middleware(['auth', 'verified'])->group(function () {
    
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // ================================================
    // MÓDULO CLIENTES
    // Solo Administrador y Coordinador pueden acceder
    // ================================================
    Route::middleware('role:Administrador|Coordinador')->group(function () {
        Route::resource('clients', ClientController::class);
        Route::resource('inventory', InventoryController::class);
        Route::resource('vehicles', VehicleController::class);
        // Wizard de Nuevo Expediente
        // (va ANTES del resource de services para que 'services/wizard'
        // no sea interpretado como 'services/{service}')
        Route::get('services/wizard', function () {
            return \Inertia\Inertia::render('Services/Wizard', [
                'branches' => \App\Models\Branch::active()->get(['id', 'name']),
                'serviceTypes' => \App\Models\ServiceType::active()->get(['id', 'name', 'base_price', 'duration_hours']),
                'beneficiaryTypes' => collect(\App\Enums\BeneficiaryType::cases())->map(fn ($t) => [
                    'value' => $t->value,
                    'label' => $t->label(),
                ]),
                // NUEVO: Enviar ataúdes y urnas con stock
                'availableItems' => \App\Models\InventoryItem::active()
                    ->where('stock', '>', 0)
                    ->get(['id', 'code', 'name', 'category', 'stock', 'price']),
            ]);
        })->name('services.wizard');

        Route::post('services/quick-store', [ServiceController::class, 'quickStore'])->name('services.quick-store');

        Route::resource('services', ServiceController::class);

        // Asignación de inventario y vehículos a servicios
        Route::post('services/{service}/assign-item', [ServiceController::class, 'assignInventoryItem'])
            ->name('services.assign-item');
        Route::delete('services/{service}/items/{item}', [ServiceController::class, 'removeInventoryItem'])
            ->name('services.remove-item');
        Route::post('services/{service}/assign-vehicle', [ServiceController::class, 'assignVehicle'])
            ->name('services.assign-vehicle');
        Route::delete('services/{service}/vehicles/{vehicle}', [ServiceController::class, 'removeVehicle'])
            ->name('services.remove-vehicle');

        // ──────────────────────────────────────────────────────────
        // ASIGNACIÓN DE EMPLEADOS A SERVICIOS
        // ──────────────────────────────────────────────────────────

        Route::post('services/{service}/assign-employee', [ServiceController::class, 'assignEmployee'])
            ->name('services.assign-employee');

        Route::delete('services/{service}/assignments/{assignment}', [ServiceController::class, 'removeEmployee'])
            ->name('services.remove-employee');

        Route::resource('deceased', DeceasedController::class);

        // Rutas especiales de aprobación/rechazo
        Route::post('services/{service}/approve', [ServiceController::class, 'approve'])
            ->name('services.approve');
        Route::post('services/{service}/reject', [ServiceController::class, 'reject'])
            ->name('services.reject');

        // Documentos PDF del servicio
        Route::get('services/{service}/contract', [ServiceController::class, 'downloadContract'])
            ->name('services.contract');

        Route::get('services/{service}/paz-y-salvo', [ServiceController::class, 'downloadPazYSalvo'])
            ->name('services.paz-y-salvo');

        // ──────────────────────────────────────────────────────────
        // MÓDULO FINANCIERO — Pagos y comprobantes
        // ──────────────────────────────────────────────────────────

        Route::post('services/{service}/payments', [PaymentController::class, 'store'])
            ->name('payments.store');

        Route::get('payments/{payment}/pdf', [PaymentController::class, 'downloadPdf'])
            ->name('payments.pdf');

        Route::delete('payments/{payment}', [PaymentController::class, 'destroy'])
            ->name('payments.destroy');

        // ──────────────────────────────────────────────────────────
        // GESTIÓN DE AUSENCIAS (vacaciones, permisos, licencias)
        // ──────────────────────────────────────────────────────────

        Route::resource('absences', EmployeeAbsenceController::class)
            ->except(['destroy', 'edit', 'update']);

        Route::post('absences/{absence}/approve', [EmployeeAbsenceController::class, 'approve'])
            ->name('absences.approve');

        Route::post('absences/{absence}/reject', [EmployeeAbsenceController::class, 'reject'])
            ->name('absences.reject');

        // ──────────────────────────────────────────────────────────
        // GESTIÓN DE PERSONAL
        // ──────────────────────────────────────────────────────────
        Route::get('staff', [StaffController::class, 'index'])->name('staff.index');
        Route::get('staff/{user}', [StaffController::class, 'show'])->name('staff.show');
        Route::post('staff/{user}/roles', [StaffController::class, 'updateRoles'])->name('staff.update-roles');

        // ──────────────────────────────────────────────────────────
        // MÓDULO DE REPORTES
        // ──────────────────────────────────────────────────────────
        Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('reports/services/pdf', [ReportController::class, 'servicesPdf'])->name('reports.services.pdf');
        Route::get('reports/services/excel', [ReportController::class, 'servicesExcel'])->name('reports.services.excel');
        Route::get('reports/payments/pdf', [ReportController::class, 'paymentsPdf'])->name('reports.payments.pdf');
        Route::get('reports/payments/excel', [ReportController::class, 'paymentsExcel'])->name('reports.payments.excel');
        Route::get('reports/inventory/pdf', [ReportController::class, 'inventoryPdf'])->name('reports.inventory.pdf');
    });

});

// Rutas de configuración (settings)
require __DIR__.'/settings.php';