/**
 * Arconte Landing - Pricing Section Component
 *
 * Sección de precios con 4 planes (Free, Pro, Firma, Enterprise).
 * Badge "Más Popular", comparativa de features, CTAs por plan.
 *
 * Features:
 * - 4 planes de precios
 * - Toggle anual/mensual
 * - Badge "Más Popular" en plan destacado
 * - Lista de features por plan
 * - Hover effects
 * - Responsive grid
 *
 * @author Arconte Team
 * @date 2025-10-18
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Check, X, Sparkles, Crown, Building2, Rocket } from 'lucide-react';
import { staggerContainer, staggerItem } from '../../utils/animations';

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const plans = [
    {
      name: 'Gratis',
      icon: Rocket,
      price: { monthly: 0, annual: 0 },
      description: 'Perfecto para empezar',
      popular: false,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      features: [
        { text: '5 casos activos', included: true },
        { text: '10 consultas IA/mes', included: true },
        { text: 'Gestión básica de casos', included: true },
        { text: 'Recordatorios', included: true },
        { text: 'Soporte por email', included: true },
        { text: 'Jurisprudencia limitada', included: false },
        { text: 'Time tracking', included: false },
        { text: 'Facturación', included: false },
      ],
      cta: 'Empezar Gratis',
      ctaLink: '/register',
    },
    {
      name: 'Pro',
      icon: Sparkles,
      price: { monthly: 49900, annual: 39900 },
      description: 'Para abogados independientes',
      popular: true,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      features: [
        { text: 'Casos ilimitados', included: true },
        { text: '500 consultas IA/mes', included: true },
        { text: 'Todas las funcionalidades', included: true },
        { text: 'Jurisprudencia completa', included: true },
        { text: 'Time tracking', included: true },
        { text: 'Facturación electrónica', included: true },
        { text: 'Analytics avanzados', included: true },
        { text: 'Soporte prioritario', included: true },
      ],
      cta: 'Probar 14 días gratis',
      ctaLink: '/register?plan=pro',
    },
    {
      name: 'Firma',
      icon: Building2,
      price: { monthly: 99900, annual: 79900 },
      description: 'Para firmas legales',
      popular: false,
      color: 'cyan',
      gradient: 'from-cyan-500 to-cyan-600',
      features: [
        { text: 'Todo de Pro +', included: true },
        { text: 'Hasta 10 usuarios', included: true },
        { text: 'Colaboración en equipo', included: true },
        { text: 'IA ilimitada', included: true },
        { text: 'Dashboard de firma', included: true },
        { text: 'Control de acceso', included: true },
        { text: 'API access', included: true },
        { text: 'Onboarding personalizado', included: true },
      ],
      cta: 'Agendar Demo',
      ctaLink: '/contact?plan=firma',
    },
    {
      name: 'Enterprise',
      icon: Crown,
      price: { monthly: null, annual: null },
      description: 'Soluciones a medida',
      popular: false,
      color: 'amber',
      gradient: 'from-amber-500 to-amber-600',
      features: [
        { text: 'Todo de Firma +', included: true },
        { text: 'Usuarios ilimitados', included: true },
        { text: 'Servidor dedicado', included: true },
        { text: 'SLA garantizado', included: true },
        { text: 'Integración custom', included: true },
        { text: 'Soporte 24/7', included: true },
        { text: 'Capacitación on-site', included: true },
        { text: 'Compliance personalizado', included: true },
      ],
      cta: 'Contactar Ventas',
      ctaLink: '/contact?plan=enterprise',
    },
  ];

  const formatPrice = (price) => {
    if (price === null) return 'Personalizado';
    if (price === 0) return 'Gratis';
    return `$${price.toLocaleString('es-CO')}`;
  };

  return (
    <section className="py-20 bg-white dark:bg-gray-900" id="pricing">
      <div className="landing-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-semibold mb-4">
            Precios
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Un plan para cada
            <br />
            <span className="gradient-text">etapa de tu carrera</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Empieza gratis. Actualiza cuando lo necesites. Sin compromisos.
          </p>

          {/* Toggle Anual/Mensual */}
          <div className="inline-flex items-center gap-4 bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                !isAnnual
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                isAnnual
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Anual
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Grid */}
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="relative group"
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg pulse-glow">
                    ⭐ Más Popular
                  </div>
                </div>
              )}

              {/* Card */}
              <div
                className={`h-full bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 border-2 transition-all ${
                  plan.popular
                    ? 'border-purple-500 shadow-2xl scale-105'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500'
                } hover:shadow-xl hover:-translate-y-1`}
              >
                {/* Icon */}
                <div className={`w-14 h-14 bg-gradient-to-br ${plan.gradient} rounded-xl flex items-center justify-center mb-4`}>
                  <plan.icon className="w-7 h-7 text-white" />
                </div>

                {/* Name & Description */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(isAnnual ? plan.price.annual : plan.price.monthly)}
                    </span>
                    {plan.price.monthly !== null && plan.price.monthly > 0 && (
                      <span className="text-gray-600 dark:text-gray-400">/mes</span>
                    )}
                  </div>
                  {isAnnual && plan.price.monthly > 0 && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Ahorras ${((plan.price.monthly - plan.price.annual) * 12).toLocaleString('es-CO')}/año
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <a
                  href={plan.ctaLink}
                  className={`block w-full text-center py-3 px-6 rounded-lg font-semibold mb-8 transition-all ${
                    plan.popular
                      ? `bg-gradient-to-r ${plan.gradient} text-white hover:shadow-xl hover:scale-105`
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {plan.cta}
                </a>

                {/* Features List */}
                <ul className="space-y-3">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-500 dark:text-gray-500 line-through'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 dark:text-gray-400">
            ¿Tienes preguntas? {' '}
            <a href="#contact" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Contáctanos
            </a>
            {' '} o lee nuestras {' '}
            <a href="/faq" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Preguntas Frecuentes
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
