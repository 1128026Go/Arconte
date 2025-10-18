import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Bell,
  Moon,
  Globe,
  Save,
  Camera,
  Shield,
  Eye,
  EyeOff,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { auth, user as userApi } from '../lib/apiSecure';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // User data
  const [user, setUser] = useState({
    name: '',
    email: '',
  });

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email_case_updates: true,
    email_reminders: true,
    email_documents: false,
    push_notifications: true,
    sms_notifications: false,
  });

  // System preferences
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'es',
    timezone: 'America/Bogota',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      // Cargar perfil
      const profileData = await userApi.getProfile();
      setUser(profileData.user);
      setProfileForm({
        name: profileData.user.name || '',
        email: profileData.user.email || '',
      });

      // Cargar preferencias
      try {
        const prefsData = await userApi.getPreferences();
        setPreferences(prefsData.preferences || {
          theme: 'light',
          language: 'es',
          timezone: 'America/Bogota',
        });
      } catch (e) {
        console.warn('Error loading preferences:', e);
      }

      // Cargar notificaciones
      try {
        const notifsData = await userApi.getNotificationSettings();
        setNotifications(notifsData.notification_settings || {
          email_notifications: true,
          case_updates: true,
          new_actions: true,
          deadlines: true,
          weekly_summary: true,
        });
      } catch (e) {
        console.warn('Error loading notification settings:', e);
      }
    } catch (e) {
      setError('Error al cargar datos del usuario');
      console.error(e);
    }
  }

  async function handleProfileUpdate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await userApi.updateProfile(profileForm);
      setSuccess('Perfil actualizado correctamente');
      await loadUserData();
    } catch (e) {
      setError(e.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordUpdate(e) {
    e.preventDefault();

    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await userApi.changePassword(
        passwordForm.current_password,
        passwordForm.new_password,
        passwordForm.new_password_confirmation
      );
      setSuccess('Contraseña actualizada correctamente');
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (e) {
      setError(e.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  }

  async function handleNotificationsUpdate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await userApi.updateNotificationSettings(notifications);
      setSuccess('Preferencias de notificaciones actualizadas');
    } catch (e) {
      setError(e.message || 'Error al actualizar notificaciones');
    } finally {
      setLoading(false);
    }
  }

  async function handlePreferencesUpdate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await userApi.updatePreferences(preferences);
      setSuccess('Preferencias del sistema actualizadas');
    } catch (e) {
      setError(e.message || 'Error al actualizar preferencias');
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'preferences', label: 'Preferencias', icon: Globe },
  ];

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">Configuración</h1>
        <p className="text-slate-600">Administra tu cuenta y preferencias</p>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <Card className="p-4 h-fit">
          <nav className="space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError('');
                    setSuccess('');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gold-500 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}

            {/* Suscripción Link */}
            <div className="pt-4 mt-4 border-t border-slate-200">
              <Link
                to="/subscription"
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left transition-colors bg-gradient-to-r from-gold-50 to-gold-100 hover:from-gold-100 hover:to-gold-200 text-gold-800 border border-gold-200"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5" />
                  <div>
                    <div className="font-semibold">Suscripción</div>
                    <div className="text-xs text-gold-700">Administra tu plan</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </nav>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
                <User className="w-6 h-6" />
                Información del Perfil
              </h2>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gold-100 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-gold-600" />
                  </div>
                  <Button type="button" className="bg-slate-100 hover:bg-slate-200 text-slate-700">
                    <Camera className="w-4 h-4 mr-2" />
                    Cambiar foto
                  </Button>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
                    placeholder="Tu nombre"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
                    placeholder="tu@email.com"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gold-500 hover:bg-gold-600 text-white px-6 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Seguridad
              </h2>

              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contraseña actual
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.current_password}
                      onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Mínimo 8 caracteres</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirmar nueva contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.new_password_confirmation}
                      onChange={e => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gold-500 hover:bg-gold-600 text-white px-6 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
                <Bell className="w-6 h-6" />
                Preferencias de Notificaciones
              </h2>

              <form onSubmit={handleNotificationsUpdate} className="space-y-6">
                <div className="space-y-4">
                  {/* Email notifications */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-navy-900">Actualizaciones de casos por email</h3>
                      <p className="text-sm text-slate-600">Recibe notificaciones cuando haya nuevas actuaciones</p>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={notifications.email_case_updates}
                        onChange={e => setNotifications({ ...notifications, email_case_updates: e.target.checked })}
                        className="sr-only peer"
                      />
                      <span className="absolute inset-0 bg-slate-300 rounded-full peer-checked:bg-gold-500 transition-colors"></span>
                      <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-navy-900">Recordatorios por email</h3>
                      <p className="text-sm text-slate-600">Recibe recordatorios de términos y vencimientos</p>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={notifications.email_reminders}
                        onChange={e => setNotifications({ ...notifications, email_reminders: e.target.checked })}
                        className="sr-only peer"
                      />
                      <span className="absolute inset-0 bg-slate-300 rounded-full peer-checked:bg-gold-500 transition-colors"></span>
                      <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-navy-900">Documentos compartidos</h3>
                      <p className="text-sm text-slate-600">Notificaciones cuando compartan documentos contigo</p>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={notifications.email_documents}
                        onChange={e => setNotifications({ ...notifications, email_documents: e.target.checked })}
                        className="sr-only peer"
                      />
                      <span className="absolute inset-0 bg-slate-300 rounded-full peer-checked:bg-gold-500 transition-colors"></span>
                      <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-navy-900">Notificaciones push</h3>
                      <p className="text-sm text-slate-600">Recibe notificaciones en tiempo real en tu navegador</p>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={notifications.push_notifications}
                        onChange={e => setNotifications({ ...notifications, push_notifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <span className="absolute inset-0 bg-slate-300 rounded-full peer-checked:bg-gold-500 transition-colors"></span>
                      <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gold-500 hover:bg-gold-600 text-white px-6 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Guardando...' : 'Guardar preferencias'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
                <Globe className="w-6 h-6" />
                Preferencias del Sistema
              </h2>

              <form onSubmit={handlePreferencesUpdate} className="space-y-6">
                {/* Theme - Temporarily disabled - Dark mode not implemented yet */}
                <div style={{display: 'none'}}>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    Tema
                  </label>
                  <select
                    value={preferences.theme}
                    onChange={e => setPreferences({ ...preferences, theme: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none bg-white"
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Oscuro</option>
                    <option value="auto">Automático</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Idioma
                  </label>
                  <select
                    value={preferences.language}
                    onChange={e => setPreferences({ ...preferences, language: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none bg-white"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Zona horaria
                  </label>
                  <select
                    value={preferences.timezone}
                    onChange={e => setPreferences({ ...preferences, timezone: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none bg-white"
                  >
                    <option value="America/Bogota">Bogotá (GMT-5)</option>
                    <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                    <option value="America/New_York">Nueva York (GMT-5)</option>
                    <option value="Europe/Madrid">Madrid (GMT+1)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gold-500 hover:bg-gold-600 text-white px-6 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Guardando...' : 'Guardar preferencias'}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
