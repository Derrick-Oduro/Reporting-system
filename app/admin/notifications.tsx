import { useAuth } from "@/contexts/AuthContext";
import { useDatabaseContext } from "@/contexts/DatabaseContext";
import { Notification } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function AdminNotificationsScreen() {
  const { user } = useAuth();
  const { notificationService } = useDatabaseContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    if (!notificationService || !user) return;

    try {
      const userNotifications = await notificationService.getUserNotifications(
        user.id,
      );
      setNotifications(userNotifications);

      const count = await notificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [notificationService, user]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAsRead = async (notificationId: number) => {
    if (!notificationService) return;

    try {
      await notificationService.markAsRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!notificationService || !user) return;

    try {
      await notificationService.markAllAsRead(user.id);
      await loadNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ticket_created":
        return { name: "document-text" as const, color: "#2196f3" };
      case "status_update":
        return { name: "checkmark-circle" as const, color: "#4caf50" };
      case "comment_added":
        return { name: "chatbubble" as const, color: "#ff9800" };
      default:
        return { name: "notifications" as const, color: "#5f6368" };
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.is_read && styles.notificationUnread,
        ]}
        onPress={() => {
          if (!item.is_read) {
            handleMarkAsRead(item.id);
          }
          if (item.ticket_id) {
            router.push(`/tickets/${item.ticket_id}`);
          }
        }}
        activeOpacity={0.6}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: icon.color + "20" }]}
        >
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.notificationDate}>
              {formatDate(item.created_at)}
            </Text>
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          {item.ticket_id && (
            <Text style={styles.ticketLink}>Ticket #{item.ticket_id}</Text>
          )}
        </View>
        {!item.is_read && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#153D6F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.subtitle}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            style={styles.markAllButton}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications</Text>
          <Text style={styles.emptySubtext}>You're all caught up!</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#153D6F",
  },
  greeting: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
  },
  markAllText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  listContent: {
    paddingTop: 0,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e8eaed",
    alignItems: "flex-start",
  },
  notificationUnread: {
    backgroundColor: "#f0f7ff",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#202124",
    marginRight: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: "#5f6368",
  },
  notificationMessage: {
    fontSize: 13,
    color: "#5f6368",
    lineHeight: 18,
    marginBottom: 4,
  },
  ticketLink: {
    fontSize: 12,
    color: "#153D6F",
    fontWeight: "600",
    marginTop: 4,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#153D6F",
    marginLeft: 8,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 15,
    color: "#666",
  },
});
