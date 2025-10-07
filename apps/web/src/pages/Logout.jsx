import React from "react";
import { logout } from "../lib/api";

export default function LogoutPage() {
  React.useEffect(() => {
    logout();
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
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