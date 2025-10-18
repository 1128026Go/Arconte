<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->addIndex('case_models', 'user_id');
        $this->addIndex('case_models', 'radicado');
        $this->addIndex('case_models', ['user_id', 'radicado'], 'case_models_user_radicado_idx');
        $this->addIndex('case_models', ['user_id', 'has_unread'], 'case_models_user_unread_idx');

        $this->addIndex('documents', 'user_id');
        $this->addIndex('documents', 'case_id');
        $this->addIndex('documents', ['user_id', 'case_id'], 'documents_user_case_idx');

        $this->addIndex('reminders', 'user_id');
        $this->addIndex('reminders', 'due_at');
        $this->addIndex('reminders', 'completed_at');
        $this->addIndex('reminders', ['user_id', 'completed_at'], 'reminders_user_completed_idx');

        $this->addIndex('notifications', 'user_id');
        $this->addIndex('notifications', 'priority');
        $this->addIndex('notifications', ['user_id', 'read_at'], 'notifications_user_read_idx');

        $this->addIndex('invoices', 'user_id');
        $this->addIndex('invoices', 'status');

        $this->addIndex('time_entries', 'user_id');
        $this->addIndex('time_entries', 'case_id');
        $this->addIndex('time_entries', 'billable');
    }

    public function down(): void
    {
        $this->dropIndex('case_models', 'user_id');
        $this->dropIndex('case_models', 'radicado');
        $this->dropIndex('case_models', ['user_id', 'radicado'], 'case_models_user_radicado_idx');
        $this->dropIndex('case_models', ['user_id', 'has_unread'], 'case_models_user_unread_idx');

        $this->dropIndex('documents', 'user_id');
        $this->dropIndex('documents', 'case_id');
        $this->dropIndex('documents', ['user_id', 'case_id'], 'documents_user_case_idx');

        $this->dropIndex('reminders', 'user_id');
        $this->dropIndex('reminders', 'due_at');
        $this->dropIndex('reminders', 'completed_at');
        $this->dropIndex('reminders', ['user_id', 'completed_at'], 'reminders_user_completed_idx');

        $this->dropIndex('notifications', 'user_id');
        $this->dropIndex('notifications', 'priority');
        $this->dropIndex('notifications', ['user_id', 'read_at'], 'notifications_user_read_idx');

        $this->dropIndex('invoices', 'user_id');
        $this->dropIndex('invoices', 'status');

        $this->dropIndex('time_entries', 'user_id');
        $this->dropIndex('time_entries', 'case_id');
        $this->dropIndex('time_entries', 'billable');
    }

    private function addIndex(string $table, array|string $columns, ?string $name = null): void
    {
        if (!Schema::hasTable($table)) {
            return;
        }

        $columns = (array) $columns;
        $indexName = $this->resolveIndexName($table, $columns, $name);

        if (Schema::hasIndex($table, $indexName)) {
            return;
        }

        Schema::table($table, function (Blueprint $table) use ($columns, $indexName) {
            $table->index($columns, $indexName);
        });
    }

    private function dropIndex(string $table, array|string $columns, ?string $name = null): void
    {
        if (!Schema::hasTable($table)) {
            return;
        }

        $columns = (array) $columns;
        $indexName = $this->resolveIndexName($table, $columns, $name);

        if (!Schema::hasIndex($table, $indexName)) {
            return;
        }

        Schema::table($table, function (Blueprint $table) use ($indexName) {
            $table->dropIndex($indexName);
        });
    }

    private function resolveIndexName(string $table, array $columns, ?string $name): string
    {
        if ($name) {
            return $name;
        }

        return $table . '_' . implode('_', $columns) . '_index';
    }
};
