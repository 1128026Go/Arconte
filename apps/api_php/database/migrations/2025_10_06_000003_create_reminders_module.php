<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('reminders', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('case_id')->nullable()->constrained('case_models')->nullOnDelete();
            $t->string('title');
            $t->text('notes')->nullable();
            $t->timestamp('due_at');
            $t->string('channel')->default('inapp');
            $t->timestamp('completed_at')->nullable();
            $t->timestamps();
            $t->index(['user_id','due_at']);
        });
    }
    public function down(): void { Schema::dropIfExists('reminders'); }
};