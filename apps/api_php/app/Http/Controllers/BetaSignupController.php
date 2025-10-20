<?php

namespace App\Http\Controllers;

use App\Models\BetaSignup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;

class BetaSignupController extends Controller
{
    /**
     * Store a new beta signup
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:beta_signups,email',
            'phone' => 'nullable|string|max:255',
            'firm' => 'required|string|max:255',
            'caseVolume' => 'required|string',
            'hearAbout' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $betaSignup = BetaSignup::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'firm' => $request->firm,
                'case_volume' => $request->caseVolume,
                'hear_about' => $request->hearAbout,
                'status' => 'pending'
            ]);

            // Send confirmation email (optional - configure MAIL in .env)
            try {
                Mail::send('emails.beta-welcome', ['signup' => $betaSignup], function ($message) use ($betaSignup) {
                    $message->to($betaSignup->email)
                            ->subject('¡Bienvenido al Programa Beta de Arconte!');
                });
            } catch (\Exception $e) {
                \Log::warning('Failed to send beta welcome email: ' . $e->getMessage());
            }

            // Send notification to admin (optional)
            try {
                Mail::send('emails.beta-admin-notification', ['signup' => $betaSignup], function ($message) {
                    $message->to(config('mail.admin_email', 'admin@arconte.com'))
                            ->subject('Nuevo Beta Tester: ' . $betaSignup->name);
                });
            } catch (\Exception $e) {
                \Log::warning('Failed to send admin notification: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Registro exitoso. Revisa tu email.',
                'data' => $betaSignup
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Beta signup error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al procesar el registro. Intenta de nuevo.'
            ], 500);
        }
    }

    /**
     * Get all beta signups (admin only)
     */
    public function index()
    {
        $signups = BetaSignup::orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $signups,
            'stats' => [
                'total' => $signups->count(),
                'pending' => $signups->where('status', 'pending')->count(),
                'approved' => $signups->where('status', 'approved')->count(),
                'contacted' => $signups->where('status', 'contacted')->count(),
            ]
        ]);
    }

    /**
     * Update beta signup status
     */
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,approved,rejected,contacted',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $signup = BetaSignup::findOrFail($id);
        $signup->status = $request->status;

        if ($request->notes) {
            $signup->notes = $request->notes;
        }

        if ($request->status === 'contacted') {
            $signup->contacted_at = now();
        }

        $signup->save();

        return response()->json([
            'success' => true,
            'message' => 'Estado actualizado correctamente',
            'data' => $signup
        ]);
    }
}
