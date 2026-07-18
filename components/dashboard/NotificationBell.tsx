"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarCheck,
  CheckCheck,
  Clock,
  RefreshCw,
  UserPlus,
  XCircle,
} from "lucide-react";
import { SkeletonList } from "@/components/ui/Skeleton";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";
import { cn, formatDateTime } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message?: string;
  body?: string;
  data?: Record<string, string>;
  is_read: boolean;
  created_at: string;
}

interface NotificationResponse {
  data: NotificationItem[];
  unread_count: number;
}

function notificationHref(notification: NotificationItem) {
  if (notification.data?.href) return notification.data.href;
  if (notification.data?.appointment_id) return "/appointments";
  return null;
}

function NotificationIcon({ type, event }: { type: string; event?: string }) {
  const className = "h-4 w-4";

  if (event === "pending_doctor_review") return <UserPlus className={className} />;
  if (type === "appointment_booked") return <CalendarCheck className={className} />;
  if (type === "appointment_cancelled") return <XCircle className={className} />;
  if (type === "appointment_reminder") return <Clock className={className} />;
  return <Bell className={className} />;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<NotificationResponse>("/api/v1/notifications/me", {
        params: { limit: 12 },
      });
      setNotifications(data.data ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const timer = window.setInterval(fetchNotifications, 60000);
    return () => window.clearInterval(timer);
  }, [fetchNotifications]);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [fetchNotifications, open]);

  const latestUnread = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  );

  async function markAllRead() {
    setMarking(true);
    setError("");
    try {
      await api.post("/api/v1/notifications/me/read-all");
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#d8edf3] bg-white/75 text-[#24708a] shadow-sm backdrop-blur-xl transition hover:border-[#9bd4dd] hover:bg-[#f8fcfd]"
        aria-label="Notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full border border-white bg-[#ff6b8f] px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-2 w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-[24px] border border-white/70 bg-[#f8fcfd]/92 shadow-[0_24px_70px_rgba(24,86,115,0.18)] backdrop-blur-2xl">
            <div className="border-b border-[#d8edf3] bg-[#dceff5]/70 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#062f3d]">Notifications</p>
                  <p className="mt-1 text-xs text-[#55717b]">
                    {unreadCount > 0
                      ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                      : "You are all caught up"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={fetchNotifications}
                    disabled={loading}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/75 bg-white/65 text-[#24708a] transition hover:bg-white disabled:opacity-50"
                    aria-label="Refresh notifications"
                  >
                    <RefreshCw size={14} className={cn(loading && "animate-spin")} />
                  </button>
                  <button
                    type="button"
                    onClick={markAllRead}
                    disabled={marking || unreadCount === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/75 bg-white/65 text-[#24708a] transition hover:bg-white disabled:opacity-50"
                    aria-label="Mark all notifications read"
                  >
                    <CheckCheck size={15} />
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-[430px] overflow-y-auto p-3">
              {error && (
                <div className="mb-3 rounded-2xl border border-red-200 bg-[var(--error-bg)] px-3 py-2 text-xs text-[var(--error)]">
                  {error}
                </div>
              )}

              {loading ? (
                <SkeletonList rows={3} />
              ) : notifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#c8e3ea] bg-white/55 px-4 py-8 text-center">
                  <p className="text-sm font-medium text-[#062f3d]">No notifications yet</p>
                  <p className="mt-1 text-xs text-[#55717b]">
                    Bookings, cancellations, and admin review updates will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => {
                    const href = notificationHref(notification);
                    const content = (
                      <div
                        className={cn(
                          "group flex gap-3 rounded-2xl border px-3 py-3 transition",
                          notification.is_read
                            ? "border-[#d8edf3] bg-white/58 hover:bg-white/75"
                            : "border-[#9bd4dd] bg-[#dceff5]/80 shadow-sm hover:bg-[#dceff5]"
                        )}
                      >
                        <div
                          className={cn(
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/80",
                            notification.is_read
                              ? "bg-[#eef7fa] text-[#55717b]"
                              : "bg-[#bfe0f2] text-[#0c6983]"
                          )}
                        >
                          <NotificationIcon
                            type={notification.type}
                            event={notification.data?.event}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-[#062f3d]">
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#ff6b8f]" />
                            )}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#55717b]">
                            {notification.message ?? notification.body ?? ""}
                          </p>
                          <p className="mt-2 text-[11px] font-medium text-[#6a8791]">
                            {formatDateTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    );

                    return href ? (
                      <Link
                        key={notification.id}
                        href={href}
                        onClick={() => setOpen(false)}
                        className="block"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div key={notification.id}>{content}</div>
                    );
                  })}
                </div>
              )}
            </div>

            {latestUnread > 0 && (
              <div className="border-t border-[#d8edf3] bg-white/60 px-4 py-3 text-xs text-[#55717b]">
                {latestUnread} unread in this view
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
