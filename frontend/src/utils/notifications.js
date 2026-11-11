export const NOTIFICATIONS_EVENT = "akb-notifications";
export const NOTIFICATIONS_OPEN_EVENT = "akb-notifications-open";
export const NOTIFICATIONS_RETURN_KEY = "akb-notifications-return";

export const publishUnreadCount = (unreadCount) => {
  window.dispatchEvent(
    new CustomEvent(NOTIFICATIONS_EVENT, { detail: { unreadCount } })
  );
};

export const requestOpenNotifications = () => {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_OPEN_EVENT));
};

export const isChatNotification = (item) => {
  if (item?.type === "chat") {
    return true;
  }
  const message = String(item?.message || "");
  return message.includes(' on "') && message.includes('": ');
};
