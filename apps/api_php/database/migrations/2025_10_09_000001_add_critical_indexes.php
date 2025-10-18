<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Agrega índices críticos que faltaban para optimizar queries frecuentes.
     */
    public function up(): void
    {
        // Índices en case_models
        Schema::table('case_models', function (Blueprint $table) {
            // Índice simple en radicado (búsquedas por radicado)
            $table->index('radicado', 'idx_case_models_radicado');

            // Índice compuesto user_id + has_unread (query de casos no leídos por usuario)
            $table->index(['user_id', 'has_unread'], 'idx_case_models_user_unread');

            // Índice compuesto user_id + estado_checked (query de casos no revisados)
            $table->index(['user_id', 'estado_checked'], 'idx_case_models_user_checked');

            // Índice en last_checked_at para ordenamiento
            $table->index('last_checked_at', 'idx_case_models_last_checked');
        });

        // Índices en notifications
        Schema::table('notifications', function (Blueprint $table) {
            // Índice compuesto user_id + read_at (query de notificaciones no leídas)
            $table->index(['user_id', 'read_at'], 'idx_notifications_user_read');

            // Índice compuesto user_id + priority (query de alta prioridad)
            $table->index(['user_id', 'priority'], 'idx_notifications_user_priority');

            // Índice en created_at para ordenamiento
            $table->index('created_at', 'idx_notifications_created');
        });

        // Índices en documents
        Schema::table('documents', function (Blueprint $table) {
            // Índice compuesto user_id + case_id (query de documentos por caso)
            $table->index(['user_id', 'case_id'], 'idx_documents_user_case');

            // Índice en folder_id (query por carpeta)
            $table->index('folder_id', 'idx_documents_folder');

            // Índice en created_at para ordenamiento
            $table->index('created_at', 'idx_documents_created');
        });

        // Índices en reminders
        Schema::table('reminders', function (Blueprint $table) {
            // Índice compuesto user_id + completed_at (query de pendientes)
            $table->index(['user_id', 'completed_at'], 'idx_reminders_user_completed');

            // Índice en due_at para queries de vencimientos
            $table->index('due_at', 'idx_reminders_due_at');
        });

        // Índices en invoices
        Schema::table('invoices', function (Blueprint $table) {
            // Índice compuesto user_id + paid_at (query de facturas pendientes)
            $table->index(['user_id', 'paid_at'], 'idx_invoices_user_paid');

            // Índice en status
            $table->index('status', 'idx_invoices_status');
        });

        // Índices en time_entries
        Schema::table('time_entries', function (Blueprint $table) {
            // Índice en case_id
            $table->index('case_id', 'idx_time_entries_case');

            // Índice en started_at para queries por fecha
            $table->index('started_at', 'idx_time_entries_started');
        });

        // Índices en case_acts
        Schema::table('case_acts', function (Blueprint $table) {
            // Índice en fecha para ordenamiento
            $table->index('fecha', 'idx_case_acts_fecha');

            // Índice en uniq_key para búsqueda de duplicados
            $table->index('uniq_key', 'idx_case_acts_uniq_key');
        });

        // Índices en ai_conversations
        Schema::table('ai_conversations', function (Blueprint $table) {
            // Índice en user_id
            $table->index('user_id', 'idx_ai_conversations_user');

            // Índice en created_at
            $table->index('created_at', 'idx_ai_conversations_created');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('case_models', function (Blueprint $table) {
            $table->dropIndex('idx_case_models_radicado');
            $table->dropIndex('idx_case_models_user_unread');
            $table->dropIndex('idx_case_models_user_checked');
            $table->dropIndex('idx_case_models_last_checked');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('idx_notifications_user_read');
            $table->dropIndex('idx_notifications_user_priority');
            $table->dropIndex('idx_notifications_created');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex('idx_documents_user_case');
            $table->dropIndex('idx_documents_folder');
            $table->dropIndex('idx_documents_created');
        });

        Schema::table('reminders', function (Blueprint $table) {
            $table->dropIndex('idx_reminders_user_completed');
            $table->dropIndex('idx_reminders_due_at');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('idx_invoices_user_paid');
            $table->dropIndex('idx_invoices_status');
        });

        Schema::table('time_entries', function (Blueprint $table) {
            $table->dropIndex('idx_time_entries_case');
            $table->dropIndex('idx_time_entries_started');
        });

        Schema::table('case_acts', function (Blueprint $table) {
            $table->dropIndex('idx_case_acts_fecha');
            $table->dropIndex('idx_case_acts_uniq_key');
        });

        Schema::table('ai_conversations', function (Blueprint $table) {
            $table->dropIndex('idx_ai_conversations_user');
            $table->dropIndex('idx_ai_conversations_created');
        });
    }
};
