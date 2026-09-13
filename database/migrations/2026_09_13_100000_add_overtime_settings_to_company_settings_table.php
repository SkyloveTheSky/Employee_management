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
            if (! Schema::hasColumn('company_settings', 'overtime_hours_per_day')) {
                $table->decimal('overtime_hours_per_day', 6, 2)->nullable()->after('logo_path');
            }
            if (! Schema::hasColumn('company_settings', 'overtime_weekly_goal')) {
                $table->decimal('overtime_weekly_goal', 6, 2)->nullable()->after('overtime_hours_per_day');
            }
            if (! Schema::hasColumn('company_settings', 'overtime_divisor')) {
                $table->decimal('overtime_divisor', 8, 2)->nullable()->after('overtime_weekly_goal');
            }
            if (! Schema::hasColumn('company_settings', 'overtime_coefficient')) {
                $table->decimal('overtime_coefficient', 6, 3)->nullable()->after('overtime_divisor');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('company_settings')) {
            return;
        }

        Schema::table('company_settings', function (Blueprint $table) {
            foreach (['overtime_hours_per_day', 'overtime_weekly_goal', 'overtime_divisor', 'overtime_coefficient'] as $column) {
                if (Schema::hasColumn('company_settings', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
