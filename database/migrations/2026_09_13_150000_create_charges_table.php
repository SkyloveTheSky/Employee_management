<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('charges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->string('title', 160);
            $table->string('category', 40)->default('autre');
            $table->decimal('amount', 15, 2);
            $table->date('incurred_on');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['incurred_on', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('charges');
    }
};
