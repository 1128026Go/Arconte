import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthCheck } from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthCheck();

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: "16px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              border: "3px solid #e5e7eb",
              borderTop: "3px solid #3b82f6",
              borderRadius: "50%",
              margin: "0 auto",
              animation: "spin 1s linear infinite"
            }}></div>
          </div>
          <p>Verificando autenticación...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirigir a login si no está autenticado usando React Router
    return <Navigate to="/login" replace />;
  }

  return children;
}