"use client";

import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bell, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ApiResponse, BroadcastMessage } from "@/types"; // Import types
import { invoke } from "@tauri-apps/api/core"; // Import invoke
import { toast } from "sonner"; // Import toast for error messages

interface NotificationPopoverProps {
  audience: "Customer" | "Staff";
}

export function NotificationPopover({ audience }: NotificationPopoverProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<BroadcastMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // **Commented out read/unread functionality for now**
  // const unreadCount = notifications.filter((notification) => !notification.is_read).length
  const unreadCount = notifications.length; // Simple count for now

  // Fetch notifications when popover is opened
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, audience]); // Added audience as dependency

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call backend function
      const response = await invoke<ApiResponse<BroadcastMessage[]>>(
        "view_broadcast_messages_by_audience",
        { targetAudience: audience } // Pass audience type
      );

      if (response.status === "success" && response.data) {
        setNotifications(response.data);
      } else {
        console.error("Failed to fetch notifications:", response.message);
        setError(response.message || "Failed to fetch notifications.");
        toast.error(response.message || "Failed to fetch notifications."); // Show error toast
      }
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      setError("An unexpected error occurred: " + err.message);
      toast.error("An unexpected error occurred while fetching notifications."); // Show error toast
    } finally {
      setLoading(false);
    }
  };

  // **Commented out markAsRead function**
  // const markAsRead = async (notificationId: string) => {
  //   // ... (Implementation for marking read)
  // }

  // **Commented out markAllAsRead function**
  // const markAllAsRead = async () => {
  //   // ... (Implementation for marking all read)
  // }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown date";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Unknown date";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && ( // Display count if > 0
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 bg-muted/50">
          <h3 className="font-medium">Notifications</h3>
          {/* **Commented out Mark All Read button** */}
          {/* {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-8" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )} */}
        </div>
        <Separator />
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-muted-foreground">
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={fetchNotifications}
              >
                Try again
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.broadcast_message_id}
                className={`p-4 border-b last:border-b-0`} // Removed background change based on read status
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {notification.content}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(notification.timestamp)}
                      </span>
                      {/* **Commented out Mark as Read button** */}
                      {/* {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => markAsRead(notification.broadcast_message_id)}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Mark as read
                        </Button>
                      )} */}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
