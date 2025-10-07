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
        Schema::create('lawyer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lawyer_id')->constrained()->onDelete('cascade');

            // Biografía y descripción
            $table->text('bio')->nullable();
            $table->text('descripcion_servicios')->nullable();

            // Especialidades (JSON array)
            $table->json('especialidades')->nullable(); // ['civil', 'penal', 'laboral', etc.]
            $table->json('areas_practica')->nullable();

            // Educación y certificaciones
            $table->json('educacion')->nullable(); // [{ universidad, titulo, año }]
            $table->json('certificaciones')->nullable();
            $table->integer('anos_experiencia')->default(0);

            // Idiomas
            $table->json('idiomas')->nullable(); // ['español', 'inglés', 'francés']

            // Ubicación y cobertura
            $table->string('ciudad');
            $table->string('departamento');
            $table->json('cobertura_geografica')->nullable(); // ciudades donde presta servicios

            // Documentos de verificación
            $table->string('documento_tarjeta_profesional')->nullable(); // path to file
            $table->string('documento_antecedentes')->nullable();
            $table->string('documento_cedula')->nullable();

            // Redes sociales y enlaces
            $table->string('website')->nullable();
            $table->string('linkedin')->nullable();
            $table->string('twitter')->nullable();

            // Preferencias de trabajo
            $table->boolean('acepta_casos_contingencia')->default(false);
            $table->boolean('ofrece_consulta_gratis')->default(false);
            $table->integer('duracion_consulta_gratis')->default(30); // minutos

            $table->timestamps();

            // Índices
            $table->index('ciudad');
            $table->index('departamento');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lawyer_profiles');
    }
};
