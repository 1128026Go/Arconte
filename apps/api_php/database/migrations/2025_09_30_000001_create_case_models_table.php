<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ejecuta la migración: crea la tabla case_models.
     */
    public function up(): void
    {
        Schema::create('case_models', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('radicado');
            $table->string('jurisdiccion')->nullable();
            $table->string('juzgado')->nullable();
            $table->string('tipo_proceso')->nullable();
            $table->string('despacho')->nullable();
            $table->string('estado_actual')->nullable();
            $table->string('fuente')->default('RAMA_API');
            $table->string('ultimo_hash')->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->boolean('has_unread')->default(false);
            $table->boolean('estado_checked')->default(false);
            $table->timestamps();
            $table->unique(['user_id','radicado']);
        });
    }

    /**
     * Revierte la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('case_models');
    }
};