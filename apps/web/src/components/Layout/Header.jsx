import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, User, Search, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../notifications/NotificationBell';
import { fadeIn } from '../../utils/animations';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Forzar redirect en caso de error
      navigate('/login');
    }
  };

  return (
    <motion.header
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="dashboard-header"
    >
      <div className="flex items-center justify-between w-full">
        {/* Left: Menu button + Search */}
        <div className="flex items-center space-x-4 flex-1">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-white/50 transition-all"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex items-center search-input">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Buscar casos, documentos..."
              className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-full"
            />
          </div>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center space-x-4">
          {/* Notifications - Componente nuevo */}
          <NotificationBell />

          {/* User Menu */}
          <div className="relative pl-4 border-l border-gray-200" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-800">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-gray-500">{user?.email || ''}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary-blue to-accent-purple text-white font-semibold shadow-lg">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 glass rounded-lg shadow-2xl overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-gray-200/50">
                    <p className="text-sm font-medium text-gray-800">{user?.name || 'Usuario'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-white/50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Configuración</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
