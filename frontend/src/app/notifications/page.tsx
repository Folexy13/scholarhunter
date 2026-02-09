"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  Award, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Trash2,
  Check,
  X
} from "lucide-react";

interface Notification {
  id: string;
  type: "match" | "deadline" | "application" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "match",
      title: "New Scholarship Match",
      message: "You have a 94% match with the Fulbright Scholarship Program",
      timestamp: "2024-01-31T10:30:00Z",
      read: false,
      actionUrl: "/matches/1",
    },
    {
      id: "2",
      type: "deadline",
      title: "Deadline Approaching",
      message: "Gates Cambridge Scholarship deadline is in 7 days",
      timestamp: "2024-01-31T09:15:00Z",
      read: false,
      actionUrl: "/applications/2",
    },
    {
      id: "3",
      type: "application",
      title: "Application Submitted",
      message: "Your application for Rhodes Scholarship has been submitted successfully",
      timestamp: "2024-01-30T14:20:00Z",
      read: true,
      actionUrl: "/applications/3",
    },
    {
      id: "4",
      type: "system",
      title: "Profile Incomplete",
      message: "Complete your profile to get better scholarship matches",
      timestamp: "2024-01-30T08:00:00Z",
      read: true,
      actionUrl: "/profile",
    },
    {
      id: "5",
      type: "match",
      title: "New Scholarship Match",
      message: "You have a 89% match with the Chevening Scholarship",
      timestamp: "2024-01-29T16:45:00Z",
      read: true,
      actionUrl: "/matches/5",
    },
  ]);

  const [filter, setFilter] = useState<"all" | "unread">("all");

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "match":
        return <Award className="h-5 w-5 text-primary" />;
      case "deadline":
        return <Calendar className="h-5 w-5 text-orange-500" />;
      case "application":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "system":
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case "match":
        return "bg-primary/10 text-primary border-primary/20";
      case "deadline":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "application":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "system":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAsUnread = (id: string) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: false } : notif
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, read: true })));
  };

  const clearAll = () => {
    const confirmed = window.confirm("Are you sure you want to clear all notifications?");
    if (confirmed) {
      setNotifications([]);
    }
  };

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((notif) => !notif.read)
      : notifications;

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6 lg:p-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <Bell className="h-8 w-8" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground">
                  {unreadCount} new
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              Stay updated with your scholarship journey
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
            <Button variant="outline" onClick={clearAll} disabled={notifications.length === 0}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all" onClick={() => setFilter("all")}>
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" onClick={() => setFilter("unread")}>
              Unread ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {filteredNotifications.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <Bell className="h-16 w-16 text-muted-foreground" />
                  <div>
                    <h3 className="text-xl font-bold mb-2">No Notifications</h3>
                    <p className="text-muted-foreground">
                      You're all caught up! Check back later for updates.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`transition-all hover:shadow-md ${
                      !notification.read ? "border-primary/50 bg-primary/5" : ""
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{notification.title}</h3>
                                {!notification.read && (
                                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                            </div>
                            <Badge
                              variant="secondary"
                              className={getNotificationBadgeColor(notification.type)}
                            >
                              {notification.type}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            <div className="flex gap-2">
                              {notification.actionUrl && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={notification.actionUrl}>View</a>
                                </Button>
                              )}
                              {!notification.read ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsUnread(notification.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="unread" className="mt-6">
            {filteredNotifications.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                  <div>
                    <h3 className="text-xl font-bold mb-2">All Caught Up!</h3>
                    <p className="text-muted-foreground">
                      You have no unread notifications.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className="transition-all hover:shadow-md border-primary/50 bg-primary/5"
                  >
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{notification.title}</h3>
                                <div className="h-2 w-2 rounded-full bg-primary"></div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                            </div>
                            <Badge
                              variant="secondary"
                              className={getNotificationBadgeColor(notification.type)}
                            >
                              {notification.type}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            <div className="flex gap-2">
                              {notification.actionUrl && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={notification.actionUrl}>View</a>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
