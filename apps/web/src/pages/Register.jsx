import React, { useState } from "react";
import { auth } from "../lib/api";
import { Link } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  async function handleRegister(event) {
    event.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.password_confirmation) {
      setError("Todos los campos son requeridos");
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await auth.register(
        formData.name,
        formData.email,
        formData.password,
        formData.password_confirmation
      );
      setSuccess(true);
      setTimeout(() => {
        window.location.replace("/dashboard");
      }, 1500);
    } catch (err) {
      setError(err.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy-50 flex items-center justify-center px-4">
      {/* Fondo igual que login */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-50 to-slate-100" />

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] border border-slate-200 ring-1 ring-navy-900/5 overflow-hidden">
          {/* Header with gradient and icon */}
          <div className="bg-gradient-to-r from-navy-50 to-navy-100 border-b border-slate-200 px-8 py-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-navy-900 text-white grid place-items-center text-xl">
              ⚖️
            </div>
            <h1 className="mt-3 text-center text-2xl font-semibold text-navy-900">
              Crear Cuenta en Arconte
            </h1>
            <p className="text-center text-sm text-navy-700">
              Comienza a gestionar tus casos jurídicos
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            {success ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-bold text-navy-800 mb-2">
                  ¡Cuenta creada exitosamente!
                </h3>
                <p className="text-slate-600 text-sm">
                  Redirigiendo a tu panel...
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-navy-800 mb-2">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Juan Pérez"
                      className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg text-navy-900 placeholder-slate-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-navy-800 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
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
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg text-navy-900 placeholder-slate-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-navy-800 mb-2">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      name="password_confirmation"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      placeholder="Repite tu contraseña"
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
                      Creando cuenta...
                    </>
                  ) : (
                    <>
                      Crear Cuenta
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}

            {!success && (
              <>
                {/* Terms */}
                <p className="mt-6 text-xs text-center text-slate-500">
                  Al registrarte, aceptas nuestros Términos y Condiciones
                </p>

                {/* Login Link */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-600">
                    ¿Ya tienes una cuenta?{" "}
                    <Link
                      to="/login"
                      className="font-semibold text-gold-600 hover:text-gold-700 transition-colors"
                    >
                      Inicia sesión aquí
                    </Link>
                  </p>
                </div>
              </>
            )}
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
