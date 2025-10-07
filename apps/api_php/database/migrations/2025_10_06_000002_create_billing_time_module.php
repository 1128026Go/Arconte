<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('invoices', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('case_id')->nullable()->constrained('case_models')->nullOnDelete();
            $t->string('number')->unique();
            $t->string('status')->default('draft');
            $t->decimal('subtotal', 12, 2)->default(0);
            $t->decimal('tax', 12, 2)->default(0);
            $t->decimal('total', 12, 2)->default(0);
            $t->timestamp('sent_at')->nullable();
            $t->timestamp('paid_at')->nullable();
            $t->timestamps();
        });

        Schema::create('invoice_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $t->string('description');
            $t->decimal('qty', 10, 2)->default(1);
            $t->decimal('unit_price', 12, 2)->default(0);
            $t->decimal('amount', 12, 2)->default(0);
            $t->timestamps();
        });

        Schema::create('time_entries', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('case_id')->nullable()->constrained('case_models')->nullOnDelete();
            $t->timestamp('started_at')->nullable();
            $t->timestamp('stopped_at')->nullable();
            $t->decimal('hours', 6, 2)->default(0);
            $t->boolean('billable')->default(true);
            $t->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $t->timestamps();
            $t->index(['user_id','case_id','billable']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('time_entries');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
    }
};