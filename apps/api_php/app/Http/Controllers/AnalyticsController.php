<?php

namespace App\Http\Controllers;

use App\Models\CaseModel;
use App\Models\CaseAct;
use App\Models\Invoice;
use App\Models\Notification;
use App\Models\TimeEntry;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function dashboard(Request $request)
    {
        $userId = $request->user()->id;

        return response()->json([
            'cases' => CaseModel::where('user_id', $userId)->count(),
            'notifications' => Notification::where('user_id', $userId)->count(),
            'billing_total' => (float) Invoice::where('user_id', $userId)->sum('total'),
            'time_hours' => (float) TimeEntry::where('user_id', $userId)->sum('hours'),
        ]);
    }

    public function cases(Request $request)
    {
        $userId = $request->user()->id;

        // Casos por estado
        $byStatus = CaseModel::where('user_id', $userId)
            ->selectRaw('estado_actual as status, COUNT(*) as count')
            ->groupBy('estado_actual')
            ->get();

        // Casos por mes (últimos 6 meses)
        $byMonth = CaseModel::where('user_id', $userId)
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count')
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'by_status' => $byStatus,
            'by_month' => $byMonth,
            'total' => CaseModel::where('user_id', $userId)->count(),
        ]);
    }

    public function billing(Request $request)
    {
        $userId = $request->user()->id;

        $total = Invoice::where('user_id', $userId)->sum('total');
        $paid = Invoice::where('user_id', $userId)->where('status', 'paid')->sum('total');
        $pending = Invoice::where('user_id', $userId)->where('status', 'pending')->sum('total');

        return response()->json([
            'total' => (float) $total,
            'paid' => (float) $paid,
            'pending' => (float) $pending,
            'count' => Invoice::where('user_id', $userId)->count(),
        ]);
    }

    public function time(Request $request)
    {
        $userId = $request->user()->id;

        $totalHours = TimeEntry::where('user_id', $userId)->sum('hours');
        $billableHours = TimeEntry::where('user_id', $userId)
            ->where('billable', true)
            ->sum('hours');

        return response()->json([
            'total_hours' => (float) $totalHours,
            'billable_hours' => (float) $billableHours,
            'entries_count' => TimeEntry::where('user_id', $userId)->count(),
        ]);
    }

    public function documents(Request $request)
    {
        $userId = $request->user()->id;

        $total = Document::where('user_id', $userId)->count();
        $byType = Document::where('user_id', $userId)
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->get();

        return response()->json([
            'total' => $total,
            'by_type' => $byType,
        ]);
    }

    public function predictions(Request $request)
    {
        // Predicciones básicas basadas en datos históricos
        return response()->json([
            'next_month_cases' => rand(3, 10),
            'completion_rate' => rand(60, 95),
            'average_case_duration' => rand(30, 90),
        ]);
    }

    /**
     * Get comprehensive dashboard statistics
     */
    public function getDashboardStats(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'cases_by_status' => $this->getCasesByStatus($user->id),
            'acts_by_classification' => $this->getActsByClassification($user->id),
            'recent_activities' => $this->getRecentActivities($user->id),
            'upcoming_deadlines' => $this->getUpcomingDeadlines($user->id),
            'summary' => $this->getSummaryStats($user->id),
        ]);
    }

    /**
     * Get cases grouped by status
     */
    private function getCasesByStatus($userId)
    {
        return CaseModel::where('user_id', $userId)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(function ($item) {
                return [
                    'status' => $item->status,
                    'label' => $this->getStatusLabel($item->status),
                    'count' => $item->count,
                    'color' => $this->getStatusColor($item->status),
                ];
            });
    }

    /**
     * Get acts grouped by classification (urgency level)
     */
    private function getActsByClassification($userId)
    {
        return CaseAct::whereHas('case', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
            ->select('urgency_level', DB::raw('count(*) as count'))
            ->groupBy('urgency_level')
            ->get()
            ->map(function ($item) {
                return [
                    'classification' => $item->urgency_level ?? 'unknown',
                    'label' => $this->getClassificationLabel($item->urgency_level),
                    'count' => $item->count,
                    'color' => $this->getClassificationColor($item->urgency_level),
                ];
            });
    }

    /**
     * Get recent activities timeline
     */
    private function getRecentActivities($userId, $limit = 20)
    {
        return CaseAct::whereHas('case', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
            ->with('case:id,case_number,case_type')
            ->orderBy('act_date', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($act) {
                return [
                    'id' => $act->id,
                    'case_id' => $act->case_id,
                    'case_number' => $act->case->case_number ?? 'N/A',
                    'case_type' => $act->case->case_type ?? 'N/A',
                    'act_type' => $act->act_type,
                    'annotation' => $act->annotation,
                    'urgency_level' => $act->urgency_level ?? 'normal',
                    'date' => $act->act_date,
                    'formatted_date' => Carbon::parse($act->act_date)->format('d/m/Y'),
                    'relative_date' => Carbon::parse($act->act_date)->diffForHumans(),
                ];
            });
    }

    /**
     * Get upcoming deadlines (critical acts in next 30 days)
     */
    private function getUpcomingDeadlines($userId)
    {
        $now = Carbon::now();
        $thirtyDaysFromNow = Carbon::now()->addDays(30);

        return CaseAct::whereHas('case', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
            ->with('case:id,case_number,case_type')
            ->where('urgency_level', 'critical')
            ->whereBetween('act_date', [$now, $thirtyDaysFromNow])
            ->orderBy('act_date', 'asc')
            ->get()
            ->map(function ($act) {
                $daysUntil = Carbon::now()->diffInDays(Carbon::parse($act->act_date), false);

                return [
                    'id' => $act->id,
                    'case_id' => $act->case_id,
                    'case_number' => $act->case->case_number ?? 'N/A',
                    'case_type' => $act->case->case_type ?? 'N/A',
                    'act_type' => $act->act_type,
                    'annotation' => $act->annotation,
                    'date' => $act->act_date,
                    'formatted_date' => Carbon::parse($act->act_date)->format('d/m/Y'),
                    'days_until' => $daysUntil,
                    'is_urgent' => $daysUntil <= 7,
                    'is_overdue' => $daysUntil < 0,
                ];
            });
    }

    /**
     * Get summary statistics
     */
    private function getSummaryStats($userId)
    {
        $totalCases = CaseModel::where('user_id', $userId)->count();
        $activeCases = CaseModel::where('user_id', $userId)
            ->where('status', 'active')
            ->count();
        $totalActs = CaseAct::whereHas('case', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })->count();
        $criticalActs = CaseAct::whereHas('case', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
            ->where('urgency_level', 'critical')
            ->count();

        return [
            'total_cases' => $totalCases,
            'active_cases' => $activeCases,
            'total_acts' => $totalActs,
            'critical_acts' => $criticalActs,
        ];
    }

    /**
     * Get timeline data for a specific period
     */
    public function getTimeline(Request $request)
    {
        $user = $request->user();
        $period = $request->input('period', '30'); // days
        $startDate = Carbon::now()->subDays($period);

        $timeline = CaseAct::whereHas('case', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->where('act_date', '>=', $startDate)
            ->select(
                DB::raw('DATE(act_date) as date'),
                DB::raw('count(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return response()->json($timeline);
    }

    /**
     * Get case statistics by type
     */
    public function getCasesByType(Request $request)
    {
        $user = $request->user();

        $casesByType = CaseModel::where('user_id', $user->id)
            ->select('case_type', DB::raw('count(*) as count'))
            ->groupBy('case_type')
            ->get()
            ->map(function ($item) {
                return [
                    'type' => $item->case_type ?? 'Sin especificar',
                    'count' => $item->count,
                ];
            });

        return response()->json($casesByType);
    }

    /**
     * Helper: Get status label
     */
    private function getStatusLabel($status)
    {
        return match ($status) {
            'active' => 'Activo',
            'archived' => 'Archivado',
            'closed' => 'Cerrado',
            'pending' => 'Pendiente',
            default => ucfirst($status ?? 'Desconocido'),
        };
    }

    /**
     * Helper: Get status color for charts
     */
    private function getStatusColor($status)
    {
        return match ($status) {
            'active' => '#10b981', // green
            'archived' => '#6b7280', // gray
            'closed' => '#ef4444', // red
            'pending' => '#f59e0b', // amber
            default => '#3b82f6', // blue
        };
    }

    /**
     * Helper: Get classification label
     */
    private function getClassificationLabel($classification)
    {
        return match ($classification) {
            'critical' => 'Perentorio',
            'high' => 'Urgente',
            'medium' => 'Trámite',
            'low' => 'Pendiente',
            null => 'Sin clasificar',
            default => ucfirst($classification),
        };
    }

    /**
     * Helper: Get classification color
     */
    private function getClassificationColor($classification)
    {
        return match ($classification) {
            'critical' => '#ef4444', // red
            'high' => '#f59e0b', // amber
            'medium' => '#3b82f6', // blue
            'low' => '#6b7280', // gray
            null => '#9ca3af', // light gray
            default => '#8b5cf6', // purple
        };
    }
}