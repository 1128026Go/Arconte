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
        Schema::create('lawyers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Información profesional básica
            $table->string('tarjeta_profesional')->unique();
            $table->string('nombre_completo');
            $table->string('cedula')->unique();
            $table->date('fecha_nacimiento');

            // Verificación y estado
            $table->boolean('verificado')->default(false);
            $table->timestamp('verificado_at')->nullable();
            $table->boolean('activo')->default(true);
            $table->enum('estado_cuenta', ['pending', 'active', 'suspended', 'banned'])->default('pending');

            // Estadísticas
            $table->integer('casos_completados')->default(0);
            $table->decimal('rating_promedio', 3, 2)->default(0);
            $table->integer('total_reviews')->default(0);

            // Precios y disponibilidad
            $table->decimal('tarifa_hora', 10, 2)->nullable();
            $table->decimal('tarifa_caso', 10, 2)->nullable();
            $table->boolean('disponible')->default(true);

            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index(['verificado', 'activo']);
            $table->index('rating_promedio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lawyers');
    }
};
