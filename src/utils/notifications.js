
const getStorageKey = (userId) => `globalhire_notifications_${userId}`;

export function getNotifications(userId) {
  if (!userId) return [];

  try {
    const stored = JSON.parse(
      localStorage.getItem(getStorageKey(userId)) || '[]'
    );

    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveNotifications(userId, notifications) {
  if (!userId) return;

  localStorage.setItem(
    getStorageKey(userId),
    JSON.stringify(notifications)
  );

  window.dispatchEvent(
    new CustomEvent('globalhire-notifications-updated', {
      detail: { userId },
    })
  );
}

export function addNotification(userId, notification) {
  if (!userId) return;

  const notifications = getNotifications(userId);

  const newNotification = {
    id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: notification.title || 'New notification',
    message: notification.message || '',
    type: notification.type || 'general',
    read: false,
    createdAt: new Date().toISOString(),
  };

  saveNotifications(userId, [newNotification, ...notifications]);
}

export function markNotificationRead(userId, notificationId) {
  const updated = getNotifications(userId).map((notification) =>
    notification.id === notificationId
      ? { ...notification, read: true }
      : notification
  );

  saveNotifications(userId, updated);
}

export function markAllNotificationsRead(userId) {
  const updated = getNotifications(userId).map((notification) => ({
    ...notification,
    read: true,
  }));

  saveNotifications(userId, updated);
}

export function clearNotifications(userId) {
  saveNotifications(userId, []);
}
