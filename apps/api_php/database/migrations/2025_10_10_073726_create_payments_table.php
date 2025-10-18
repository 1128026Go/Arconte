<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained();
            $table->foreignId('user_id')->constrained();

            // ePayco data
            $table->string('epayco_reference', 100)->unique(); // Referencia única de ePayco
            $table->string('epayco_transaction_id', 100)->nullable(); // x_transaction_id
            $table->text('epayco_response')->nullable(); // JSON completo de respuesta

            // Payment info
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('COP');
            $table->string('status', 20); // 'pending', 'approved', 'rejected', 'failed'
            $table->string('payment_method', 50)->nullable();

            // Metadata
            $table->text('description')->nullable();
            $table->timestamp('paid_at')->nullable();

            $table->timestamps();

            $table->index('epayco_reference');
            $table->index(['user_id', 'status']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
