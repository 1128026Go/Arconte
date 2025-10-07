<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Services\PdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class BillingController extends Controller
{
    public function __construct(private PdfService $pdfService)
    {
    }

    /**
     * List invoices with filters (client, status, date range)
     */
    public function index(Request $request)
    {
        $query = Invoice::where('user_id', $request->user()->id)
            ->with(['case', 'items']);

        // Filter by case (client)
        if ($request->filled('case_id')) {
            $query->where('case_id', $request->input('case_id'));
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->input('from_date'));
        }

        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->input('to_date'));
        }

        // Search by invoice number
        if ($request->filled('search')) {
            $query->where('number', 'like', '%' . $request->input('search') . '%');
        }

        $invoices = $query->latest()->paginate(20);

        return response()->json($invoices);
    }

    /**
     * Create invoice with items and auto-calculate totals
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'case_id' => 'required|exists:case_models,id',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.qty' => 'required|numeric|min:0',
            'items.*.unit_price' => 'required|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        return DB::transaction(function () use ($request) {
            $user = $request->user();
            $taxRate = $request->input('tax_rate', 19); // Default IVA 19% Colombia

            // Generate invoice number
            $lastInvoice = Invoice::where('user_id', $user->id)
                ->latest('id')
                ->first();

            $number = 'INV-' . date('Y') . '-' . str_pad(($lastInvoice ? $lastInvoice->id : 0) + 1, 5, '0', STR_PAD_LEFT);

            // Calculate totals
            $subtotal = 0;
            foreach ($request->input('items') as $item) {
                $subtotal += $item['qty'] * $item['unit_price'];
            }

            $tax = $subtotal * ($taxRate / 100);
            $total = $subtotal + $tax;

            // Create invoice
            $invoice = Invoice::create([
                'user_id' => $user->id,
                'case_id' => $request->input('case_id'),
                'number' => $number,
                'status' => 'draft',
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
            ]);

            // Create invoice items
            foreach ($request->input('items') as $itemData) {
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'description' => $itemData['description'],
                    'qty' => $itemData['qty'],
                    'unit_price' => $itemData['unit_price'],
                    'amount' => $itemData['qty'] * $itemData['unit_price'],
                ]);
            }

            // Audit log
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'invoice.created',
                'auditable_type' => Invoice::class,
                'auditable_id' => $invoice->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json($invoice->load(['case', 'items']), 201);
        });
    }

    /**
     * Get invoice with details
     */
    public function show(Request $request, Invoice $invoice)
    {
        $this->authorize('view', $invoice);

        return response()->json($invoice->load(['case', 'items', 'timeEntries']));
    }

    /**
     * Update invoice (only if not paid)
     */
    public function update(Request $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        if ($invoice->paid_at) {
            return response()->json([
                'message' => 'Cannot update paid invoice',
            ], 422);
        }

        $validated = $request->validate([
            'case_id' => 'sometimes|exists:case_models,id',
            'status' => 'sometimes|in:draft,sent,paid,cancelled',
            'items' => 'sometimes|array|min:1',
            'items.*.description' => 'required_with:items|string|max:255',
            'items.*.qty' => 'required_with:items|numeric|min:0',
            'items.*.unit_price' => 'required_with:items|numeric|min:0',
        ]);

        return DB::transaction(function () use ($request, $invoice, $validated) {
            // Update basic fields
            if (isset($validated['case_id']) || isset($validated['status'])) {
                $invoice->update([
                    'case_id' => $validated['case_id'] ?? $invoice->case_id,
                    'status' => $validated['status'] ?? $invoice->status,
                ]);
            }

            // Update items if provided
            if (isset($validated['items'])) {
                // Delete old items
                $invoice->items()->delete();

                // Recalculate totals
                $subtotal = 0;
                foreach ($validated['items'] as $itemData) {
                    $amount = $itemData['qty'] * $itemData['unit_price'];
                    $subtotal += $amount;

                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'description' => $itemData['description'],
                        'qty' => $itemData['qty'],
                        'unit_price' => $itemData['unit_price'],
                        'amount' => $amount,
                    ]);
                }

                $tax = $subtotal * 0.19; // 19% IVA
                $total = $subtotal + $tax;

                $invoice->update([
                    'subtotal' => $subtotal,
                    'tax' => $tax,
                    'total' => $total,
                ]);
            }

            // Audit log
            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'invoice.updated',
                'auditable_type' => Invoice::class,
                'auditable_id' => $invoice->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json($invoice->fresh(['case', 'items']));
        });
    }

    /**
     * Annul invoice
     */
    public function destroy(Request $request, Invoice $invoice)
    {
        $this->authorize('delete', $invoice);

        if ($invoice->paid_at) {
            return response()->json([
                'message' => 'Cannot delete paid invoice',
            ], 422);
        }

        $invoice->update(['status' => 'cancelled']);

        // Audit log
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'invoice.cancelled',
            'auditable_type' => Invoice::class,
            'auditable_id' => $invoice->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['status' => 'ok']);
    }

    /**
     * Generate PDF invoice
     */
    public function generatePdf(Request $request, Invoice $invoice)
    {
        $this->authorize('view', $invoice);

        $pdf = $this->pdfService->generateInvoice($invoice);

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="invoice-' . $invoice->number . '.pdf"',
        ]);
    }

    /**
     * Send invoice by email
     */
    public function sendEmail(Request $request, Invoice $invoice)
    {
        $this->authorize('view', $invoice);

        $validated = $request->validate([
            'email' => 'required|email',
            'message' => 'nullable|string',
        ]);

        try {
            $pdf = $this->pdfService->generateInvoice($invoice);

            Mail::raw($validated['message'] ?? 'Attached is your invoice.', function ($message) use ($validated, $invoice, $pdf) {
                $message->to($validated['email'])
                    ->subject('Invoice ' . $invoice->number)
                    ->attachData($pdf, 'invoice-' . $invoice->number . '.pdf', [
                        'mime' => 'application/pdf',
                    ]);
            });

            $invoice->update([
                'sent_at' => now(),
                'status' => 'sent',
            ]);

            // Audit log
            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'invoice.sent',
                'auditable_type' => Invoice::class,
                'auditable_id' => $invoice->id,
                'new_values' => ['email' => $validated['email']],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json(['status' => 'ok', 'message' => 'Invoice sent successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send email',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark invoice as paid
     */
    public function markPaid(Request $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        $validated = $request->validate([
            'paid_at' => 'nullable|date',
        ]);

        $invoice->update([
            'status' => 'paid',
            'paid_at' => $validated['paid_at'] ?? now(),
        ]);

        // Audit log
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'invoice.paid',
            'auditable_type' => Invoice::class,
            'auditable_id' => $invoice->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['status' => 'ok', 'invoice' => $invoice]);
    }

    /**
     * Get billing statistics
     */
    public function statistics(Request $request)
    {
        $user = $request->user();

        $total = Invoice::where('user_id', $user->id)->sum('total');
        $pending = Invoice::where('user_id', $user->id)
            ->whereNull('paid_at')
            ->where('status', '!=', 'cancelled')
            ->sum('total');
        $paid = Invoice::where('user_id', $user->id)
            ->whereNotNull('paid_at')
            ->sum('total');

        // Monthly stats
        $monthlyTotal = Invoice::where('user_id', $user->id)
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->sum('total');

        $monthlyPaid = Invoice::where('user_id', $user->id)
            ->whereNotNull('paid_at')
            ->whereYear('paid_at', now()->year)
            ->whereMonth('paid_at', now()->month)
            ->sum('total');

        return response()->json([
            'total_invoiced' => $total,
            'total_pending' => $pending,
            'total_paid' => $paid,
            'month_total' => $monthlyTotal,
            'month_paid' => $monthlyPaid,
        ]);
    }
}