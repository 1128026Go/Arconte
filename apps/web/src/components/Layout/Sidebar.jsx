import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  GraduationCap
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Briefcase, label: 'Casos', path: '/cases' },
    { icon: FileText, label: 'Documentos', path: '/documents' },
    { icon: Bot, label: 'IA Assistant', path: '/ai-assistant' },
    { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
    { icon: CheckCircle2, label: 'Recordatorios', path: '/reminders' },
    { icon: Clock, label: 'Tiempo', path: '/time-tracking' },
    { icon: DollarSign, label: 'Facturación', path: '/billing' },
    { icon: BookOpen, label: 'Jurisprudencia', path: '/jurisprudence' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
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
          fixed top-0 left-0 z-50 h-screen
          w-64 bg-navy-900
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          flex flex-col
        `}
      >
        <div className="flex items-center h-16 px-6 border-b border-navy-800">
          <Scale className="w-8 h-8 text-gold-500 mr-3" />
          <div>
            <h1 className="text-xl font-bold text-white">
              Arconte
            </h1>
            <p className="text-xs text-slate-400">Asistente jurídico</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center px-4 py-3 rounded-lg
                      text-sm font-medium transition-all duration-200
                      ${active
                        ? 'bg-navy-800 text-white border-l-4 border-gold-500'
                        : 'text-slate-400 hover:bg-navy-800/50 hover:text-white'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${active ? 'text-gold-500' : ''}`} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-navy-800 p-4">
          <Link
            to="/logout"
            className="flex items-center px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="text-sm font-medium">Cerrar Sesion</span>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
