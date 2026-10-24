<?php

use App\Http\Controllers\ClientController;
use App\Http\Controllers\EmployeeAbsenceController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\VehicleController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DeceasedController;
use App\Http\Controllers\DashboardController;

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
        Route::resource('deceased', DeceasedController::class);

        // Rutas especiales de aprobación/rechazo
        Route::post('services/{service}/approve', [ServiceController::class, 'approve'])
            ->name('services.approve');
        Route::post('services/{service}/reject', [ServiceController::class, 'reject'])
            ->name('services.reject');

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
    });

});

// Rutas de configuración (settings)
require __DIR__.'/settings.php';