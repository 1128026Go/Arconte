import React, { useState } from "react";
import { motion } from "framer-motion";
import { login, me } from "../lib/api";
import { Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { fadeInUp } from "../utils/animations";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    if (!email || !password) {
      setError("Email y contraseña son requeridos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(email, password);
      // Validar sesión inmediatamente para evitar estados inconsistentes
      try {
        await me();
      } catch (_) {
        // Ignorar, el redirect de todas formas forzará nueva verificación
      }
      // Usar window.location.replace para hard reload (mismo que logout)
      window.location.replace("/dashboard");
    } catch (err) {
      setError("Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />

      {/* Animated blobs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-40 right-20 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute bottom-20 left-40 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      {/* Login card */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass p-8 rounded-2xl">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-4">
              <h1 className="text-3xl font-bold gradient-text">Arconte</h1>
            </Link>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Bienvenido de nuevo
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Ingresa a tu cuenta para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-blue focus:border-transparent transition"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-blue focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" className="mr-2 rounded text-primary-blue focus:ring-primary-blue" />
                <span className="text-gray-600 dark:text-gray-400">Recordarme</span>
              </label>
              <Link to="/forgot-password" className="text-primary-blue hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-blue text-white rounded-lg hover-glow font-medium flex items-center justify-center space-x-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="loading-spinner w-5 h-5" />
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/50 dark:bg-gray-800/50 text-gray-500">
                o continúa con
              </span>
            </div>
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-center space-x-2">
              <span>Google</span>
            </button>
            <button className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-center space-x-2">
              <span>Microsoft</span>
            </button>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 bg-primary-blue rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1">
                  Credenciales de demostración:
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  📧 admin@juridica.test<br />
                  🔐 admin123
                </p>
              </div>
            </div>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-primary-blue hover:underline font-medium">
              Crear cuenta gratis
            </Link>
          </p>

          {/* Back to home */}
          <p className="text-center text-sm text-gray-500 mt-4">
            <Link to="/" className="hover:text-primary-blue transition flex items-center justify-center space-x-1">
              <span>← Volver al inicio</span>
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          © {new Date().getFullYear()} Arconte. Sistema profesional de gestión jurídica.
        </p>
      </motion.div>
    </div>
  );
}
