import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { Bell, CheckCheck, Loader2, Filter } from "lucide-react";
import notificationsApi from "../../api/notifications.api";
import PageHeader from "../../components/dashboard/PageHeader";
import SectionCard from "../../components/dashboard/SectionCard";
import EmptyDashboard from "../../components/dashboard/EmptyDashboard";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL, UNREAD, READ

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.getMyNotifications();
      const body = res.data?.data || res.data;
      const allList = Array.isArray(body?.notifications) 
        ? body.notifications 
        : Array.isArray(body?.all) 
        ? body.all 
        : Array.isArray(body?.unread) 
        ? body.unread 
        : Array.isArray(body) 
        ? body 
        : [];
      setNotifications(allList);
    } catch (e) {
      console.warn("Failed to load notifications page:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (n) => {
    if (n.status === "READ") return;
    try {
      await notificationsApi.markAsRead(n.id);
      loadNotifications();
    } catch (e) {
      console.warn("Mark read error:", e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      loadNotifications();
    } catch (e) {
      console.warn("Mark all read error:", e);
    }
  };

  const filteredNotifications = filter === "ALL" 
    ? notifications 
    : filter === "UNREAD" 
    ? notifications.filter((n) => n.status === "UNREAD") 
    : notifications.filter((n) => n.status === "READ");

  const unreadCount = notifications.filter((n) => n.status === "UNREAD").length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
      <PageHeader title="Notification Center" subtitle="Real-time field activity and mission alerts">
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            <CheckCheck size={16} /> Mark All as Read
          </button>
        )}
      </PageHeader>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {["ALL", "UNREAD", "READ"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filter === f ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f === "ALL" ? `All (${notifications.length})` : f === "UNREAD" ? `Unread (${unreadCount})` : "Read"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 size={36} className="animate-spin text-blue-600" />
          <p className="text-sm text-slate-500 mt-3">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyDashboard title="No Notifications" description="You have no notifications in this filter." />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <motion.div
              key={n.id}
              onClick={() => handleMarkAsRead(n)}
              className={`p-5 rounded-2xl border transition flex items-start justify-between gap-4 ${
                n.status === "UNREAD"
                  ? "bg-blue-50/80 border-blue-200 text-slate-900 shadow-sm cursor-pointer"
                  : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">{n.title}</h3>
                  {n.status === "UNREAD" && (
                    <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 animate-ping" />
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {dayjs(n.createdAt).format("MMM D, YYYY · h:mm A")}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
