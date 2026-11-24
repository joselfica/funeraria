<?php

use App\Http\Controllers\BranchController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeceasedController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\DriverController;
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

    // Detalle del servicio para el chofer
    Route::get('driver/services/{service}', [DriverController::class, 'showService'])->name('driver.service.show');

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

    // ─────────────────────────────────────────────────────────
    // INVENTARIO
    // ─────────────────────────────────────────────────────────
    Route::get('inventory', [InventoryController::class, 'hub'])->name('inventory.hub');
    Route::get('inventory/create/{category}', [InventoryController::class, 'create'])
        ->whereIn('category', ['ataud', 'urna'])
        ->name('inventory.create');
    Route::get('inventory/{category}', [InventoryController::class, 'index'])
        ->whereIn('category', ['ataud', 'urna'])
        ->name('inventory.index');

    Route::patch('inventory/{inventory}/condition', [InventoryController::class, 'updateCondition'])
        ->name('inventory.condition');

    Route::resource('inventory', InventoryController::class)->except(['index', 'create']);

    Route::resource('vehicles', VehicleController::class);

    // Los registros de fallecidos no se eliminan (auditoría): solo se activan/desactivan
    Route::post('deceased/{deceased}/toggle-active', [DeceasedController::class, 'toggleActive'])->name('deceased.toggle-active');
    Route::resource('deceased', DeceasedController::class)->except(['destroy']);

    // Servicios
    Route::get('services/wizard', function () {
        return \Inertia\Inertia::render('Services/Wizard', [
            'branches' => \App\Models\Branch::active()->get(['id', 'name']),
            'serviceTypes' => collect(\App\Enums\ServiceTypeEnum::cases())->map(fn ($type) => [
                'value' => $type->value,
                'label' => $type->label(),
                'base_price' => $type->basePrice(),
                'duration_hours' => $type->durationHours(),
            ]),
            'beneficiaryTypes' => collect(\App\Enums\BeneficiaryType::cases())->map(fn ($t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
            'availableItems' => \App\Models\InventoryItem::assignable()
                ->orderBy('category')
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'category', 'price'])
                ->map(fn ($i) => [
                    'id' => $i->id,
                    'code' => $i->code,
                    'name' => $i->name,
                    'category' => $i->category,
                    'price' => $i->price,
                ]),
            'existingClients' => \App\Models\Client::active()->orderBy('name')->get(['id', 'name', 'rut']),
            'availableVehicles' => \App\Models\Vehicle::available()
                ->orderBy('type')
                ->orderBy('plate')
                ->get(['id', 'plate', 'type', 'brand', 'model'])
                ->map(fn ($v) => [
                    'id' => $v->id,
                    'plate' => $v->plate,
                    'type' => $v->type,
                    'brand' => $v->brand,
                    'model' => $v->model,
                ]),
            'availableEmployees' => \App\Models\User::whereHas('roles', fn ($q) => $q->where('name', 'Chofer'))
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
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

    // ─────────────────────────────────────────────────────────
    // PAGOS (Admin + Encargado)
    // ─────────────────────────────────────────────────────────
    Route::post('services/{service}/payments', [PaymentController::class, 'store'])->name('payments.store');
    Route::get('payments/{payment}/pdf', [PaymentController::class, 'downloadPdf'])->name('payments.pdf');
    Route::delete('payments/{payment}', [PaymentController::class, 'destroy'])->name('payments.destroy');

    // Aprobación de ausencias
    Route::post('absences/{absence}/approve', [EmployeeAbsenceController::class, 'approve'])->name('absences.approve');
    Route::post('absences/{absence}/reject', [EmployeeAbsenceController::class, 'reject'])->name('absences.reject');

    // Reportes (operativos)
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('reports/services/pdf', [ReportController::class, 'servicesPdf'])->name('reports.services.pdf');
    Route::get('reports/services/excel', [ReportController::class, 'servicesExcel'])->name('reports.services.excel');
    Route::get('reports/inventory/pdf', [ReportController::class, 'inventoryPdf'])->name('reports.inventory.pdf');

    // ─────────────────────────────────────────────────────────
    // SUCURSALES (Admin + Encargado)
    // ─────────────────────────────────────────────────────────
    Route::get('branches', [BranchController::class, 'index'])->name('branches.index');
    Route::patch('branches/{branch}/toggle-active', [BranchController::class, 'toggleActive'])->name('branches.toggle-active');

    // ─────────────────────────────────────────────────────────
    // PERSONAL (Admin + Encargado)
    // ─────────────────────────────────────────────────────────
    Route::get('staff', [StaffController::class, 'index'])->name('staff.index');
    Route::get('staff/create', [StaffController::class, 'create'])->name('staff.create');
    Route::post('staff', [StaffController::class, 'store'])->name('staff.store');

    Route::get('staff/{user}', [StaffController::class, 'show'])
        ->whereNumber('user')
        ->name('staff.show');

    Route::post('staff/{user}/roles', [StaffController::class, 'updateRoles'])->name('staff.update-roles');
    Route::post('staff/{user}/password', [StaffController::class, 'updatePassword'])->name('staff.update-password');
    Route::post('staff/{user}/toggle-active', [StaffController::class, 'toggleActive'])->name('staff.toggle-active');
    Route::post('staff/{user}/unlock', [StaffController::class, 'unlock']);

    // ─────────────────────────────────────────────────────────
    // DONACIONES (Admin + Encargado)
    // Listado, registro, detalle, edición, eliminación y comprobante.
    // ─────────────────────────────────────────────────────────
    Route::get('donations', [DonationController::class, 'index'])->name('donations.index');
    Route::post('donations', [DonationController::class, 'store'])->name('donations.store');
    Route::get('donations/{donation}', [DonationController::class, 'show'])->name('donations.show');
    Route::get('donations/{donation}/edit', [DonationController::class, 'edit'])->name('donations.edit');
    Route::put('donations/{donation}', [DonationController::class, 'update'])->name('donations.update');
    Route::delete('donations/{donation}', [DonationController::class, 'destroy'])->name('donations.destroy');
    Route::get('donations/{donation}/receipt', [DonationController::class, 'downloadReceipt'])->name('donations.receipt');
});

// ─────────────────────────────────────────────────────────────
// SOLO ADMINISTRADOR: Finanzas, Sucursales (CRUD)
// ─────────────────────────────────────────────────────────────
Route::middleware(['auth', 'role:Administrador'])->group(function () {

    // Reportes financieros
    Route::get('reports/payments/pdf', [ReportController::class, 'paymentsPdf'])->name('reports.payments.pdf');
    Route::get('reports/payments/excel', [ReportController::class, 'paymentsExcel'])->name('reports.payments.excel');

    // ─────────────────────────────────────────────────────────
    // SUCURSALES (CRUD) - Solo Administrador
    // ─────────────────────────────────────────────────────────
    Route::get('branches/create', [BranchController::class, 'create'])->name('branches.create');
    Route::post('branches', [BranchController::class, 'store'])->name('branches.store');
    Route::get('branches/{branch}/edit', [BranchController::class, 'edit'])->name('branches.edit');
    Route::put('branches/{branch}', [BranchController::class, 'update'])->name('branches.update');
});

// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────
require __DIR__.'/settings.php';