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
            if (! Schema::hasColumn('payrolls', 'unpaid_leave_days')) {
                $table->decimal('unpaid_leave_days', 6, 1)->default(0)->after('prime_amount');
            }
            if (! Schema::hasColumn('payrolls', 'unpaid_leave_amount')) {
                $table->decimal('unpaid_leave_amount', 12, 2)->default(0)->after('unpaid_leave_days');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('payrolls')) {
            return;
        }

        Schema::table('payrolls', function (Blueprint $table) {
            if (Schema::hasColumn('payrolls', 'unpaid_leave_amount')) {
                $table->dropColumn('unpaid_leave_amount');
            }
            if (Schema::hasColumn('payrolls', 'unpaid_leave_days')) {
                $table->dropColumn('unpaid_leave_days');
            }
        });
    }
};
