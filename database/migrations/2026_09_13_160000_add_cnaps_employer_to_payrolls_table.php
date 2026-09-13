<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('payrolls')) {
            return;
        }

        Schema::table('payrolls', function (Blueprint $table) {
            if (! Schema::hasColumn('payrolls', 'cnaps_employer_rate')) {
                $table->decimal('cnaps_employer_rate', 5, 2)->default(13)->after('cnaps_rate');
            }
            if (! Schema::hasColumn('payrolls', 'cnaps_employer_amount')) {
                $table->decimal('cnaps_employer_amount', 12, 2)->default(0)->after('cnaps_amount');
            }
        });

        $rate = 13.0;
        if (Schema::hasTable('company_settings') && Schema::hasColumn('company_settings', 'cnaps_employer_percent')) {
            $rate = (float) (DB::table('company_settings')->value('cnaps_employer_percent') ?: 13);
        }

        DB::update(
            'update payrolls set cnaps_employer_rate = ?, cnaps_employer_amount = round(gross_salary * ? / 100.0, 2)',
            [$rate, $rate]
        );
    }

    public function down(): void
    {
        if (! Schema::hasTable('payrolls')) {
            return;
        }

        Schema::table('payrolls', function (Blueprint $table) {
            foreach (['cnaps_employer_rate', 'cnaps_employer_amount'] as $column) {
                if (Schema::hasColumn('payrolls', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
