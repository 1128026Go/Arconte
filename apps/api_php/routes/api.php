<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    AIController,
    AnalyticsController,
    AuthController,
    BillingController,
    CaseController,
    DocumentController,
    JurisprudenceController,
    NotificationController,
    ReminderController,
    TimeTrackingController,
};

Route::get('/', fn () => response()->json(['message' => 'Arconte API - Tu asistente jurídico inteligente']));

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // Cases
    Route::get('/cases', [CaseController::class, 'index']);
    Route::post('/cases', [CaseController::class, 'store']);
    Route::get('/cases/{id}', [CaseController::class, 'show']);
    Route::post('/cases/{id}/read', [CaseController::class, 'markRead']);
    Route::get('/cases/unread-count', [CaseController::class, 'unreadCount']);

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread', [NotificationController::class, 'unread']);
        Route::get('/stats', [NotificationController::class, 'stats']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);

        Route::get('/rules', [NotificationController::class, 'getRules']);
        Route::post('/rules', [NotificationController::class, 'createRule']);
        Route::put('/rules/{id}', [NotificationController::class, 'updateRule']);
        Route::delete('/rules/{id}', [NotificationController::class, 'deleteRule']);
    });
});
Route::middleware('auth:sanctum')->group(function () {
    // Documents
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::post('/documents', [DocumentController::class, 'store']);
    Route::get('/documents/{document}', [DocumentController::class, 'show']);
    Route::put('/documents/{document}', [DocumentController::class, 'update']);
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy']);
    Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
    Route::get('/documents/{document}/versions', [DocumentController::class, 'versions']);
    Route::post('/documents/{document}/share', [DocumentController::class, 'share']);

    // Reminders
    Route::get('/reminders', [ReminderController::class, 'index']);
    Route::post('/reminders', [ReminderController::class, 'store']);
    Route::put('/reminders/{reminder}', [ReminderController::class, 'update']);
    Route::delete('/reminders/{reminder}', [ReminderController::class, 'destroy']);
    Route::post('/reminders/{reminder}/complete', [ReminderController::class, 'markComplete']);
    Route::get('/reminders/upcoming', [ReminderController::class, 'upcoming']);
    Route::get('/reminders/overdue', [ReminderController::class, 'overdue']);

    // Billing
    Route::get('/billing/invoices', [BillingController::class, 'index']);
    Route::post('/billing/invoices', [BillingController::class, 'store']);
    Route::get('/billing/invoices/{invoice}', [BillingController::class, 'show']);
    Route::put('/billing/invoices/{invoice}', [BillingController::class, 'update']);
    Route::delete('/billing/invoices/{invoice}', [BillingController::class, 'destroy']);
    Route::get('/billing/invoices/{invoice}/pdf', [BillingController::class, 'generatePdf']);
    Route::post('/billing/invoices/{invoice}/send', [BillingController::class, 'sendEmail']);
    Route::post('/billing/invoices/{invoice}/mark-paid', [BillingController::class, 'markPaid']);
    Route::get('/billing/statistics', [BillingController::class, 'statistics']);

    // Time Tracking
    Route::get('/time-tracking', [TimeTrackingController::class, 'index']);
    Route::post('/time-tracking', [TimeTrackingController::class, 'store']);
    Route::put('/time-tracking/{entry}', [TimeTrackingController::class, 'update']);
    Route::delete('/time-tracking/{entry}', [TimeTrackingController::class, 'destroy']);
    Route::post('/time-tracking/start', [TimeTrackingController::class, 'start']);
    Route::post('/time-tracking/stop', [TimeTrackingController::class, 'stop']);
    Route::get('/time-tracking/current', [TimeTrackingController::class, 'current']);
    Route::get('/time-tracking/reports', [TimeTrackingController::class, 'reports']);
    Route::get('/time-tracking/export', [TimeTrackingController::class, 'export']);

    // Jurisprudence
    Route::get('/jurisprudence', [JurisprudenceController::class, 'index']);
    Route::post('/jurisprudence', [JurisprudenceController::class, 'store']);
    Route::get('/jurisprudence/{case}', [JurisprudenceController::class, 'show']);
    Route::put('/jurisprudence/{case}', [JurisprudenceController::class, 'update']);
    Route::delete('/jurisprudence/{case}', [JurisprudenceController::class, 'destroy']);
    Route::get('/jurisprudence/search', [JurisprudenceController::class, 'search']);
    Route::get('/jurisprudence/{case}/similar', [JurisprudenceController::class, 'similar']);
    Route::post('/jurisprudence/{case}/favorite', [JurisprudenceController::class, 'favorite']);

    // Analytics
    Route::get('/analytics/dashboard', [AnalyticsController::class, 'dashboard']);
    Route::get('/analytics/cases', [AnalyticsController::class, 'cases']);
    Route::get('/analytics/billing', [AnalyticsController::class, 'billing']);
    Route::get('/analytics/time', [AnalyticsController::class, 'time']);
    Route::get('/analytics/documents', [AnalyticsController::class, 'documents']);
    Route::get('/analytics/predictions', [AnalyticsController::class, 'predictions']);

    // AI Assistant
    Route::post('/ai/chat', [AIController::class, 'chat']);
    Route::get('/ai/conversations', [AIController::class, 'listConversations']);
    Route::get('/ai/conversations/{id}', [AIController::class, 'getConversation']);
    Route::post('/ai/generate-document', [AIController::class, 'generateDocument']);
    Route::get('/ai/documents', [AIController::class, 'listGeneratedDocuments']);
    Route::get('/ai/documents/{id}', [AIController::class, 'getGeneratedDocument']);
    Route::put('/ai/documents/{id}', [AIController::class, 'updateGeneratedDocument']);
});

// Public routes
Route::get('/documents/shared/{token}', [DocumentController::class, 'shared'])->name('documents.shared');
