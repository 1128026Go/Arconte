<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_acts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_model_id')->constrained('case_models')->cascadeOnDelete();
            $table->date('fecha')->nullable();
            $table->string('tipo')->nullable();
            $table->text('descripcion')->nullable();
            $table->text('documento_url')->nullable();
            $table->string('origen')->nullable();
            $table->string('uniq_key')->nullable();
            $table->timestamps();
            $table->unique(['case_model_id','uniq_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_acts');
    }
};