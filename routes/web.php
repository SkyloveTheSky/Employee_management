<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\PayrollController;
use App\Http\Controllers\Admin\PayrollStyleController;
use App\Http\Controllers\Admin\CompanySettingsController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Routes admin
Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.post');

    Route::middleware(\App\Http\Middleware\AdminAuth::class)->group(function () {
        Route::get('/dashboard', [AuthController::class, 'dashboard'])->name('dashboard');

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
        Route::get('/payrolls/style/edit', [PayrollStyleController::class, 'edit'])->name('payrolls.style.edit');
        Route::post('/payrolls/style/update', [PayrollStyleController::class, 'update'])->name('payrolls.style.update');
        Route::get('/payrolls/{id}/edit', [PayrollController::class, 'edit'])->name('payrolls.edit');
        Route::patch('/payrolls/{id}', [PayrollController::class, 'update'])->name('payrolls.update');
        Route::delete('/payrolls/{id}', [PayrollController::class, 'destroy'])->name('payrolls.delete');
        Route::get('/payrolls/{id}/pdf', [PayrollController::class, 'pdf'])->name('payrolls.pdf');

        // Settings
        Route::get('/settings/company', [CompanySettingsController::class, 'edit'])->name('settings.company.edit');
        Route::post('/settings/company', [CompanySettingsController::class, 'update'])->name('settings.company.update');

        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    });
});

require __DIR__.'/auth.php';
