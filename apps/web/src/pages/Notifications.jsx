import React, { useState, useEffect } from "react";
import MainLayout from '../components/Layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getAllNotifications, markAsRead, markAllAsRead } from "../lib/api";
import { Bell, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

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
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy-900">Notificaciones</h1>
            <p className="text-slate-600 mt-1">
              Mantente al día con las actualizaciones de tus casos
            </p>
          </div>
          <Button
            onClick={handleMarkAllAsRead}
            className="bg-gold-500 hover:bg-gold-600 text-white"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como leídas
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex gap-3">
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
        </Card>

        {/* Notifications List */}
        {loading ? (
          <Card>
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600">Cargando notificaciones...</p>
            </div>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-navy-100 mb-4">
                <Bell className="h-8 w-8 text-navy-600" />
              </div>
              <h3 className="text-lg font-semibold text-navy-900 mb-2">
                No hay notificaciones
              </h3>
              <p className="text-slate-600">
                Aquí aparecerán las actualizaciones de tus casos
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
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
    </MainLayout>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
        active
          ? 'bg-navy-900 text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function NotificationItem({ notification, onMarkAsRead }) {
  const getPriorityConfig = (p) => {
    if (p >= 8) return { color: 'error', icon: AlertCircle, bg: 'bg-error-50', border: 'border-error-200' };
    if (p >= 5) return { color: 'gold', icon: Clock, bg: 'bg-gold-50', border: 'border-gold-200' };
    return { color: 'primary', icon: Bell, bg: 'bg-primary-50', border: 'border-primary-200' };
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

  const priority = getPriorityConfig(notification.priority);
  const Icon = priority.icon;
  const isUnread = !notification.read_at;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isUnread ? `${priority.bg} ${priority.border}` : 'border-slate-200'
      }`}
      onClick={() => isUnread && onMarkAsRead(notification.id)}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          priority.color === 'error' ? 'bg-error-100' :
          priority.color === 'gold' ? 'bg-gold-100' : 'bg-primary-100'
        }`}>
          <Icon className={`h-5 w-5 ${
            priority.color === 'error' ? 'text-error-600' :
            priority.color === 'gold' ? 'text-gold-600' : 'text-primary-600'
          }`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className={`font-semibold ${
              isUnread ? 'text-navy-900' : 'text-slate-700'
            }`}>
              {notification.title}
            </h3>
            <span className="text-xs text-slate-500 flex-shrink-0 ml-4">
              {formatDate(notification.created_at)}
            </span>
          </div>

          <p className="text-sm text-slate-600 mb-3">
            {notification.message}
          </p>

          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              priority.color === 'error' ? 'bg-error-100 text-error-800' :
              priority.color === 'gold' ? 'bg-gold-100 text-gold-800' :
              'bg-primary-100 text-primary-800'
            }`}>
              {notification.type}
            </span>

            <span className="text-xs text-slate-500">
              Prioridad: {notification.priority}/10
            </span>

            {notification.read_at && (
              <span className="inline-flex items-center text-xs text-success-600">
                <Check className="h-3 w-3 mr-1" />
                Leída
              </span>
            )}
          </div>
        </div>

        {/* Unread indicator */}
        {isUnread && (
          <div className="flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${
              priority.color === 'error' ? 'bg-error-500' :
              priority.color === 'gold' ? 'bg-gold-500' : 'bg-primary-500'
            }`}></div>
          </div>
        )}
      </div>
    </Card>
  );
}
