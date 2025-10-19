/**
 * Arconte Landing - LoginCard Component
 *
 * Card flotante con glassmorphism para quick login desde landing.
 * Animación float y efectos de hover.
 *
 * Features:
 * - Glassmorphism design
 * - Float animation
 * - Quick access a login/registro
 * - Preview de la interfaz
 *
 * @author Arconte Team
 * @date 2025-10-18
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus, ArrowRight, Sparkles } from 'lucide-react';
import { slideInRight, floatAnimation } from '../../utils/animations';

export default function LoginCard() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideInRight}
      className="relative"
    >
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-30"></div>

      {/* Card principal */}
      <motion.div
        animate={floatAnimation}
        className="relative glass rounded-2xl p-8 shadow-2xl max-w-md"
      >
        {/* Badge superior */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-semibold mb-6 shadow-lg">
          <Sparkles className="w-4 h-4" />
          Acceso Instantáneo
        </div>

        {/* Título */}
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Empieza ahora
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Únete a cientos de abogados que ya confían en Arconte
        </p>

        {/* Botones */}
        <div className="space-y-3">
          <Link
            to="/register"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all"
          >
            <UserPlus className="w-5 h-5" />
            Crear Cuenta Gratis
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all"
          >
            <LogIn className="w-5 h-5" />
            Iniciar Sesión
          </Link>
        </div>

        {/* Trust signals */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="text-center">
              <div className="font-bold text-blue-600 dark:text-blue-400">100%</div>
              <div className="text-gray-600 dark:text-gray-400">Gratis</div>
            </div>
            <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
            <div className="text-center">
              <div className="font-bold text-blue-600 dark:text-blue-400">30s</div>
              <div className="text-gray-600 dark:text-gray-400">Setup</div>
            </div>
            <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
            <div className="text-center">
              <div className="font-bold text-blue-600 dark:text-blue-400">0</div>
              <div className="text-gray-600 dark:text-gray-400">Tarjeta</div>
            </div>
          </div>
        </div>

        {/* Nota legal */}
        <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-500">
          Sin tarjeta de crédito • Cancela cuando quieras
        </p>
      </motion.div>
    </motion.div>
  );
}
