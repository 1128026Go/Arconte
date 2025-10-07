import React, { useState, useEffect } from "react";
import { getAllNotifications, markAsRead, markAllAsRead } from "../lib/api";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      const data = await getAllNotifications();
      setNotifications(data.data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(id) {
    try {
      await markAsRead(id);
      await loadNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead();
      await loadNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.read_at;
    if (filter === "priority") return n.priority >= 7;
    return true;
  });

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "10px" }}>
          Notificaciones
        </h1>
        <p style={{ color: "#6b7280" }}>
          Mantente al día con las actualizaciones de tus casos
        </p>
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
      }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <FilterButton
            active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            Todas
          </FilterButton>
          <FilterButton
            active={filter === "unread"}
            onClick={() => setFilter("unread")}
          >
            No leídas
          </FilterButton>
          <FilterButton
            active={filter === "priority"}
            onClick={() => setFilter("priority")}
          >
            Prioritarias
          </FilterButton>
        </div>

        <button
          onClick={handleMarkAllAsRead}
          style={{
            padding: "8px 16px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          Marcar todas como leídas
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          Cargando notificaciones...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px",
          backgroundColor: "#f9fafb",
          borderRadius: "8px"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
          <div style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
            No hay notificaciones
          </div>
          <div style={{ color: "#6b7280" }}>
            Aquí aparecerán las actualizaciones de tus casos
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden"
        }}>
          {filtered.map(notif => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        backgroundColor: active ? "#3b82f6" : "#f3f4f6",
        color: active ? "white" : "#374151",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "500"
      }}
    >
      {children}
    </button>
  );
}

function NotificationItem({ notification, onMarkAsRead }) {
  const getPriorityColor = (p) => {
    if (p >= 8) return "#ef4444";
    if (p >= 5) return "#f59e0b";
    return "#3b82f6";
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div
      onClick={() => !notification.read_at && onMarkAsRead(notification.id)}
      style={{
        padding: "20px",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: notification.read_at ? "white" : "#f0f9ff",
        cursor: notification.read_at ? "default" : "pointer",
        transition: "background-color 0.2s"
      }}
    >
      <div style={{ display: "flex", gap: "16px" }}>
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: getPriorityColor(notification.priority),
            marginTop: "4px",
            flexShrink: 0
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px"
          }}>
            <div style={{ fontSize: "16px", fontWeight: "600" }}>
              {notification.title}
            </div>
            <div style={{ fontSize: "12px", color: "#9ca3af" }}>
              {formatDate(notification.created_at)}
            </div>
          </div>
          <div style={{ fontSize: "14px", color: "#4b5563", marginBottom: "8px" }}>
            {notification.message}
          </div>
          <div style={{ display: "flex", gap: "12px", fontSize: "12px" }}>
            <span style={{
              padding: "2px 8px",
              backgroundColor: "#f3f4f6",
              borderRadius: "4px",
              color: "#6b7280"
            }}>
              {notification.type}
            </span>
            <span style={{ color: "#9ca3af" }}>
              Prioridad: {notification.priority}/10
            </span>
            {notification.read_at && (
              <span style={{ color: "#10b981" }}>✓ Leída</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
