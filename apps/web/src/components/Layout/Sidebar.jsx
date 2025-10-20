import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Bell,
  Clock,
  DollarSign,
  BookOpen,
  BarChart3,
  Scale,
  CheckCircle2,
  LogOut,
  Bot,
  ShoppingBag,
  GraduationCap,
  TrendingUp,
  Search
} from 'lucide-react';
import { staggerContainer, staggerItem } from '../../utils/animations';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Briefcase, label: 'Casos', path: '/cases' },
    { icon: FileText, label: 'Documentos', path: '/documents' },
    { icon: Bot, label: 'IA Assistant', path: '/ai-assistant' },
    { icon: Search, label: 'Búsqueda IA', path: '/search' },
    { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
    { icon: CheckCircle2, label: 'Recordatorios', path: '/reminders' },
    { icon: Clock, label: 'Tiempo', path: '/time-tracking' },
    { icon: DollarSign, label: 'Facturación', path: '/billing' },
    { icon: BookOpen, label: 'Jurisprudencia', path: '/jurisprudence' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: TrendingUp, label: 'Marketing', path: '/marketing' },
    { icon: GraduationCap, label: 'Tutorial', path: '/tutorial' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          sidebar
          ${isOpen ? 'open' : ''}
          lg:translate-x-0
          flex flex-col
        `}
      >
        {/* Logo Header */}
        <div className="flex items-center h-16 px-6 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-blue to-accent-purple flex items-center justify-center mr-3">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white gradient-text">
              Arconte
            </h1>
            <p className="text-xs text-gray-400">Asistente jurídico</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-1"
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <motion.li key={item.path} variants={staggerItem}>
                  <Link
                    to={item.path}
                    className={`sidebar-link ${active ? 'active' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {active && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary-blue rounded-r-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>
        </nav>

        {/* Footer - Logout */}
        <div className="border-t border-white/10 p-4">
          <Link
            to="/logout"
            className="flex items-center px-4 py-2.5 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
