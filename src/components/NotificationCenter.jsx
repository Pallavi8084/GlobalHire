
import { useEffect, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  FileText,
  BriefcaseBusiness,
  UserRound,
  Info,
  X,
} from 'lucide-react';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications,
} from '../utils/notifications';
import './NotificationCenter.css';

const getIcon = (type) => {
  switch (type) {
    case 'application':
      return <FileText size={18} />;
    case 'job':
      return <BriefcaseBusiness size={18} />;
    case 'candidate':
      return <UserRound size={18} />;
    default:
      return <Info size={18} />;
  }
};

const formatTime = (date) => {
  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) return '';

  const minutes = Math.floor((Date.now() - timestamp) / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(date).toLocaleDateString();
};

export default function NotificationCenter({ user }) {
  const userId = user?.id;

  const [notifications, setNotifications] = useState(() =>
    getNotifications(userId)
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!userId) return undefined;

    const refreshNotifications = (event) => {
      if (!event.detail || event.detail.userId === userId) {
        setNotifications(getNotifications(userId));
      }
    };

    const handleStorage = (event) => {
      if (
        event.key === `globalhire_notifications_${userId}` ||
        event.key === null
      ) {
        setNotifications(getNotifications(userId));
      }
    };

    window.addEventListener(
      'globalhire-notifications-updated',
      refreshNotifications
    );
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(
        'globalhire-notifications-updated',
        refreshNotifications
      );
      window.removeEventListener('storage', handleStorage);
    };
  }, [userId]);

  if (!userId) return null;

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const handleMarkRead = (notificationId) => {
    markNotificationRead(userId, notificationId);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead(userId);
  };

  const handleClearAll = () => {
    clearNotifications(userId);
  };

  return (
    <div className="notification-center">
      <button
        type="button"
        className={`notification-bell ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen((previous) => !previous)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="notification-backdrop"
            aria-label="Close notifications"
            onClick={() => setIsOpen(false)}
          />

          <section className="notification-panel">
            <div className="notification-header">
              <div>
                <h3>Notifications</h3>
                <p>
                  {unreadCount
                    ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                    : 'You are all caught up'}
                </p>
              </div>

              <button
                type="button"
                className="notification-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {notifications.length > 0 && (
              <div className="notification-actions">
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                >
                  <CheckCheck size={15} />
                  Mark all read
                </button>

                <button type="button" onClick={handleClearAll}>
                  <Trash2 size={15} />
                  Clear all
                </button>
              </div>
            )}

            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  <div className="notification-empty-icon">
                    <Bell size={25} />
                  </div>
                  <strong>No notifications yet</strong>
                  <p>Updates about your recruitment activity will appear here.</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    type="button"
                    key={notification.id}
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => handleMarkRead(notification.id)}
                  >
                    <span className={`notification-icon ${notification.type}`}>
                      {getIcon(notification.type)}
                    </span>

                    <span className="notification-content">
                      <strong>{notification.title}</strong>
                      <span>{notification.message}</span>
                      <small>{formatTime(notification.createdAt)}</small>
                    </span>

                    {!notification.read && (
                      <span className="notification-unread-dot" />
                    )}
                  </button>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
