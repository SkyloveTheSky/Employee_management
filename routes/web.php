<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\PayrollController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\User\PayrollController as UserPayrollController;
use App\Http\Controllers\Admin\CompanySettingsController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\DashboardChartController;
use App\Http\Controllers\Admin\EntrepriseWidgetController;
use App\Http\Controllers\Admin\EmployeWidgetController;

use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/payrolls', [UserPayrollController::class, 'index'])->name('payrolls.index');
    Route::get('/payrolls/{id}/pdf', [UserPayrollController::class, 'pdf'])->name('payrolls.pdf');
});

// Routes admin
Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.post');


    Route::middleware(\App\Http\Middleware\AdminAuth::class)->group(function () {
        Route::get('/dashboard', [AuthController::class, 'dashboard'])->name('dashboard');
        Route::get('/dashboard/chart-data', [DashboardChartController::class, 'index'])->name('dashboard.chart-data');
        Route::get('/admin/company-setting', [EntrepriseWidgetController::class,
            'show'
        ])->name('admin.company.widget');
        Route::get('/admin/users', [EmployeWidgetController::class, 'index'])
        ->name('admin.employee.widget.index');

        Route::get('/admin/users/{id}', [EmployeWidgetController::class, 'show'])
        ->name('admin.employee.widget.show');


        // Employees — statiques avant dynamiques
        Route::get('/employees', [AuthController::class, 'employees'])->name('employees');
        Route::get('/employees/create', [AuthController::class, 'showCreateEmployee'])->name('employees.create');
        Route::post('/employees', [AuthController::class, 'createEmployee'])->name('employees.store');
        Route::get('/employees/{id}/edit', [AuthController::class, 'showEditEmployee'])->name('employees.edit');
        Route::patch('/employees/{id}', [AuthController::class, 'updateEmployee'])->name('employees.update');
        Route::delete('/employees/{id}', [AuthController::class, 'deleteEmployee'])->name('employees.delete');

        // Payrolls — statiques EN PREMIER, dynamiques après
        Route::get('/payrolls', [PayrollController::class, 'index'])->name('payrolls.index');
        Route::post('/payrolls', [PayrollController::class, 'store'])->name('payrolls.store');
        Route::post('/payrolls/assistant', [PayrollController::class, 'assistant'])->name('payrolls.assistant');
        Route::post('/payrolls/generate-missing', [PayrollController::class, 'generateMissing'])->name('payrolls.generate-missing');
        Route::get('/payrolls/{id}/edit', [PayrollController::class, 'edit'])->name('payrolls.edit');
        Route::patch('/payrolls/{id}', [PayrollController::class, 'update'])->name('payrolls.update');
        Route::patch('/payrolls/{id}/payment', [PayrollController::class, 'markPayment'])->name('payrolls.payment');
        Route::delete('/payrolls/{id}', [PayrollController::class, 'destroy'])->name('payrolls.delete');
        Route::get('/payrolls/{id}/pdf', [PayrollController::class, 'pdf'])->name('payrolls.pdf');

        // Settings
        Route::get('/settings/company', [CompanySettingsController::class, 'edit'])->name('settings.company.edit');
        Route::post('/settings/company', [CompanySettingsController::class, 'update'])->name('settings.company.update');

        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    });
});

require __DIR__.'/auth.php';
