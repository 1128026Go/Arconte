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
        Schema::create('transcriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('case_id')->nullable()->constrained('case_models')->onDelete('set null');
            $table->string('title');
            $table->string('file_path');
            $table->string('file_type', 50); // audio, video
            $table->string('original_filename');
            $table->integer('file_size')->nullable(); // en bytes
            $table->integer('duration')->nullable(); // en segundos
            $table->text('transcription')->nullable();
            $table->text('summary')->nullable();
            $table->json('metadata')->nullable();
            $table->string('status', 20)->default('pending'); // pending, processing, completed, failed
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transcriptions');
    }
};
