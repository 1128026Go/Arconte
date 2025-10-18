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
        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_id')->constrained('case_models')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('name'); // Nombre original del archivo
            $table->string('file_path'); // Ruta en storage
            $table->string('file_type'); // MIME type
            $table->unsignedBigInteger('file_size'); // Tamaño en bytes
            $table->string('category')->nullable(); // Categoría: documento, evidencia, etc.
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('case_id');
            $table->index('user_id');
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attachments');
    }
};
