import React, { useState } from "react";
import { login, me } from "../lib/api";
import { Link } from "react-router-dom";
import { Scale, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen bg-navy-50 flex items-center justify-center px-4">
      {/* Fondo tipo Facebook pero con Navy */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-50 to-slate-100" />

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] border border-slate-200 ring-1 ring-navy-900/5 overflow-hidden">
          {/* Header with gradient and icon */}
          <div className="bg-gradient-to-r from-navy-50 to-navy-100 border-b border-slate-200 px-8 py-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-navy-900 text-white grid place-items-center text-xl">
              ⚖️
            </div>
            <h1 className="mt-3 text-center text-2xl font-semibold text-navy-900">
              Arconte
            </h1>
            <p className="text-center text-sm text-navy-700">
              Sistema de Gestión Jurídica Inteligente
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-navy-800 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg text-navy-900 placeholder-slate-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-navy-800 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg text-navy-900 placeholder-slate-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button - Gold CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold-500 hover:bg-gold-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    Iniciar Sesión
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-5 h-5 bg-navy-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-navy-800 mb-1">
                    Credenciales de demostración:
                  </p>
                  <p className="text-xs text-slate-600 font-mono">
                    📧 admin@juridica.test<br />
                    🔐 admin123
                  </p>
                </div>
              </div>
            </div>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                ¿No tienes una cuenta?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-gold-600 hover:text-gold-700 transition-colors"
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </div>

          {/* Gold decorative stripe */}
          <div className="h-1 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400"></div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          © {new Date().getFullYear()} Arconte. Sistema profesional de gestión jurídica.
        </p>
      </div>
    </div>
  );
}
