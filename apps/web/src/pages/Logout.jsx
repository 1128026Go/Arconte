import { useEffect } from "react";

// ✅ Logout SIMPLIFICADO - Borra cookies y redirige INMEDIATAMENTE
// ✅ NO espera respuesta del backend
// ✅ Funcionará incluso si el backend falla
export default function LogoutPage() {
  useEffect(() => {
    // INMEDIATO: Borrar todas las cookies
    const cookies = document.cookie.split(";");

    for (let cookie of cookies) {
      const cookieName = cookie.split("=")[0].trim();

      // Borrar en múltiples variantes para asegurar
      const domains = ['', 'localhost', '127.0.0.1', window.location.hostname];
      const paths = ['/', ''];

      for (let domain of domains) {
        for (let path of paths) {
          if (domain) {
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${path};domain=${domain}`;
          } else {
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${path}`;
          }
        }
      }
    }

    // Disparar evento de logout
    window.dispatchEvent(new Event('auth:logout'));

    // Intentar logout en backend (sin esperar)
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
    fetch(`${apiBase}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {
      // Ignorar errores - ya borramos las cookies localmente
    });

    // REDIRIGIR INMEDIATAMENTE (sin esperar al backend)
    setTimeout(() => {
      window.location.replace('/login');
    }, 50);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>
          Cerrando sesión...
        </h1>
        <p>Te redirigiremos al login en un momento.</p>
      </div>
    </div>
  );
}