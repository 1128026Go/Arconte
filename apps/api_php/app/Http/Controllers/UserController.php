<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * Obtener perfil del usuario autenticado
     */
    public function getProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'preferences' => $user->preferences ?? [],
                'notification_settings' => $user->notification_settings ?? [],
                'created_at' => $user->created_at,
            ]
        ]);
    }

    /**
     * Actualizar perfil del usuario
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'avatar' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Actualizar nombre y email si se proporcionan
        if ($request->has('name')) {
            $user->name = $request->name;
        }

        if ($request->has('email')) {
            $user->email = $request->email;
        }

        // Manejar upload de avatar
        if ($request->hasFile('avatar')) {
            // Eliminar avatar anterior si existe
            if ($user->avatar && Storage::exists($user->avatar)) {
                Storage::delete($user->avatar);
            }

            // Guardar nuevo avatar
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = $path;
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Perfil actualizado correctamente',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
            ]
        ]);
    }

    /**
     * Cambiar contraseña del usuario
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => ['required', 'confirmed', Password::min(8)],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Verificar que la contraseña actual sea correcta
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'La contraseña actual es incorrecta'
            ], 422);
        }

        // Actualizar contraseña
        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Contraseña actualizada correctamente'
        ]);
    }

    /**
     * Obtener preferencias del usuario
     */
    public function getPreferences(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'preferences' => $user->preferences ?? [
                'theme' => 'light',
                'language' => 'es',
                'timezone' => 'America/Bogota',
                'date_format' => 'DD/MM/YYYY',
            ]
        ]);
    }

    /**
     * Actualizar preferencias del usuario
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'theme' => 'sometimes|in:light,dark',
            'language' => 'sometimes|in:es,en',
            'timezone' => 'sometimes|string',
            'date_format' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Obtener preferencias actuales
        $preferences = $user->preferences ?? [];

        // Actualizar solo los campos proporcionados
        foreach (['theme', 'language', 'timezone', 'date_format'] as $key) {
            if ($request->has($key)) {
                $preferences[$key] = $request->$key;
            }
        }

        $user->preferences = $preferences;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Preferencias actualizadas correctamente',
            'preferences' => $preferences
        ]);
    }

    /**
     * Obtener configuración de notificaciones
     */
    public function getNotificationSettings(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'notification_settings' => $user->notification_settings ?? [
                'email_notifications' => true,
                'case_updates' => true,
                'new_actions' => true,
                'deadlines' => true,
                'weekly_summary' => true,
            ]
        ]);
    }

    /**
     * Actualizar configuración de notificaciones
     */
    public function updateNotificationSettings(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'email_notifications' => 'sometimes|boolean',
            'case_updates' => 'sometimes|boolean',
            'new_actions' => 'sometimes|boolean',
            'deadlines' => 'sometimes|boolean',
            'weekly_summary' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Obtener configuración actual
        $settings = $user->notification_settings ?? [];

        // Actualizar solo los campos proporcionados
        foreach (['email_notifications', 'case_updates', 'new_actions', 'deadlines', 'weekly_summary'] as $key) {
            if ($request->has($key)) {
                $settings[$key] = $request->boolean($key);
            }
        }

        $user->notification_settings = $settings;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Configuración de notificaciones actualizada',
            'notification_settings' => $settings
        ]);
    }
}
