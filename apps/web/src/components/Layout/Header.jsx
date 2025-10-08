import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User, Search, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = ({ toggleSidebar }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-subtle">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Menu button + Breadcrumbs */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg text-navy-700 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex items-center bg-slate-50 rounded-lg px-4 py-2 w-96">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Buscar casos, documentos..."
              className="bg-transparent border-none outline-none text-sm text-navy-700 placeholder-slate-400 w-full"
            />
          </div>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-navy-700 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full"></span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-lg shadow-elevated overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-sm font-semibold text-navy-800">Notificaciones</h3>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {/* Notification items */}
                  <div className="divide-y divide-slate-100">
                    <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 bg-primary-500 rounded-full"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy-800">Nuevo caso asignado</p>
                          <p className="text-xs text-slate-600 mt-1">Caso #12345 - Tutela</p>
                          <p className="text-xs text-slate-400 mt-1">Hace 5 minutos</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 bg-slate-300 rounded-full"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy-800">Recordatorio de audiencia</p>
                          <p className="text-xs text-slate-600 mt-1">Mañana a las 10:00 AM</p>
                          <p className="text-xs text-slate-400 mt-1">Hace 2 horas</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 bg-slate-300 rounded-full"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy-800">Documento firmado</p>
                          <p className="text-xs text-slate-600 mt-1">Contrato_Cliente_2025.pdf</p>
                          <p className="text-xs text-slate-400 mt-1">Hace 1 día</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/notifications');
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Ver todas las notificaciones
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative pl-4 border-l border-slate-200" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-navy-800">{user.name || 'Usuario'}</p>
                <p className="text-xs text-slate-500">{user.email || ''}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gold-500 text-white font-semibold">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-elevated overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-navy-800">{user.name || 'Usuario'}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email || ''}</p>
                </div>

                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-navy-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Configuración</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
