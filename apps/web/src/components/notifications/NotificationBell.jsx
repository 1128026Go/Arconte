import React, { useState, useEffect } from "react";
import { getUnreadNotifications, markAsRead, markAllAsRead } from "../../lib/api";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [count, setCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      const data = await getUnreadNotifications();
      setNotifications(data.notifications);
      setCount(data.count);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }

  return <div>Notification Bell Component</div>;
}
