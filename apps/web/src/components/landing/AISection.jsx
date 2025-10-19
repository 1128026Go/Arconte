/**
 * Arconte Landing - AI Section Component
 *
 * Sección destacada mostrando las capacidades de Gemini AI.
 * Layout 50/50 con demo visual y lista de features.
 *
 * Features:
 * - Logo de Gemini AI
 * - Lista de capacidades IA
 * - Demo placeholder (video/screenshot)
 * - Gradiente de fondo
 * - Responsive (stack en mobile)
 *
 * @author Arconte Team
 * @date 2025-10-18
 */

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Sparkles,
  FileText,
  MessageSquare,
  Search,
  Zap,
  CheckCircle2,
  Brain,
  TrendingUp,
} from 'lucide-react';
import { fadeInUp } from '../../utils/animations';

export default function AISection() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const capabilities = [
    {
      icon: FileText,
      title: 'Redacción Automática',
      description: 'Genera demandas, contratos y escritos legales en segundos',
    },
    {
      icon: MessageSquare,
      title: 'Chat Jurídico',
      description: 'Pregunta sobre leyes colombianas y obtén respuestas precisas',
    },
    {
      icon: Search,
      title: 'Análisis de Casos',
      description: 'Identifica precedentes relevantes y estrategias ganadoras',
    },
    {
      icon: Zap,
      title: 'Resúmenes Inteligentes',
      description: 'Convierte documentos largos en resúmenes ejecutivos',
    },
  ];

  const stats = [
    { value: '10x', label: 'Más rápido' },
    { value: '95%', label: 'Precisión' },
    { value: '24/7', label: 'Disponible' },
  ];

  return (
    <section
      ref={ref}
      className="py-20 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden relative"
      id="ai-section"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
      </div>

      <div className="landing-container relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            Potenciado por IA
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Conoce tu asistente
            <br />
            <span className="bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
              Google Gemini AI
            </span>
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            La IA más avanzada del mundo, ahora al servicio de tu práctica legal
          </p>
        </motion.div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Demo Visual */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Main demo card */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
              {/* Gemini logo placeholder */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl flex items-center justify-center">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Google Gemini</h3>
                  <p className="text-sm text-blue-200">AI Assistant</p>
                </div>
              </div>

              {/* Chat demo */}
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-sm text-blue-200 mb-2">Usuario:</p>
                  <p className="text-white">"Redacta una demanda de divorcio por mutuo acuerdo"</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-400/30">
                  <p className="text-sm text-blue-200 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Gemini:
                  </p>
                  <p className="text-white text-sm leading-relaxed">
                    "Por supuesto. He generado una demanda de divorcio conforme al Código Civil colombiano, incluyendo todos los requisitos legales..."
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors">
                      Copiar
                    </button>
                    <button className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors">
                      Editar
                    </button>
                    <button className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors">
                      Exportar
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-blue-200">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-4 -right-4 bg-gradient-to-br from-yellow-400 to-orange-400 text-gray-900 px-4 py-2 rounded-full font-bold text-sm shadow-xl"
            >
              🔥 Más usado
            </motion.div>
          </motion.div>

          {/* Right - Capabilities List */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h3 className="text-3xl font-bold mb-8">
              Capacidades que transformarán tu práctica
            </h3>

            {capabilities.map((capability, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all hover:scale-105"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                    <capability.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">{capability.title}</h4>
                  <p className="text-blue-200 text-sm">{capability.description}</p>
                </div>
              </motion.div>
            ))}

            {/* CTA */}
            <div className="pt-6">
              <a
                href="#demo"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-900 rounded-lg font-semibold hover:bg-blue-50 transition-all hover:scale-105"
              >
                <Sparkles className="w-5 h-5" />
                Prueba el Asistente IA
              </a>
            </div>
          </motion.div>
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-60"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-sm">Cumple normas colombianas</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-sm">Datos encriptados</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-sm">Actualizaciones constantes</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
