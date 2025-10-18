import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BellAlertIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { notifications } from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NotificationCenter({ onClose, onNotificationRead }) {
  const [notificationsList, setNotificationsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const data = await notifications.getUnread();
      setNotificationsList(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notificationId, caseId = null) {
    try {
      await notifications.markAsRead(notificationId);

      // Actualizar lista local
      setNotificationsList(prev =>
        prev.filter(n => n.id !== notificationId)
      );

      // Notificar al padre
      onNotificationRead?.();

      // Si hay caso asociado, navegar
      if (caseId) {
        navigate(`/cases/${caseId}`);
        onClose?.();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await notifications.markAllAsRead();
      setNotificationsList([]);
      onNotificationRead?.();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  function getIcon(type, priority) {
    const iconClass = 'h-6 w-6';

    if (priority >= 8) {
      return <ExclamationTriangleIcon className={`${iconClass} text-red-500`} />;
    }

    switch (type) {
      case 'new_act':
        return <BellAlertIcon className={`${iconClass} text-blue-500`} />;
      case 'deadline':
        return <ClockIcon className={`${iconClass} text-orange-500`} />;
      case 'urgent':
        return <ExclamationTriangleIcon className={`${iconClass} text-red-500`} />;
      case 'update':
        return <DocumentTextIcon className={`${iconClass} text-green-500`} />;
      default:
        return <BellAlertIcon className={`${iconClass} text-gray-500`} />;
    }
  }

  function getPriorityBadge(priority) {
    if (priority >= 8) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
          Urgente
        </span>
      );
    }
    if (priority >= 5) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
          Alta
        </span>
      );
    }
    return null;
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch (error) {
      return dateString;
    }
  }

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
        {notificationsList.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notificationsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <CheckIcon className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500 text-sm text-center">
              No tienes notificaciones nuevas
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notificationsList.map(notification => (
              <div
                key={notification.id}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleMarkAsRead(notification.id, notification.case_id)}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type, notification.priority)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      {getPriorityBadge(notification.priority)}
                    </div>

                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {notification.message}
                    </p>

                    {notification.case && (
                      <p className="mt-1 text-xs text-blue-600">
                        Caso: {notification.case.case_number}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-gray-400">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notificationsList.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              navigate('/notifications');
              onClose?.();
            }}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Ver todas las notificaciones
          </button>
        </div>
      )}
    </div>
  );
}
