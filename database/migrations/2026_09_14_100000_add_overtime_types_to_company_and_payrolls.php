<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('company_settings') && ! Schema::hasColumn('company_settings', 'overtime_types')) {
            Schema::table('company_settings', function (Blueprint $table) {
                $table->json('overtime_types')->nullable()->after('overtime_coefficient');
            });
        }

        if (Schema::hasTable('payrolls') && ! Schema::hasColumn('payrolls', 'overtime_lines')) {
            Schema::table('payrolls', function (Blueprint $table) {
                $table->json('overtime_lines')->nullable()->after('overtime_amount');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('company_settings') && Schema::hasColumn('company_settings', 'overtime_types')) {
            Schema::table('company_settings', function (Blueprint $table) {
                $table->dropColumn('overtime_types');
            });
        }

        if (Schema::hasTable('payrolls') && Schema::hasColumn('payrolls', 'overtime_lines')) {
            Schema::table('payrolls', function (Blueprint $table) {
                $table->dropColumn('overtime_lines');
            });
        }
    }
};
