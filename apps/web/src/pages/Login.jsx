import React, { useState } from "react";
import { login } from "../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    if (!email || !password) {
      setError("Email y contrasena son requeridos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(email, password);
      window.location.href = "/cases";
    } catch (err) {
      setError("Email o contrasena incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
        fontFamily: "system-ui, sans-serif"
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "32px",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "400px"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#111",
              marginBottom: "4px"
            }}
          >
            Arconte
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280"
            }}
          >
            Tu asistente jurídico inteligente
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                marginBottom: "4px",
                color: "#374151"
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@juridica.test"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px"
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                marginBottom: "4px",
                color: "#374151"
              }}
            >
              Contrasena
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="admin123"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px"
              }}
            />
          </div>

          {error && (
            <div
              style={{
                color: "#dc2626",
                fontSize: "14px",
                marginBottom: "16px",
                textAlign: "center"
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              backgroundColor: loading ? "#9ca3af" : "#111",
              color: "white",
              padding: "12px",
              borderRadius: "6px",
              border: "none",
              fontSize: "16px",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Iniciando sesion..." : "Iniciar Sesion"}
          </button>
        </form>

        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            backgroundColor: "#f3f4f6",
            borderRadius: "6px",
            fontSize: "13px",
            color: "#4b5563"
          }}
        >
          <div style={{ fontWeight: "500", marginBottom: "8px" }}>
            Credenciales de acceso:
          </div>
          <div style={{ fontFamily: "monospace", color: "#111" }}>
            Email: admin@juridica.test
            <br />
            Contraseña: admin123
          </div>
        </div>
      </div>
    </div>
  );
}
