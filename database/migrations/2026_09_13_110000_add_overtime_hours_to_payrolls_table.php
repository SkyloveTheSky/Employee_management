<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('payrolls')) {
            return;
        }

        Schema::table('payrolls', function (Blueprint $table) {
            if (! Schema::hasColumn('payrolls', 'overtime_hours')) {
                $table->decimal('overtime_hours', 8, 2)->default(0)->after('prime_amount');
            }
            if (! Schema::hasColumn('payrolls', 'overtime_divisor')) {
                $table->decimal('overtime_divisor', 8, 2)->nullable()->after('overtime_hours');
            }
            if (! Schema::hasColumn('payrolls', 'overtime_coefficient')) {
                $table->decimal('overtime_coefficient', 6, 3)->nullable()->after('overtime_divisor');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('payrolls')) {
            return;
        }

        Schema::table('payrolls', function (Blueprint $table) {
            foreach (['overtime_hours', 'overtime_divisor', 'overtime_coefficient'] as $column) {
                if (Schema::hasColumn('payrolls', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
