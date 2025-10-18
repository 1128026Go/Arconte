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
        Schema::create('case_act_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_act_id')->constrained('case_acts')->cascadeOnDelete();
            $table->string('filename')->nullable();
            $table->string('mimetype', 120)->nullable();
            $table->string('disk', 50)->default('documents');
            $table->string('path')->nullable(); // ruta en el disk
            $table->string('source_url')->nullable(); // URL Rama si existe
            $table->string('sha256', 64)->unique(); // dedupe
            $table->boolean('is_primary')->default(true);
            $table->longText('text_content')->nullable(); // texto extraído/OCR
            $table->timestamps();

            $table->index(['case_act_id', 'is_primary']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('case_act_documents');
    }
};
