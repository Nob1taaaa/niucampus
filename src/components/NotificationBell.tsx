import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck, Trash2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const typeIcons: Record<string, string> = {
  claim: "🙋",
  post: "📦",
  match: "🔗",
  reunion: "🎉",
  general: "🔔",
};

const NotificationBell = ({ userId }: { userId: string }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (data && !error) setNotifications(data as Notification[]);
    } catch {
      // Table may not exist yet — silently ignore
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 30));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  const markAsRead = async (id: string) => {
    await (supabase as any)
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await (supabase as any)
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const clearAll = async () => {
    const ids = notifications.map((n) => n.id);
    if (ids.length === 0) return;
    await (supabase as any).from("notifications").delete().in("id", ids);
    setNotifications([]);
  };

  const handleClick = (notif: Notification) => {
    if (!notif.is_read) markAsRead(notif.id);
    if (notif.link) {
      setOpen(false);
      navigate(notif.link);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[0.55rem] font-bold text-destructive-foreground animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 sm:w-96 p-0 rounded-2xl border-primary/10 shadow-xl"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h3 className="text-sm font-bold flex items-center gap-2">
            🔔 Notifications
            {unreadCount > 0 && (
              <Badge className="text-[0.6rem] h-5 bg-destructive/10 text-destructive border-0">
                {unreadCount} new
              </Badge>
            )}
          </h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[0.65rem] px-2 rounded-lg"
                onClick={markAllRead}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Read all
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[0.65rem] px-2 rounded-lg text-muted-foreground hover:text-destructive"
                onClick={clearAll}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs font-medium">No notifications yet</p>
              <p className="text-[0.65rem] mt-0.5">
                You'll be notified when someone claims your item
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-muted/30 transition-colors ${
                    !notif.is_read ? "bg-primary/5" : ""
                  }`}
                >
                  <span className="text-lg shrink-0 mt-0.5">
                    {typeIcons[notif.type] || "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs leading-snug ${
                        !notif.is_read
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {notif.title}
                    </p>
                    <p className="text-[0.65rem] text-muted-foreground mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[0.6rem] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(notif.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                  {notif.link && (
                    <ExternalLink className="h-3 w-3 text-muted-foreground/40 shrink-0 mt-1.5" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
