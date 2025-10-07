<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReminderRequest;
use App\Jobs\SendReminderJob;
use App\Models\AuditLog;
use App\Models\Reminder;
use Illuminate\Http\Request;

class ReminderController extends Controller
{
    /**
     * List reminders with filters (type, priority, status)
     */
    public function index(Request $request)
    {
        $query = Reminder::where('user_id', $request->user()->id)
            ->with(['case']);

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        // Filter by priority
        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        // Filter by status (completed/pending)
        if ($request->filled('status')) {
            if ($request->input('status') === 'completed') {
                $query->whereNotNull('completed_at');
            } elseif ($request->input('status') === 'pending') {
                $query->whereNull('completed_at');
            }
        }

        // Filter by case
        if ($request->filled('case_id')) {
            $query->where('case_id', $request->input('case_id'));
        }

        // Search by title
        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->input('search') . '%');
        }

        $reminders = $query->orderBy('due_at')->paginate(20);

        return response()->json($reminders);
    }

    /**
     * Create reminder with validation
     */
    public function store(ReminderRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        // Validate due_at is in the future
        if (isset($data['due_at']) && strtotime($data['due_at']) < time()) {
            return response()->json([
                'message' => 'Due date must be in the future',
                'errors' => ['due_at' => ['Due date must be in the future']],
            ], 422);
        }

        $reminder = Reminder::create($data);

        // Schedule reminder job if due_at is within next 24 hours
        if ($reminder->due_at <= now()->addDay()) {
            SendReminderJob::dispatch($reminder)->delay($reminder->due_at->subHour());
        }

        // Audit log
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'reminder.created',
            'auditable_type' => Reminder::class,
            'auditable_id' => $reminder->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json($reminder->load('case'), 201);
    }

    /**
     * Update reminder
     */
    public function update(Request $request, Reminder $reminder)
    {
        $this->authorize('update', $reminder);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'notes' => 'nullable|string',
            'due_at' => 'sometimes|date',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'type' => 'sometimes|string|max:50',
            'case_id' => 'nullable|exists:case_models,id',
            'channel' => 'sometimes|in:inapp,email,sms',
        ]);

        $oldData = $reminder->toArray();
        $reminder->update($validated);

        // Audit log
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'reminder.updated',
            'auditable_type' => Reminder::class,
            'auditable_id' => $reminder->id,
            'old_values' => $oldData,
            'new_values' => $reminder->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json($reminder->fresh('case'));
    }

    /**
     * Delete reminder
     */
    public function destroy(Request $request, Reminder $reminder)
    {
        $this->authorize('delete', $reminder);

        $reminder->delete();

        // Audit log
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'reminder.deleted',
            'auditable_type' => Reminder::class,
            'auditable_id' => $reminder->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['status' => 'ok']);
    }

    /**
     * Mark reminder as completed
     */
    public function markComplete(Request $request, Reminder $reminder)
    {
        $this->authorize('update', $reminder);

        $reminder->update(['completed_at' => now()]);

        // Audit log
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'reminder.completed',
            'auditable_type' => Reminder::class,
            'auditable_id' => $reminder->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['status' => 'ok', 'reminder' => $reminder]);
    }

    /**
     * Get upcoming reminders (next 7 days)
     */
    public function upcoming(Request $request)
    {
        $days = $request->input('days', 7);

        $reminders = Reminder::where('user_id', $request->user()->id)
            ->upcoming($days)
            ->with(['case'])
            ->orderBy('due_at')
            ->get();

        return response()->json(['reminders' => $reminders]);
    }

    /**
     * Get overdue reminders
     */
    public function overdue(Request $request)
    {
        $reminders = Reminder::where('user_id', $request->user()->id)
            ->overdue()
            ->with(['case'])
            ->orderBy('due_at')
            ->get();

        return response()->json(['reminders' => $reminders]);
    }
}