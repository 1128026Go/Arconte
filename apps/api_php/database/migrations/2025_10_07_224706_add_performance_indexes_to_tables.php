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
        // Función helper para crear índices de forma segura
        $safeAddIndex = function($table, $columns, $indexName = null) {
            try {
                if ($indexName) {
                    $table->index($columns, $indexName);
                } else {
                    $table->index($columns);
                }
            } catch (\Exception $e) {
                // Índice ya existe, ignorar
            }
        };

        // Índices para case_models
        if (Schema::hasTable('case_models')) {
            Schema::table('case_models', function (Blueprint $table) use ($safeAddIndex) {
                $safeAddIndex($table, 'user_id');
                $safeAddIndex($table, 'radicado');
                $safeAddIndex($table, ['user_id', 'radicado'], 'case_models_user_radicado_idx');
                $safeAddIndex($table, ['user_id', 'has_unread'], 'case_models_user_unread_idx');
            });
        }

        // Índices para documents
        if (Schema::hasTable('documents')) {
            Schema::table('documents', function (Blueprint $table) use ($safeAddIndex) {
                $safeAddIndex($table, 'user_id');
                $safeAddIndex($table, 'case_id');
                $safeAddIndex($table, ['user_id', 'case_id'], 'documents_user_case_idx');
            });
        }

        // Índices para reminders
        if (Schema::hasTable('reminders')) {
            Schema::table('reminders', function (Blueprint $table) use ($safeAddIndex) {
                $safeAddIndex($table, 'user_id');
                $safeAddIndex($table, 'due_date');
                $safeAddIndex($table, 'is_completed');
                $safeAddIndex($table, ['user_id', 'is_completed'], 'reminders_user_completed_idx');
            });
        }

        // Índices para notifications
        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) use ($safeAddIndex) {
                $safeAddIndex($table, 'user_id');
                $safeAddIndex($table, 'is_read');
                $safeAddIndex($table, ['user_id', 'is_read'], 'notifications_user_read_idx');
            });
        }

        // Índices para invoices
        if (Schema::hasTable('invoices')) {
            Schema::table('invoices', function (Blueprint $table) use ($safeAddIndex) {
                $safeAddIndex($table, 'user_id');
                $safeAddIndex($table, 'status');
            });
        }

        // Índices para time_entries
        if (Schema::hasTable('time_entries')) {
            Schema::table('time_entries', function (Blueprint $table) use ($safeAddIndex) {
                $safeAddIndex($table, 'user_id');
                $safeAddIndex($table, 'case_id');
                $safeAddIndex($table, 'is_billable');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('case_models', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['radicado']);
            $table->dropIndex('case_models_user_radicado_index');
            $table->dropIndex('case_models_user_unread_index');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['case_id']);
            $table->dropIndex('documents_user_case_index');
            $table->dropIndex(['created_at']);
        });

        Schema::table('reminders', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['due_date']);
            $table->dropIndex(['is_completed']);
            $table->dropIndex('reminders_user_completed_index');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['is_read']);
            $table->dropIndex('notifications_user_read_index');
            $table->dropIndex(['created_at']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('time_entries', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['case_id']);
            $table->dropIndex(['is_billable']);
            $table->dropIndex(['started_at']);
        });
    }
};
