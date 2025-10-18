<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        // Usar autenticación por sesión de Laravel (stateful)
        auth()->login($user, true);
        $request->session()->regenerate();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'message' => 'Usuario registrado exitosamente'
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json([
                'message' => 'Credenciales invalidas',
            ], 401);
        }

        // Usar autenticación por sesión de Laravel (stateful)
        auth()->login($user, true);
        $request->session()->regenerate();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'message' => 'Login exitoso'
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ])
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    public function logout(Request $request)
    {
        \Illuminate\Support\Facades\Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Parámetros comunes de cookies
        $cookieDomain = config('session.domain');
        $cookiePath = config('session.path', '/');
        $cookieSameSite = config('session.same_site', 'lax');

        // Respuesta base
        $response = response()->json([
            'ok' => true,
            'message' => 'Sesión cerrada exitosamente'
        ]);

        // Borrar XSRF-TOKEN (no httpOnly) en variantes de dominio
        foreach ([null, 'localhost'] as $domainVariant) {
            $response->headers->setCookie(cookie(
                'XSRF-TOKEN',
                '',
                -2628000,
                $cookiePath,
                $domainVariant,
                false,
                false,
                false,
                $cookieSameSite
            ));
        }

        // Borrar cookie de sesión en variantes de dominio
        foreach ([null, 'localhost'] as $domainVariant) {
            $response->headers->setCookie(cookie(
                config('session.cookie'),
                '',
                -2628000,
                $cookiePath,
                $domainVariant,
                config('session.secure', false),
                config('session.http_only', true),
                false,
                $cookieSameSite
            ));
        }

        // Borrar cookies "remember_me" (nombre dinámico tipo remember_web_*)
        foreach ($request->cookies->keys() as $cookieName) {
            if (str_starts_with($cookieName, 'remember_')) {
                foreach ([null, 'localhost'] as $domainVariant) {
                    $response->headers->setCookie(cookie(
                        $cookieName,
                        '',
                        -2628000,
                        $cookiePath,
                        $domainVariant,
                        config('session.secure', false),
                        true, // normalmente httpOnly
                        false,
                        $cookieSameSite
                    ));
                }
            }
        }

        return $response;
    }
}
