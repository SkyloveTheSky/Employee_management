<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agenda_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('admins')->cascadeOnDelete();
            $table->date('date');
            $table->string('title', 120);
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agenda_notes');
    }
};
