<?php

use App\Http\Controllers\BranchController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeceasedController;
use App\Http\Controllers\EmployeeAbsenceController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PortalController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\VehicleController;
use Illuminate\Support\Facades\Route;

// ─────────────────────────────────────────────────────────────
// PÁGINA PÚBLICA
// ─────────────────────────────────────────────────────────────
Route::inertia('/', 'welcome')->name('home');

// ─────────────────────────────────────────────────────────────
// TODOS LOS USUARIOS LOGUEADOS
// ─────────────────────────────────────────────────────────────
Route::middleware(['auth'])->group(function () {
    
    Route::get('dashboard', function () {
        $user = auth()->user();
        
        // Cliente va al portal
        if ($user->hasRole('Cliente')) {
            return redirect()->route('portal.index');
        }
        
        // Chofer va a su itinerario
        if ($user->hasRole('Chofer')) {
            return app(\App\Http\Controllers\DriverController::class)->index(request());
        }
        
        // Admin y Encargado van al dashboard normal
        return app(DashboardController::class)->index();
    })->name('dashboard');
    
    Route::prefix('portal')->group(function () {
        Route::get('/', [PortalController::class, 'index'])->name('portal.index');
        Route::get('/servicio/{service:uuid}', [PortalController::class, 'show'])->name('portal.show');
    });
    
    // Ausencias (ver y solicitar las propias)
    Route::get('absences', [EmployeeAbsenceController::class, 'index'])->name('absences.index');
    Route::get('absences/create', [EmployeeAbsenceController::class, 'create'])->name('absences.create');
    Route::post('absences', [EmployeeAbsenceController::class, 'store'])->name('absences.store');
    Route::get('absences/{absence}', [EmployeeAbsenceController::class, 'show'])->name('absences.show');
});

// ─────────────────────────────────────────────────────────────
// OPERATIVOS (Admin + Encargado)
// ─────────────────────────────────────────────────────────────
Route::middleware(['auth', 'role:Administrador|Encargado'])->group(function () {
    
    // Los clientes no se eliminan (auditoría): solo se activan/desactivan
    Route::post('clients/{client}/toggle-active', [ClientController::class, 'toggleActive'])->name('clients.toggle-active');
    Route::resource('clients', ClientController::class)->except(['destroy']);
    Route::resource('inventory', InventoryController::class);
    Route::resource('vehicles', VehicleController::class);
    Route::resource('deceased', DeceasedController::class);
    
    // Servicios
    Route::get('services/wizard', function () {
        return \Inertia\Inertia::render('Services/Wizard', [
            'branches' => \App\Models\Branch::active()->get(['id', 'name']),
            'serviceTypes' => \App\Models\ServiceType::active()->get(['id', 'name', 'base_price', 'duration_hours']),
            'beneficiaryTypes' => collect(\App\Enums\BeneficiaryType::cases())->map(fn ($t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
            'availableItems' => \App\Models\InventoryItem::active()
                ->where('stock', '>', 0)
                ->get(['id', 'code', 'name', 'category', 'stock', 'price']),
            // Clientes existentes
            'existingClients' => \App\Models\Client::active()->orderBy('name')->get(['id', 'name', 'rut']),
        ]);
    })->name('services.wizard');
    
    Route::post('services/quick-store', [ServiceController::class, 'quickStore'])->name('services.quick-store');
    Route::resource('services', ServiceController::class);
    
    // Asignaciones
    Route::post('services/{service}/assign-item', [ServiceController::class, 'assignInventoryItem'])->name('services.assign-item');
    Route::delete('services/{service}/items/{item}', [ServiceController::class, 'removeInventoryItem'])->name('services.remove-item');
    Route::post('services/{service}/assign-vehicle', [ServiceController::class, 'assignVehicle'])->name('services.assign-vehicle');
    Route::delete('services/{service}/vehicles/{vehicle}', [ServiceController::class, 'removeVehicle'])->name('services.remove-vehicle');
    Route::post('services/{service}/assign-employee', [ServiceController::class, 'assignEmployee'])->name('services.assign-employee');
    Route::delete('services/{service}/assignments/{assignment}', [ServiceController::class, 'removeEmployee'])->name('services.remove-employee');
    
    // Aprobación/Rechazo
    Route::post('services/{service}/approve', [ServiceController::class, 'approve'])->name('services.approve');
    Route::post('services/{service}/reject', [ServiceController::class, 'reject'])->name('services.reject');
    
    // PDFs
    Route::get('services/{service}/contract', [ServiceController::class, 'downloadContract'])->name('services.contract');
    Route::get('services/{service}/paz-y-salvo', [ServiceController::class, 'downloadPazYSalvo'])->name('services.paz-y-salvo');
    
    // Aprobación de ausencias
    Route::post('absences/{absence}/approve', [EmployeeAbsenceController::class, 'approve'])->name('absences.approve');
    Route::post('absences/{absence}/reject', [EmployeeAbsenceController::class, 'reject'])->name('absences.reject');
    
    // Reportes (operativos)
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('reports/services/pdf', [ReportController::class, 'servicesPdf'])->name('reports.services.pdf');
    Route::get('reports/services/excel', [ReportController::class, 'servicesExcel'])->name('reports.services.excel');
    Route::get('reports/inventory/pdf', [ReportController::class, 'inventoryPdf'])->name('reports.inventory.pdf');
    
    // Sucursales (solo ver)
    Route::get('branches', [BranchController::class, 'index'])->name('branches.index');
    Route::get('branches/{branch}', [BranchController::class, 'show'])->name('branches.show');
});

// ─────────────────────────────────────────────────────────────
// SOLO ADMINISTRADOR: Finanzas, Personal, Sucursales (CRUD)
// ─────────────────────────────────────────────────────────────
Route::middleware(['auth', 'role:Administrador'])->group(function () {
    
    // Pagos
    Route::post('services/{service}/payments', [PaymentController::class, 'store'])->name('payments.store');
    Route::get('payments/{payment}/pdf', [PaymentController::class, 'downloadPdf'])->name('payments.pdf');
    Route::delete('payments/{payment}', [PaymentController::class, 'destroy'])->name('payments.destroy');
    
    // Reportes financieros
    Route::get('reports/payments/pdf', [ReportController::class, 'paymentsPdf'])->name('reports.payments.pdf');
    Route::get('reports/payments/excel', [ReportController::class, 'paymentsExcel'])->name('reports.payments.excel');
    
    // ─────────────────────────────────────────────────────────
    // GESTIÓN DE PERSONAL (solo Administrador)
    // ─────────────────────────────────────────────────────────
    Route::middleware('role:Administrador')->group(function () {
        Route::get('staff', [StaffController::class, 'index'])->name('staff.index');
        Route::get('staff/create', [StaffController::class, 'create'])->name('staff.create');
        Route::post('staff', [StaffController::class, 'store'])->name('staff.store');
        Route::get('staff/{user}', [StaffController::class, 'show'])->name('staff.show');
        Route::post('staff/{user}/roles', [StaffController::class, 'updateRoles'])->name('staff.update-roles');
        Route::post('staff/{user}/password', [StaffController::class, 'updatePassword'])->name('staff.update-password');
        Route::post('staff/{user}/toggle-active', [StaffController::class, 'toggleActive'])->name('staff.toggle-active');
    });
    
    // Sucursales (crear/editar/eliminar)
    Route::get('branches/create', [BranchController::class, 'create'])->name('branches.create');
    Route::post('branches', [BranchController::class, 'store'])->name('branches.store');
    Route::get('branches/{branch}/edit', [BranchController::class, 'edit'])->name('branches.edit');
    Route::put('branches/{branch}', [BranchController::class, 'update'])->name('branches.update');
    Route::delete('branches/{branch}', [BranchController::class, 'destroy'])->name('branches.destroy');
});

// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────
require __DIR__.'/settings.php';