/**
 * Arconte Landing - Features Grid Component
 *
 * Grid 3x3 con las 9 funcionalidades principales.
 * Hover effects, icons animados y descripción.
 *
 * Features:
 * - 9 funcionalidades destacadas
 * - Icons de lucide-react
 * - Hover lift effect
 * - Stagger animation al scrollear
 * - Responsive (1 col mobile, 2 cols tablet, 3 cols desktop)
 *
 * @author Arconte Team
 * @date 2025-10-18
 */

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  FileText,
  Brain,
  Calendar,
  Clock,
  DollarSign,
  Search,
  Users,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { staggerContainer, staggerItem } from '../../utils/animations';

export default function FeaturesGrid() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const features = [
    {
      icon: FileText,
      title: 'Gestión de Casos',
      description: 'Organiza todos tus casos legales en un solo lugar. Seguimiento de estado, documentos y plazos.',
      color: 'slate',
      gradient: 'from-primary-600 to-primary-700',
    },
    {
      icon: Brain,
      title: 'IA con Gemini',
      description: 'Asistente inteligente que redacta documentos, resume casos y responde consultas jurídicas.',
      color: 'slate',
      gradient: 'from-primary-500 to-primary-600',
    },
    {
      icon: Search,
      title: 'Jurisprudencia',
      description: 'Búsqueda inteligente en miles de sentencias colombianas. Encuentra precedentes relevantes.',
      color: 'stone',
      gradient: 'from-accent-500 to-accent-600',
    },
    {
      icon: Calendar,
      title: 'Recordatorios',
      description: 'Nunca pierdas un plazo. Alertas automáticas de audiencias, vencimientos y tareas.',
      color: 'emerald',
      gradient: 'from-success to-success-dark',
    },
    {
      icon: Clock,
      title: 'Time Tracking',
      description: 'Registra tiempo por caso y actividad. Facturación automática basada en horas trabajadas.',
      color: 'amber',
      gradient: 'from-warning to-warning-dark',
    },
    {
      icon: DollarSign,
      title: 'Facturación',
      description: 'Genera facturas profesionales. Integración con ePayco para pagos en línea.',
      color: 'green',
      gradient: 'from-success-light to-success',
    },
    {
      icon: Users,
      title: 'Colaboración',
      description: 'Comparte casos con tu equipo. Comentarios, asignaciones y control de acceso.',
      color: 'slate',
      gradient: 'from-primary-400 to-primary-500',
    },
    {
      icon: TrendingUp,
      title: 'Analytics',
      description: 'Dashboards con métricas de tu práctica. Casos ganados, ingresos, productividad.',
      color: 'slate',
      gradient: 'from-accent-600 to-accent-700',
    },
    {
      icon: Shield,
      title: 'Seguridad',
      description: 'Encriptación end-to-end. Backups automáticos. Cumplimiento GDPR y normas colombianas.',
      color: 'slate',
      gradient: 'from-primary-700 to-primary-800',
    },
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900" id="features">
      <div className="landing-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold mb-4">
            Funcionalidades
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-primary-900 dark:text-white mb-6">
            Todo lo que necesitas para tu
            <br />
            <span className="text-primary-600 dark:text-primary-400">práctica legal</span>
          </h2>
          <p className="text-xl text-primary-600 dark:text-primary-400 max-w-3xl mx-auto">
            Arconte combina las mejores herramientas de gestión legal con inteligencia artificial avanzada
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="group relative"
            >
              {/* Card */}
              <div className="h-full bg-white dark:bg-gray-800 rounded-xl p-8 hover:shadow-lg transition-all hover:-translate-y-1 border border-primary-200 dark:border-primary-700">
                {/* Icon */}
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-sm`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-primary-900 dark:text-white mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-primary-600 dark:text-primary-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-xl opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`}></div>
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
            href="#pricing"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all"
          >
            Ver Planes y Precios
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
