import { useState, useEffect, useCallback } from 'react';
import { auth } from '../lib/api';

// Hook personalizado para manejar autenticación segura con cookies
export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar estado de autenticación
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const userData = await auth.me();
      setUser(userData.user);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login
  const login = useCallback(async (email, password) => {
    const data = await auth.login(email, password);
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await auth.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      // Forzar redirect inmediato para evitar estados intermedios
      window.location.replace('/login');
    }
  }, []);

  // Escuchar eventos de autenticación
  useEffect(() => {
    const handleAuthLogin = (event) => {
      setUser(event.detail.user);
      setIsAuthenticated(true);
    };

    const handleAuthLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
    };

    const handleAuthUnauthorized = () => {
      setUser(null);
      setIsAuthenticated(false);
      // Redirigir a login
      window.location.href = '/login';
    };

    window.addEventListener('auth:login', handleAuthLogin);
    window.addEventListener('auth:logout', handleAuthLogout);
    window.addEventListener('auth:unauthorized', handleAuthUnauthorized);

    return () => {
      window.removeEventListener('auth:login', handleAuthLogin);
      window.removeEventListener('auth:logout', handleAuthLogout);
      window.removeEventListener('auth:unauthorized', handleAuthUnauthorized);
    };
  }, []);

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };
}

// Hook para verificar autenticación simple (sin estado)
// ✅ NO usa localStorage - source of truth es /auth/me del backend
// ✅ Fuerza headers no-cache para evitar respuestas cacheadas
// ✅ Escucha visibilitychange para re-verificar al volver a la pestaña
// ✅ Escucha eventos personalizados auth:login, auth:logout, auth:unauthorized
export function useAuthCheck() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Función que verifica autenticación contra el backend
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);

      // Llamar a auth.check() que internamente hace auth.me()
      // El fetch ya incluye headers no-cache desde apiSecure.js
      const isAuth = await auth.check();
      setIsAuthenticated(isAuth);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Verificar autenticación al montar
    checkAuth();

    // Handler para visibilitychange - revisa auth cuando usuario vuelve a la pestaña
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };

    // Handlers para eventos de autenticación
    const handleAuthLogin = () => {
      setIsAuthenticated(true);
      setIsLoading(false);
    };

    const handleAuthLogout = () => {
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    const handleAuthUnauthorized = () => {
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    // Registrar todos los listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('auth:login', handleAuthLogin);
    window.addEventListener('auth:logout', handleAuthLogout);
    window.addEventListener('auth:unauthorized', handleAuthUnauthorized);

    // Cleanup al desmontar
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('auth:login', handleAuthLogin);
      window.removeEventListener('auth:logout', handleAuthLogout);
      window.removeEventListener('auth:unauthorized', handleAuthUnauthorized);
    };
  }, [checkAuth]);

  return { isAuthenticated, isLoading };
}
