import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Check, Crown, ArrowRight, Clock, TrendingUp,
  Shield, Sparkles, Gift, Users, Star, Mail
} from 'lucide-react';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';

export default function BetaTesters() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    firm: '',
    caseVolume: '',
    hearAbout: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Integrar con tu API
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitted(true);
        // Track conversion
        if (window.gtag) {
          window.gtag('event', 'beta_signup', {
            event_category: 'engagement',
            event_label: 'Beta Testers Program'
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-2xl"
        >
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ¡Bienvenido al Programa Beta! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Revisa tu email. Te hemos enviado las instrucciones de acceso y un calendario para agendar tu sesión de onboarding personalizada.
          </p>
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4">Próximos pasos:</h3>
            <ul className="text-left space-y-3">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span>Revisa tu email para activar tu cuenta</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span>Agenda tu sesión de onboarding (15 minutos)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span>Únete al grupo exclusivo de WhatsApp de beta testers</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        {/* Animated background blobs */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-40 right-20 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-40 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Programa Exclusivo Beta Testers
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Sé de los primeros
              <span className="gradient-text block mt-2">50 abogados en usar Arconte</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Obtén acceso anticipado, 3 meses GRATIS del Plan Pro, y ayuda a construir
              la mejor plataforma de gestión jurídica de Colombia.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-green-600">
                <Users className="w-5 h-5" />
                <span className="font-medium">32 de 50 cupos ocupados</span>
              </div>
              <div className="flex items-center gap-2 text-orange-600">
                <Clock className="w-5 h-5" />
                <span className="font-medium">¡Solo quedan 18 espacios!</span>
              </div>
            </div>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-3 gap-6 mb-16"
          >
            <motion.div variants={staggerItem} className="glass p-6 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">3 Meses Gratis</h3>
              <p className="text-gray-600">
                Plan Pro valorado en $149.700. Acceso completo sin restricciones.
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="glass p-6 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Soporte VIP</h3>
              <p className="text-gray-600">
                Línea directa con el fundador. WhatsApp prioritario 24/7.
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="glass p-6 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Influye en el Producto</h3>
              <p className="text-gray-600">
                Tus sugerencias se implementan primero. Moldea el futuro de Arconte.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section className="relative py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8">
            {/* Left: Why Join */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="md:col-span-2"
            >
              <h2 className="text-3xl font-bold mb-6">¿Por qué unirte?</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Ahorra 10+ horas semanales</h4>
                    <p className="text-gray-600 text-sm">Automatiza consultas a Rama Judicial</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Nunca pierdas un plazo</h4>
                    <p className="text-gray-600 text-sm">Alertas en tiempo real 24/7</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">IA que analiza documentos</h4>
                    <p className="text-gray-600 text-sm">Google Gemini clasifica urgencias</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Dashboard visual moderno</h4>
                    <p className="text-gray-600 text-sm">Gestiona todos tus casos en un solo lugar</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Descuento permanente</h4>
                    <p className="text-gray-600 text-sm">-50% de por vida después de beta</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 glass p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-8 h-8 text-blue-600" />
                  <h4 className="font-bold">100% Seguro</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Tus datos están protegidos con encriptación de nivel bancario.
                  Cumplimos GDPR y leyes colombianas de protección de datos.
                </p>
              </div>
            </motion.div>

            {/* Right: Form */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="md:col-span-3"
            >
              <div className="glass p-8 rounded-2xl">
                <h3 className="text-2xl font-bold mb-2">Solicita tu acceso beta</h3>
                <p className="text-gray-600 mb-6">Responde en 2 minutos. Sin compromiso.</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Dr. Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email profesional *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="juan@bufete.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp (opcional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+57 300 123 4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Firma / Independiente *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firm}
                      onChange={(e) => setFormData({...formData, firm: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Pérez & Asociados"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Cuántos casos manejas actualmente? *
                    </label>
                    <select
                      required
                      value={formData.caseVolume}
                      onChange={(e) => setFormData({...formData, caseVolume: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="1-5">1-5 casos</option>
                      <option value="6-15">6-15 casos</option>
                      <option value="16-30">16-30 casos</option>
                      <option value="31-50">31-50 casos</option>
                      <option value="51+">Más de 50 casos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Cómo nos conociste?
                    </label>
                    <select
                      value={formData.hearAbout}
                      onChange={(e) => setFormData({...formData, hearAbout: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="twitter">Twitter/X</option>
                      <option value="whatsapp">WhatsApp/Grupo</option>
                      <option value="referral">Referido</option>
                      <option value="google">Google</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner w-5 h-5" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        Solicitar Acceso Beta
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Al enviar este formulario aceptas recibir comunicaciones de Arconte.
                    Puedes cancelar en cualquier momento.
                  </p>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Lo que dicen nuestros beta testers</h2>
            <p className="text-gray-600">Resultados reales de abogados usando Arconte</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            <motion.div variants={staggerItem} className="glass p-6 rounded-xl">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Ahora llego a casa a las 6 PM en vez de las 9 PM. Mi familia está feliz."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  JP
                </div>
                <div>
                  <p className="font-semibold">Dr. Juan Pérez</p>
                  <p className="text-sm text-gray-500">Pérez & Asociados</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={staggerItem} className="glass p-6 rounded-xl">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "No he perdido un solo plazo en 2 meses. Antes perdía 2-3 por mes."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  ML
                </div>
                <div>
                  <p className="font-semibold">Dra. María López</p>
                  <p className="text-sm text-gray-500">Independiente</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={staggerItem} className="glass p-6 rounded-xl">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Ahora puedo atender 5 casos más. El ROI es brutal."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                  CR
                </div>
                <div>
                  <p className="font-semibold">Dr. Carlos Ramírez</p>
                  <p className="text-sm text-gray-500">Ramírez Legal</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="glass p-12 rounded-2xl"
          >
            <h2 className="text-4xl font-bold mb-4">
              ¿Listo para recuperar 10+ horas semanales?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Únete a los 32 abogados que ya están transformando su práctica legal.
            </p>
            <a
              href="#form"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-2xl transition-all"
            >
              Solicitar Acceso Beta
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
