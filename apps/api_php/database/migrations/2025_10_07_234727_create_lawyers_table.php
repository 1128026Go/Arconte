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
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('specialty'); // Derecho Laboral, Civil, Penal, etc.
            $table->string('city');
            $table->text('bio')->nullable();
            $table->decimal('rating', 3, 2)->default(0); // 0.00 to 5.00
            $table->integer('total_reviews')->default(0);
            $table->integer('cases_won')->default(0);
            $table->integer('cases_total')->default(0);
            $table->integer('experience_years');
            $table->decimal('hourly_rate', 10, 2); // Tarifa por hora
            $table->boolean('verified')->default(false);
            $table->boolean('available')->default(true);
            $table->json('specialties')->nullable(); // Array de especialidades
            $table->json('languages')->nullable(); // Array de idiomas
            $table->string('education')->nullable(); // Universidad
            $table->string('license_number')->nullable(); // Tarjeta profesional
            $table->text('certifications')->nullable(); // Certificaciones adicionales
            $table->string('profile_picture')->nullable();
            $table->timestamps();

            $table->index(['specialty', 'city']);
            $table->index('rating');
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
