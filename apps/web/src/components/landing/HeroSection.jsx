/**
 * Arconte Landing - Hero Section Component
 *
 * Hero principal con gradiente mesh, typed animation y LoginCard.
 * Inspirado en LEXIUS Colombia y tendencias 2025.
 *
 * Features:
 * - Gradiente mesh animado de fondo
 * - Título con typed animation
 * - LoginCard flotante a la derecha
 * - CTAs destacados
 * - Totalmente responsive
 *
 * @author Arconte Team
 * @date 2025-10-18
 */

import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import { ArrowRight, Play, Check } from 'lucide-react';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';
import LoginCard from './LoginCard';

export default function HeroSection() {
  const benefits = [
    'Automatiza tareas repetitivas con IA',
    'Gestiona casos de forma profesional',
    'Accede a jurisprudencia colombiana',
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 mesh-gradient opacity-60"></div>

      {/* Animated blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="landing-container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              variants={staggerItem}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg mb-6"
            >
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Potenciado por Google Gemini AI
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              variants={staggerItem}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              <span className="text-gray-900 dark:text-white">
                Tu Asistente
              </span>
              <br />
              <TypeAnimation
                sequence={[
                  'Jurídico',
                  2000,
                  'Inteligente',
                  2000,
                  'Eficiente',
                  2000,
                  'Profesional',
                  2000,
                ]}
                wrapper="span"
                speed={50}
                className="gradient-text"
                repeat={Infinity}
              />
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={staggerItem}
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0"
            >
              Gestiona tus casos, automatiza documentos y accede a jurisprudencia colombiana con inteligencia artificial.
            </motion.p>

            {/* Benefits List */}
            <motion.div
              variants={staggerItem}
              className="space-y-3 mb-8"
            >
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={staggerItem}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <a
                href="#pricing"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-primary inline-flex items-center justify-center gap-2 text-lg px-8 py-4 hover-scale"
              >
                Empezar Gratis
                <ArrowRight className="w-5 h-5" />
              </a>

              <a
                href="#demo"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-outline inline-flex items-center justify-center gap-2 text-lg px-8 py-4 hover-scale"
              >
                <Play className="w-5 h-5" />
                Ver Demo
              </a>
            </motion.div>

            {/* Trust Signals */}
            <motion.div
              variants={staggerItem}
              className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700"
            >
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                Confiado por abogados en Colombia
              </p>
              <div className="flex items-center justify-center lg:justify-start gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">500+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Usuarios</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">10K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Casos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">98%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Satisfacción</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - LoginCard */}
          <div className="hidden lg:block">
            <LoginCard />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 1, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-gray-400 dark:border-gray-600 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gray-400 dark:bg-gray-600 rounded-full mt-2"></div>
        </div>
      </motion.div>

      {/* CSS para animaciones blob */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
}
