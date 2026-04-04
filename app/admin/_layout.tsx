import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/contexts/AuthContext";
import { useDatabaseContext } from "@/contexts/DatabaseContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack, Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";

export default function AdminLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const { notificationService } = useDatabaseContext();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!notificationService || !user) return;
      try {
        const count = await notificationService.getUnreadCount(user.id);
        setUnreadCount(count);
      } catch (error) {
        console.error("Error loading unread count:", error);
      }
    };

    loadUnreadCount();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [notificationService, user]);

  if (Platform.OS === "web") {
    return (
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      </Stack>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#153D6F",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#E0E0E0",
          borderTopWidth: 1,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chart.bar.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: "#153D6F" },
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bell.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
