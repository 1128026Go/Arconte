/**
 * Arconte Landing - How It Works Component
 *
 * Timeline vertical con 4 pasos del proceso.
 * Línea conectora animada y cards con hover.
 *
 * Features:
 * - Timeline vertical con 4 pasos
 * - Línea conectora animada
 * - Icons grandes
 * - Stagger animation
 * - Responsive
 *
 * @author Arconte Team
 * @date 2025-10-18
 */

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { UserPlus, Upload, Sparkles, Rocket } from 'lucide-react';
import { staggerContainer, staggerItem } from '../../utils/animations';

export default function HowItWorks() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const steps = [
    {
      icon: UserPlus,
      number: '01',
      title: 'Crea tu cuenta',
      description: 'Regístrate gratis en 30 segundos. Sin tarjeta de crédito, sin compromisos.',
      color: 'blue',
    },
    {
      icon: Upload,
      number: '02',
      title: 'Sube tus casos',
      description: 'Importa casos existentes o crea nuevos. Arrastra documentos y deja que la IA los organice.',
      color: 'purple',
    },
    {
      icon: Sparkles,
      number: '03',
      title: 'Activa la IA',
      description: 'Gemini analiza tus casos, genera resúmenes y te sugiere estrategias legales.',
      color: 'cyan',
    },
    {
      icon: Rocket,
      number: '04',
      title: 'Ahorra tiempo',
      description: 'Automatiza tareas repetitivas y enfócate en lo importante: ganar casos.',
      color: 'emerald',
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
      gradient: 'from-blue-500 to-blue-600',
    },
    purple: {
      bg: 'bg-purple-500',
      text: 'text-purple-600 dark:text-purple-400',
      gradient: 'from-purple-500 to-purple-600',
    },
    cyan: {
      bg: 'bg-cyan-500',
      text: 'text-cyan-600 dark:text-cyan-400',
      gradient: 'from-cyan-500 to-cyan-600',
    },
    emerald: {
      bg: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      gradient: 'from-emerald-500 to-emerald-600',
    },
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800" id="how-it-works">
      <div className="landing-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm font-semibold mb-4">
            Proceso
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Empieza en <span className="gradient-text">4 simples pasos</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            De cero a productividad máxima en minutos
          </p>
        </motion.div>

        {/* Timeline */}
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="relative"
            >
              <div className="flex gap-8 items-start mb-12 last:mb-0">
                {/* Left - Number & Icon */}
                <div className="flex flex-col items-center">
                  {/* Number badge */}
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colorClasses[step.color].gradient} flex items-center justify-center text-white font-bold text-xl shadow-lg mb-4`}>
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${colorClasses[step.color].gradient} flex items-center justify-center shadow-xl hover:scale-110 transition-transform`}>
                    <step.icon className="w-10 h-10 text-white" />
                  </div>

                  {/* Connecting line (except last) */}
                  {index < steps.length - 1 && (
                    <div className="w-1 h-20 bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-700 mt-4"></div>
                  )}
                </div>

                {/* Right - Content */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            <UserPlus className="w-5 h-5" />
            Empezar Ahora Gratis
          </a>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
            No se requiere tarjeta de crédito • Setup en 30 segundos
          </p>
        </motion.div>
      </div>
    </section>
  );
}
