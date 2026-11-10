import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Bell, CheckCheck, LoaderCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { connectRealtime } from "../services/realtime";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/api";
import { avatarSrcFor } from "../utils/avatars";
import {
  NOTIFICATIONS_EVENT,
  NOTIFICATIONS_OPEN_EVENT,
  NOTIFICATIONS_RETURN_KEY,
  publishUnreadCount,
} from "../utils/notifications";

const TYPE_LABELS = {
  assigned: "Assigned",
  status: "Status",
  updated: "Updated",
};

const typeClass = {
  assigned: "bg-violet-100 text-violet-700",
  status: "bg-sky-100 text-sky-700",
  updated: "bg-slate-100 text-slate-600",
};

const formatWhen = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  if (diff < minute) {
    return "Just now";
  }
  if (diff < 60 * minute) {
    return `${Math.floor(diff / minute)}m ago`;
  }
  if (diff < 24 * 60 * minute) {
    return `${Math.floor(diff / (60 * minute))}h ago`;
  }
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

const NotificationBell = () => {
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setCount(0);
      setOpen(false);
      return undefined;
    }

    let cancelled = false;

    const loadCount = async () => {
      try {
        const data = await getUnreadNotificationCount();
        if (!cancelled) {
          setCount(Number(data?.unreadCount) || 0);
        }
      } catch {
        /* leave the last count in place if the request fails */
      }
    };

    const onChange = (event) => {
      if (typeof event.detail?.unreadCount === "number") {
        setCount(event.detail.unreadCount);
        return;
      }
      loadCount();
    };

    loadCount();
    const timer = window.setInterval(loadCount, 30000);
    window.addEventListener("focus", loadCount);
    window.addEventListener(NOTIFICATIONS_EVENT, onChange);

    const onOpenPanel = () => {
      setLoading(true);
      setOpen(true);
    };
    window.addEventListener(NOTIFICATIONS_OPEN_EVENT, onOpenPanel);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", loadCount);
      window.removeEventListener(NOTIFICATIONS_EVENT, onChange);
      window.removeEventListener(NOTIFICATIONS_OPEN_EVENT, onOpenPanel);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listNotifications();
        if (cancelled) {
          return;
        }
        setNotifications(data.notifications || []);
        const next = Number(data.unreadCount) || 0;
        setCount(next);
        publishUnreadCount(next);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError?.response?.data?.message || "Notifications could not be loaded."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return undefined;
    }

    const socket = connectRealtime(token);
    if (!socket) {
      return undefined;
    }

    const onNew = (payload) => {
      const notification = payload?.notification;
      const unreadCount = Number(payload?.unreadCount);
      if (Number.isFinite(unreadCount)) {
        setCount(unreadCount);
        publishUnreadCount(unreadCount);
      }
      if (!notification?._id) {
        return;
      }
      setNotifications((current) => {
        if (current.some((item) => item._id === notification._id)) {
          return current;
        }
        return [notification, ...current];
      });
    };

    const onRead = (payload) => {
      const unreadCount = Number(payload?.unreadCount);
      if (Number.isFinite(unreadCount)) {
        setCount(unreadCount);
        publishUnreadCount(unreadCount);
      }
      if (!payload?.id) {
        return;
      }
      setNotifications((current) =>
        current.map((item) =>
          item._id === payload.id ? { ...item, readAt: payload.readAt || item.readAt } : item
        )
      );
    };

    const onReadAll = (payload) => {
      const readAt = payload?.readAt || new Date().toISOString();
      setCount(0);
      publishUnreadCount(0);
      setNotifications((current) =>
        current.map((item) => ({ ...item, readAt: item.readAt || readAt }))
      );
    };

    socket.on("notification:new", onNew);
    socket.on("notification:read", onRead);
    socket.on("notification:read-all", onReadAll);

    return () => {
      socket.off("notification:new", onNew);
      socket.off("notification:read", onRead);
      socket.off("notification:read-all", onReadAll);
    };
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onKeyDown = (event) => {
      if (event.key !== "Escape") {
        return;
      }
      event.stopPropagation();
      if (selected) {
        setSelected(null);
        return;
      }
      setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, selected]);

  if (!isAuthenticated) {
    return null;
  }

  const label = count
    ? `${count} unread notification${count === 1 ? "" : "s"}`
    : "Notifications";

  const applyCount = (nextCount) => {
    const next = Number(nextCount) || 0;
    setCount(next);
    publishUnreadCount(next);
  };

  const closePanel = () => {
    setOpen(false);
    setSelected(null);
  };

  const openNotification = async (item) => {
    setBusyId(item._id);
    setError("");
    try {
      let readAt = item.readAt;
      if (!item.readAt) {
        const data = await markNotificationRead(item._id);
        readAt = data.notification?.readAt || new Date().toISOString();
        applyCount(data.unreadCount);
        setNotifications((current) =>
          current.map((entry) => (entry._id === item._id ? { ...entry, readAt } : entry))
        );
      }
      const opened = { ...item, readAt };
      if (item.task) {
        try {
          sessionStorage.setItem(NOTIFICATIONS_RETURN_KEY, "1");
        } catch {
          /* ignore storage failures */
        }
        setOpen(false);
        setSelected(null);
        navigate(`/taskboard?task=${item.task}`);
        return;
      }
      setSelected(opened);
    } catch (readError) {
      setError(readError?.response?.data?.message || "That notification could not be opened.");
    } finally {
      setBusyId("");
    }
  };

  const markAll = async () => {
    setBusyId("all");
    setError("");
    try {
      const data = await markAllNotificationsRead();
      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((entry) => ({ ...entry, readAt: entry.readAt || readAt }))
      );
      applyCount(data.unreadCount);
    } catch (readError) {
      setError(readError?.response?.data?.message || "Notifications could not be marked read.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setLoading(true);
          setOpen(true);
        }}
        aria-label={label}
        aria-expanded={open}
        className={`relative inline-flex items-center justify-center rounded-full border p-2 transition ${
          open
            ? "border-slate-950 bg-slate-950 text-white"
            : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
        }`}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open &&
        createPortal(
        <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/40">
          <button
            type="button"
            className="hidden flex-1 cursor-pointer sm:block"
            aria-label={selected ? "Back to all notifications" : "Close notifications"}
            onClick={() => (selected ? setSelected(null) : closePanel())}
          />
          <aside className="flex h-full w-full max-w-md flex-col bg-slate-50/80 shadow-2xl [&_button:not(:disabled)]:cursor-pointer">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-5 py-4">
              {selected ? (
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="inline-flex items-center gap-2 rounded-full py-1 pr-3 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                  aria-label="Back to all notifications"
                >
                  <span className="inline-flex rounded-full border border-slate-200 p-2 text-slate-500">
                    <ArrowLeft className="h-4 w-4" />
                  </span>
                  All notifications
                </button>
              ) : (
                <>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
                      Inbox
                    </p>
                    <h2 className="text-lg font-bold tracking-tight text-slate-950">Notifications</h2>
                  </div>
                  <div className="flex items-center gap-1">
                    {count > 0 && (
                      <button
                        type="button"
                        onClick={markAll}
                        disabled={busyId === "all"}
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:opacity-60"
                      >
                        <CheckCheck className="h-4 w-4" />
                        Mark all read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={closePanel}
                      className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {selected ? (
                <div className="px-4 py-5">
                  <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarSrcFor(selected.actor)}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full bg-slate-100 object-cover ring-2 ring-white"
                    />
                    <div className="min-w-0">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          typeClass[selected.type] || typeClass.updated
                        }`}
                      >
                        {TYPE_LABELS[selected.type] || "Update"}
                      </span>
                      <p className="mt-1 text-xs text-slate-400">{formatWhen(selected.createdAt)}</p>
                    </div>
                  </div>
                  <p className="mt-5 text-base leading-6 text-slate-800">{selected.message}</p>
                  </div>
                </div>
              ) : (
              <>
              {error && (
                <p className="m-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
              )}
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading notifications
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <Bell className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-slate-900">No notifications yet</p>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Assignments and status changes for your tasks show up here.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3 px-4 pb-5 pt-3">
                  {notifications.map((item) => {
                    const unread = !item.readAt;
                    return (
                      <li key={item._id}>
                        <button
                          type="button"
                          onClick={() => openNotification(item)}
                          disabled={Boolean(busyId)}
                          className={`flex w-full cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3.5 text-left shadow-sm transition hover:border-violet-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 ${
                            unread
                              ? "border-violet-200/90 bg-violet-50/80 hover:bg-violet-50"
                              : "border-slate-200/90 bg-white hover:bg-violet-50/40"
                          }`}
                        >
                          <img
                            src={avatarSrcFor(item.actor)}
                            alt=""
                            className="mt-0.5 h-10 w-10 shrink-0 rounded-full bg-slate-100 object-cover ring-2 ring-white"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                  typeClass[item.type] || typeClass.updated
                                }`}
                              >
                                {TYPE_LABELS[item.type] || "Update"}
                              </span>
                              <span className="shrink-0 text-xs text-slate-400">
                                {formatWhen(item.createdAt)}
                              </span>
                            </span>
                            <span className="mt-1 block truncate text-sm leading-5 text-slate-800">
                              {item.message}
                            </span>
                          </span>
                          {unread && (
                            <span className="mt-4 h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              </>
              )}
            </div>
          </aside>
        </div>,
        document.body
        )}
    </>
  );
};

export default NotificationBell;
