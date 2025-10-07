<?php

namespace App\Http\Controllers;

use App\Models\CaseModel;
use App\Models\Invoice;
use App\Models\Notification;
use App\Models\TimeEntry;

class AnalyticsController extends Controller
{
    public function dashboard()
    {
        return [
            'cases' => CaseModel::count(),
            'notifications' => Notification::count(),
            'billing_total' => (float) Invoice::sum('total'),
            'time_hours' => (float) TimeEntry::sum('hours'),
        ];
    }
}