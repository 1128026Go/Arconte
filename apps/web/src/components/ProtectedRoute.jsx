import React from "react";
import { isAuthenticated } from "../lib/api";

export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    // Redirigir a login si no está autenticado
    window.location.href = "/login";
    return <div>Redirigiendo...</div>;
  }
  
  return children;
}