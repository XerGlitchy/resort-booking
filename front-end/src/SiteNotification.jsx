import React from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import "./SiteNotification.css";

const notificationIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
};

function SiteNotification({ notification, onDismiss }) {
  if (!notification) return null;

  const Icon = notificationIcons[notification.type] || Info;
  const isError = notification.type === "error";

  return (
    <div
      className={`site-notification notification-${notification.type}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <span className="notification-icon" aria-hidden="true">
        <Icon size={20} />
      </span>
      <div className="notification-copy">
        <strong>{notification.title}</strong>
        <p>{notification.message}</p>
      </div>
      <button
        className="notification-dismiss"
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <X size={17} />
      </button>
    </div>
  );
}

export default SiteNotification;