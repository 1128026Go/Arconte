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
        Schema::create('lawyer_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lawyer_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Cliente que hace review
            $table->foreignId('marketplace_case_id')->nullable()->constrained()->onDelete('set null');

            // Rating y reseña
            $table->decimal('rating', 3, 2); // 0.00 a 5.00
            $table->text('comentario')->nullable();

            // Desglose de ratings
            $table->integer('comunicacion')->nullable(); // 1-5
            $table->integer('profesionalismo')->nullable(); // 1-5
            $table->integer('conocimiento')->nullable(); // 1-5
            $table->integer('resultado')->nullable(); // 1-5
            $table->integer('precio_calidad')->nullable(); // 1-5

            // Recomendación
            $table->boolean('recomendaria')->default(true);

            // Verificación
            $table->boolean('verificada')->default(false); // Si el review es de un caso real completado

            // Respuesta del abogado
            $table->text('respuesta_abogado')->nullable();
            $table->timestamp('respondido_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index(['lawyer_id', 'rating']);
            $table->index('verificada');
            $table->unique(['user_id', 'marketplace_case_id']); // Un review por caso
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lawyer_reviews');
    }
};
