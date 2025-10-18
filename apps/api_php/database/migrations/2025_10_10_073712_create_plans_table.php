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
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique(); // 'free', 'premium'
            $table->string('display_name', 100);
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2)->default(0); // En COP
            $table->string('billing_cycle', 20)->nullable(); // 'monthly', 'yearly', 'lifetime'
            $table->integer('max_cases')->default(3);
            $table->integer('max_daily_queries')->default(10);
            $table->integer('max_jurisprudencia_searches')->default(5);
            $table->json('features')->nullable(); // Array de features habilitados
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('name');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
