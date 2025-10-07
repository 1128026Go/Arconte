<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\NotificationRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $notifications = Notification::where('user_id', $user->id)
            ->with('case')
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($notifications);
    }

    public function unread(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $notifications = Notification::where('user_id', $user->id)
            ->unread()
            ->with('case')
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'notifications' => $notifications,
            'count' => $notifications->count()
        ]);
    }

    public function markAsRead(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        
        $notification = Notification::where('user_id', $user->id)
            ->findOrFail($id);
        
        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read']);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        
        Notification::where('user_id', $user->id)
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function getRules(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $rules = NotificationRule::where('user_id', $user->id)->get();

        return response()->json($rules);
    }

    public function createRule(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rule_type' => 'required|in:keyword,party,court,deadline,act_type',
            'rule_value' => 'required|array',
            'priority_boost' => 'integer|min:0|max:10',
            'enabled' => 'boolean'
        ]);

        $user = $request->user();
        
        $rule = NotificationRule::create([
            'user_id' => $user->id,
            ...$validated
        ]);

        return response()->json($rule, 201);
    }

    public function updateRule(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'rule_type' => 'sometimes|in:keyword,party,court,deadline,act_type',
            'rule_value' => 'sometimes|array',
            'priority_boost' => 'sometimes|integer|min:0|max:10',
            'enabled' => 'sometimes|boolean'
        ]);

        $user = $request->user();
        
        $rule = NotificationRule::where('user_id', $user->id)
            ->findOrFail($id);
        
        $rule->update($validated);

        return response()->json($rule);
    }

    public function deleteRule(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        
        $rule = NotificationRule::where('user_id', $user->id)
            ->findOrFail($id);
        
        $rule->delete();

        return response()->json(['message' => 'Rule deleted successfully']);
    }

    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $stats = [
            'total' => Notification::where('user_id', $user->id)->count(),
            'unread' => Notification::where('user_id', $user->id)->unread()->count(),
            'high_priority' => Notification::where('user_id', $user->id)
                ->highPriority()
                ->unread()
                ->count(),
            'today' => Notification::where('user_id', $user->id)
                ->whereDate('created_at', today())
                ->count(),
        ];

        return response()->json($stats);
    }
}
