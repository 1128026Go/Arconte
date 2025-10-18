import React, { useState, useEffect, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { notifications } from '../../lib/api';
import NotificationCenter from './NotificationCenter';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasHighPriority, setHasHighPriority] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch inicial y polling cada 30 segundos
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      const stats = await notifications.getStats();
      setUnreadCount(stats.unread || 0);
      setHasHighPriority((stats.high_priority || 0) > 0);
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  }

  function handleToggle() {
    setIsOpen(!isOpen);
  }

  function handleNotificationRead() {
    // Refrescar stats cuando se marca una notificación
    fetchStats();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-colors"
        aria-label="Notificaciones"
      >
        {hasHighPriority ? (
          <BellIconSolid className="h-6 w-6 text-red-500 animate-pulse" />
        ) : unreadCount > 0 ? (
          <BellIconSolid className="h-6 w-6 text-blue-500" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}

        {/* Badge de contador */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                hasHighPriority ? 'bg-red-400 animate-ping' : 'bg-blue-400'
              }`}
            />
            <span
              className={`relative inline-flex items-center justify-center rounded-full h-5 w-5 text-xs font-bold text-white ${
                hasHighPriority ? 'bg-red-600' : 'bg-blue-600'
              }`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <NotificationCenter
          onClose={() => setIsOpen(false)}
          onNotificationRead={handleNotificationRead}
        />
      )}
    </div>
  );
}
