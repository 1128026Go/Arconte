<?php

namespace App\Http\Controllers;

use App\Models\TimeEntry;
use Illuminate\Http\Request;

class TimeTrackingController extends Controller
{
    public function index(Request $request)
    {
        return TimeEntry::where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);
    }
}