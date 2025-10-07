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
        // Helper closure para agregar índices de forma segura
        $safeAddIndex = function (string $table, array $columns, string $name = null) {
            try {
                Schema::table($table, function (Blueprint $table) use ($columns, $name) {
                    if ($name) {
                        $table->index($columns, $name);
                    } else {
                        $table->index($columns);
                    }
                });
            } catch (\Exception $e) {
                // Índice ya existe, continuar
            }
        };

        // Índices para AI conversations
        $safeAddIndex('ai_conversations', ['user_id', 'created_at']);
        $safeAddIndex('ai_messages', ['conversation_id', 'created_at']);

        // Índices para document templates
        $safeAddIndex('document_templates', ['user_id', 'type']);
        $safeAddIndex('document_templates', ['is_active']);

        // Índices para case parties
        $safeAddIndex('case_parties', ['case_model_id']);

        // Índices para case acts
        $safeAddIndex('case_acts', ['case_model_id', 'fecha']);

        // Índices para notification rules
        $safeAddIndex('notification_rules', ['user_id', 'is_active']);
        $safeAddIndex('notification_rules', ['event_type']);

        // Índices para case monitoring
        $safeAddIndex('case_monitoring', ['case_model_id']);
        $safeAddIndex('case_monitoring', ['last_check']);

        // Índices para case changes log
        $safeAddIndex('case_changes_log', ['case_model_id', 'created_at']);

        // Índices para audit logs
        $safeAddIndex('audit_logs', ['user_id', 'created_at']);
        $safeAddIndex('audit_logs', ['auditable_type', 'auditable_id']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Helper closure para eliminar índices de forma segura
        $safeDropIndex = function (string $table, string $indexName) {
            try {
                Schema::table($table, function (Blueprint $table) use ($indexName) {
                    $table->dropIndex($indexName);
                });
            } catch (\Exception $e) {
                // Índice no existe, continuar
            }
        };

        // Eliminar índices en orden inverso
        $safeDropIndex('audit_logs', 'audit_logs_auditable_type_auditable_id_index');
        $safeDropIndex('audit_logs', 'audit_logs_user_id_created_at_index');
        $safeDropIndex('case_changes_log', 'case_changes_log_case_model_id_created_at_index');
        $safeDropIndex('case_monitoring', 'case_monitoring_last_check_index');
        $safeDropIndex('case_monitoring', 'case_monitoring_case_model_id_index');
        $safeDropIndex('notification_rules', 'notification_rules_event_type_index');
        $safeDropIndex('notification_rules', 'notification_rules_user_id_is_active_index');
        $safeDropIndex('case_acts', 'case_acts_case_model_id_fecha_index');
        $safeDropIndex('case_parties', 'case_parties_case_model_id_index');
        $safeDropIndex('document_templates', 'document_templates_is_active_index');
        $safeDropIndex('document_templates', 'document_templates_user_id_type_index');
        $safeDropIndex('ai_messages', 'ai_messages_conversation_id_created_at_index');
        $safeDropIndex('ai_conversations', 'ai_conversations_user_id_created_at_index');
    }
};
