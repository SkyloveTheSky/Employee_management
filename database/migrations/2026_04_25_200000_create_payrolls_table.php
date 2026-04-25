<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payrolls')) {
            return;
        }

        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('generated_by_admin_id')->nullable()->constrained('admins')->nullOnDelete();

            $table->unsignedTinyInteger('period_month');
            $table->unsignedSmallInteger('period_year');

            // Semi-automatique
            $table->decimal('base_salary', 12, 2)->default(0);
            $table->decimal('prime_amount', 12, 2)->default(0);
            $table->decimal('overtime_amount', 12, 2)->default(0);
            $table->decimal('gross_salary', 12, 2)->default(0);

            $table->decimal('cnaps_rate', 5, 2)->default(1);
            $table->decimal('assurance_rate', 5, 2)->default(1);
            $table->decimal('cnaps_amount', 12, 2)->default(0);
            $table->decimal('assurance_amount', 12, 2)->default(0);
            $table->decimal('total_retenu', 12, 2)->default(0);

            $table->decimal('net_to_pay', 12, 2)->default(0);

            $table->string('payment_method')->default('virement');
            $table->enum('payment_status', ['unpaid', 'paid'])->default('unpaid');
            $table->date('paid_at')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->unique(['user_id', 'period_month', 'period_year'], 'payroll_unique_period_per_user');
            $table->index(['period_year', 'period_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};

