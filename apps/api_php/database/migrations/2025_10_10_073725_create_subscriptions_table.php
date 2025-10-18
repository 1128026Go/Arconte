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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('plan_id')->constrained();
            $table->string('status', 20); // 'active', 'cancelled', 'expired', 'suspended'

            // ePayco Integration
            $table->string('epayco_subscription_id', 100)->nullable();
            $table->string('epayco_customer_id', 100)->nullable();
            $table->string('payment_method', 50)->nullable(); // 'credit_card', 'pse', 'cash'

            // Dates
            $table->timestamp('starts_at');
            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->timestamp('trial_ends_at')->nullable(); // Para trial gratuito de 7 días
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('ends_at')->nullable();

            // Billing
            $table->timestamp('last_payment_at')->nullable();
            $table->timestamp('next_payment_at')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('epayco_subscription_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
