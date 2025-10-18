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
        // Índices para case_models
        Schema::table('case_models', function (Blueprint $table) {
            $table->index('user_id', 'idx_case_models_user_id');
            $table->index('status', 'idx_case_models_status');
            $table->index('radicado', 'idx_case_models_radicado');
            $table->index(['user_id', 'status'], 'idx_case_models_user_status');
            $table->index(['user_id', 'updated_at'], 'idx_case_models_user_updated');
            $table->index('created_at', 'idx_case_models_created_at');
        });

        // Índices para case_acts
        Schema::table('case_acts', function (Blueprint $table) {
            $table->index('case_id', 'idx_case_acts_case_id');
            $table->index('urgency_level', 'idx_case_acts_urgency');
            $table->index('act_date', 'idx_case_acts_date');
            $table->index(['case_id', 'act_date'], 'idx_case_acts_case_date');
            $table->index(['urgency_level', 'act_date'], 'idx_case_acts_urgency_date');
        });

        // Índices para notifications
        Schema::table('notifications', function (Blueprint $table) {
            $table->index('user_id', 'idx_notifications_user_id');
            $table->index('read_at', 'idx_notifications_read_at');
            $table->index(['user_id', 'read_at'], 'idx_notifications_user_read');
            $table->index('created_at', 'idx_notifications_created_at');
        });

        // Índices para case_parties
        Schema::table('case_parties', function (Blueprint $table) {
            $table->index('case_id', 'idx_case_parties_case_id');
            $table->index('role', 'idx_case_parties_role');
        });

        // Índices para documents (si existe la tabla)
        if (Schema::hasTable('documents')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->index('user_id', 'idx_documents_user_id');
                $table->index('documentable_type', 'idx_documents_type');
                $table->index(['documentable_type', 'documentable_id'], 'idx_documents_morph');
                $table->index('created_at', 'idx_documents_created_at');
            });
        }

        // Índices para reminders (si existe la tabla)
        if (Schema::hasTable('reminders')) {
            Schema::table('reminders', function (Blueprint $table) {
                $table->index('user_id', 'idx_reminders_user_id');
                $table->index('due_date', 'idx_reminders_due_date');
                $table->index('completed_at', 'idx_reminders_completed');
                $table->index(['user_id', 'due_date'], 'idx_reminders_user_due');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // case_models indexes
        Schema::table('case_models', function (Blueprint $table) {
            $table->dropIndex('idx_case_models_user_id');
            $table->dropIndex('idx_case_models_status');
            $table->dropIndex('idx_case_models_radicado');
            $table->dropIndex('idx_case_models_user_status');
            $table->dropIndex('idx_case_models_user_updated');
            $table->dropIndex('idx_case_models_created_at');
        });

        // case_acts indexes
        Schema::table('case_acts', function (Blueprint $table) {
            $table->dropIndex('idx_case_acts_case_id');
            $table->dropIndex('idx_case_acts_urgency');
            $table->dropIndex('idx_case_acts_date');
            $table->dropIndex('idx_case_acts_case_date');
            $table->dropIndex('idx_case_acts_urgency_date');
        });

        // notifications indexes
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('idx_notifications_user_id');
            $table->dropIndex('idx_notifications_read_at');
            $table->dropIndex('idx_notifications_user_read');
            $table->dropIndex('idx_notifications_created_at');
        });

        // case_parties indexes
        Schema::table('case_parties', function (Blueprint $table) {
            $table->dropIndex('idx_case_parties_case_id');
            $table->dropIndex('idx_case_parties_role');
        });

        // documents indexes
        if (Schema::hasTable('documents')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->dropIndex('idx_documents_user_id');
                $table->dropIndex('idx_documents_type');
                $table->dropIndex('idx_documents_morph');
                $table->dropIndex('idx_documents_created_at');
            });
        }

        // reminders indexes
        if (Schema::hasTable('reminders')) {
            Schema::table('reminders', function (Blueprint $table) {
                $table->dropIndex('idx_reminders_user_id');
                $table->dropIndex('idx_reminders_due_date');
                $table->dropIndex('idx_reminders_completed');
                $table->dropIndex('idx_reminders_user_due');
            });
        }
    }
};
