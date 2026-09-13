<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('company_settings')) {
            Schema::table('company_settings', function (Blueprint $table) {
                if (! Schema::hasColumn('company_settings', 'cnaps_percent')) {
                    $table->decimal('cnaps_percent', 5, 2)->nullable()->after('overtime_coefficient');
                }
                if (! Schema::hasColumn('company_settings', 'irsa_percent')) {
                    $table->decimal('irsa_percent', 5, 2)->nullable()->after('cnaps_percent');
                }
            });
        }

        if (Schema::hasTable('payrolls')) {
            Schema::table('payrolls', function (Blueprint $table) {
                if (! Schema::hasColumn('payrolls', 'irsa_rate')) {
                    $table->decimal('irsa_rate', 5, 2)->default(0)->after('assurance_rate');
                }
                if (! Schema::hasColumn('payrolls', 'irsa_amount')) {
                    $table->decimal('irsa_amount', 12, 2)->default(0)->after('assurance_amount');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('company_settings')) {
            Schema::table('company_settings', function (Blueprint $table) {
                foreach (['cnaps_percent', 'irsa_percent'] as $column) {
                    if (Schema::hasColumn('company_settings', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('payrolls')) {
            Schema::table('payrolls', function (Blueprint $table) {
                foreach (['irsa_rate', 'irsa_amount'] as $column) {
                    if (Schema::hasColumn('payrolls', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
