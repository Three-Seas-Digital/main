import { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Bell, BellRing, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function NotificationsDropdown() {
  const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotifIcon = (type) => {
    const icons = {
      warning: <AlertCircle size={16} />,
      success: <CheckCircle size={16} />,
      error: <XCircle size={16} />,
      info: <Bell size={16} />,
    };
    return icons[type] || icons.info;
  };

  return (
    <div className="notifications-dropdown-wrapper">
      <button className="notifications-trigger" onClick={() => setIsOpen(!isOpen)} aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}>
        {unreadCount > 0 ? <BellRing size={20} /> : <Bell size={20} />}
        {unreadCount > 0 && <span className="notifications-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <>
          <div className="notifications-backdrop" onClick={() => setIsOpen(false)} />
          <div className="notifications-dropdown">
            <div className="notifications-header">
              <h4>Notifications</h4>
              {notifications.length > 0 && (
                <button onClick={() => { markAllNotificationsRead(); }}>Mark all read</button>
              )}
            </div>
            <div className="notifications-list">
              {notifications.length === 0 ? (
                <div className="notifications-empty">
                  <Bell size={24} />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notif) => (
                  <div
                    key={notif.id}
                    className={`notification-item ${notif.read ? 'read' : 'unread'} ${notif.type}`}
                    onClick={() => markNotificationRead(notif.id)}
                  >
                    <div className="notification-icon">{getNotifIcon(notif.type)}</div>
                    <div className="notification-content">
                      <strong>{notif.title}</strong>
                      <p>{notif.message}</p>
                      <span className="notification-time">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      className="notification-delete"
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                      aria-label="Delete notification"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div className="notifications-footer">
                <button onClick={() => { clearAllNotifications(); setIsOpen(false); }}>
                  Clear all
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
