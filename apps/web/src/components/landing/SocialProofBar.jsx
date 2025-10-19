/**
 * Arconte Landing - Social Proof Bar Component
 *
 * Barra de prueba social con números animados y logos de clientes.
 * Genera confianza mostrando métricas reales.
 *
 * Features:
 * - Counter animation para números
 * - Intersection Observer para activar al scrollear
 * - Logos de firmas/instituciones
 * - Responsive design
 *
 * @author Arconte Team
 * @date 2025-10-18
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Users, FileText, Building2, Award, TrendingUp, Clock } from 'lucide-react';
import { fadeInUp } from '../../utils/animations';

// Animated counter component
function AnimatedCounter({ end, duration = 2000, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView && !hasAnimated) {
      setHasAnimated(true);
      let startTime;
      let animationFrame;

      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);

        setCount(Math.floor(progress * end));

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };

      animationFrame = requestAnimationFrame(animate);

      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }
  }, [inView, end, duration, hasAnimated]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString('es-CO')}{suffix}
    </span>
  );
}

export default function SocialProofBar() {
  const stats = [
    {
      icon: Users,
      value: 500,
      suffix: '+',
      label: 'Abogados Activos',
      color: 'blue',
    },
    {
      icon: FileText,
      value: 10000,
      suffix: '+',
      label: 'Casos Gestionados',
      color: 'purple',
    },
    {
      icon: Building2,
      value: 50,
      suffix: '+',
      label: 'Firmas Legales',
      color: 'cyan',
    },
    {
      icon: Clock,
      value: 5000,
      suffix: '+',
      label: 'Horas Ahorradas',
      color: 'emerald',
    },
    {
      icon: TrendingUp,
      value: 98,
      suffix: '%',
      label: 'Satisfacción',
      color: 'pink',
    },
    {
      icon: Award,
      value: 4.9,
      suffix: '/5',
      label: 'Calificación',
      color: 'amber',
    },
  ];

  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
    cyan: 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
    pink: 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/30',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
  };

  return (
    <section className="py-16 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
      <div className="landing-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Confiado por profesionales del derecho
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Miles de abogados en Colombia ya están transformando su práctica con Arconte
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${colorClasses[stat.color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>

                {/* Value */}
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  <AnimatedCounter
                    end={stat.value}
                    suffix={stat.suffix}
                  />
                </div>

                {/* Label */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trusted by Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-500 mb-6 uppercase tracking-wider">
            Instituciones que confían en nosotros
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {/* Placeholder para logos - Fase 3 */}
            <div className="px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300 font-semibold">Universidad Nacional</span>
            </div>
            <div className="px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300 font-semibold">Colegio de Abogados</span>
            </div>
            <div className="px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300 font-semibold">Firma Legal Colombia</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
