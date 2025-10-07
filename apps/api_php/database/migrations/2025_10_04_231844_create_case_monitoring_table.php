<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_monitoring', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_id')->constrained('case_models')->onDelete('cascade');
            $table->timestamp('last_check')->nullable();
            $table->integer('check_frequency')->default(3600); // segundos
            $table->string('status', 20)->default('active'); // 'active', 'paused', 'stopped'
            $table->json('sources')->nullable(); // ['ramajud', 'tyba', 'samai']
            $table->json('last_data_hash')->nullable(); // hash para detectar cambios
            $table->timestamps();
            
            $table->index(['status', 'last_check']);
            $table->index('case_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_monitoring');
    }
};
