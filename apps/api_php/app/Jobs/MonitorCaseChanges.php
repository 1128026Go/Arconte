<?php

namespace App\Jobs;

use App\Models\CaseModel;
use App\Models\CaseMonitoring;
use App\Models\CaseChangeLog;
use App\Models\Notification;
use App\Models\NotificationRule;
use App\Services\IngestClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class MonitorCaseChanges implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(IngestClient $ingestClient): void
    {
        Log::info('MonitorCaseChanges job started');

        $monitors = CaseMonitoring::active()->dueForCheck()->with('case.user')->get();
        Log::info("Found {$monitors->count()} cases to monitor");

        foreach ($monitors as $monitor) {
            try {
                $this->checkCaseForChanges($monitor, $ingestClient);
            } catch (\Exception $e) {
                Log::error("Error monitoring case {$monitor->case_id}: {$e->getMessage()}");
            }
        }

        Log::info('MonitorCaseChanges job completed');
    }

    private function checkCaseForChanges(CaseMonitoring $monitor, IngestClient $ingestClient): void
    {
        $case = $monitor->case;
        $freshData = $ingestClient->fetchNormalized($case->radicado);
        $monitor->updateCheck();

        if (!$monitor->hasDataChanged($freshData)) {
            return;
        }

        Log::info("Changes detected for case {$case->id}");
        $changes = $this->detectChanges($case, $freshData);

        foreach ($changes as $change) {
            CaseChangeLog::create([
                'case_id' => $case->id,
                'source' => 'ramajud',
                'change_type' => $change['type'],
                'old_value' => $change['old'] ?? null,
                'new_value' => $change['new'],
            ]);

            $this->createNotificationForChange($case, $change);
        }

        $monitor->updateDataHash($freshData);
        $this->updateCaseData($case, $freshData);
    }

    private function detectChanges(CaseModel $case, array $freshData): array
    {
        $changes = [];
        $existingActsCount = $case->acts()->count();
        $newActsCount = count($freshData['acts'] ?? []);

        if ($newActsCount > $existingActsCount) {
            $newActs = array_slice($freshData['acts'], 0, $newActsCount - $existingActsCount);
            foreach ($newActs as $act) {
                $changes[] = ['type' => 'new_act', 'new' => $act];
            }
        }

        if (isset($freshData['estado']) && $freshData['estado'] !== $case->estado) {
            $changes[] = [
                'type' => 'status_change',
                'old' => $case->estado,
                'new' => $freshData['estado'],
            ];
        }

        return $changes;
    }

    private function createNotificationForChange(CaseModel $case, array $change): void
    {
        $user = $case->user;
        $priority = $this->calculateBasePriority($change);
        [$title, $message] = $this->generateNotificationContent($case, $change);

        Notification::create([
            'user_id' => $user->id,
            'case_id' => $case->id,
            'type' => $change['type'],
            'priority' => $priority,
            'title' => $title,
            'message' => $message,
            'metadata' => $change,
        ]);
    }

    private function calculateBasePriority(array $change): int
    {
        return match($change['type']) {
            'new_act' => 5,
            'status_change' => 7,
            default => 3,
        };
    }

    private function generateNotificationContent(CaseModel $case, array $change): array
    {
        $radicado = $case->radicado;
        return match($change['type']) {
            'new_act' => ["Nueva actuación - {$radicado}", "Se registró: {$change['new']['actuacion']}"],
            'status_change' => ["Cambio de estado - {$radicado}", "Cambió a: {$change['new']}"],
            default => ["Actualización - {$radicado}", "El proceso ha sido actualizado"],
        };
    }

    private function updateCaseData(CaseModel $case, array $freshData): void
    {
        $case->update(['estado' => $freshData['estado'] ?? $case->estado]);

        foreach ($freshData['acts'] ?? [] as $actData) {
            $case->acts()->firstOrCreate(
                ['fecha' => $actData['fecha'], 'actuacion' => $actData['actuacion']],
                ['anotacion' => $actData['anotacion'] ?? '']
            );
        }
    }
}
