<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('company_settings')) {
            return;
        }

        Schema::table('company_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('company_settings', 'cnaps_employer_percent')) {
                $table->decimal('cnaps_employer_percent', 5, 2)->nullable()->after('cnaps_percent');
            }
            if (! Schema::hasColumn('company_settings', 'cnaps_employee_percent')) {
                $table->decimal('cnaps_employee_percent', 5, 2)->nullable()->after('cnaps_employer_percent');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('company_settings')) {
            return;
        }

        Schema::table('company_settings', function (Blueprint $table) {
            foreach (['cnaps_employer_percent', 'cnaps_employee_percent'] as $column) {
                if (Schema::hasColumn('company_settings', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
