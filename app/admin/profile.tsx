import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function AdminProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: "person-outline" as const,
      title: "Account Information",
      subtitle: "View your account details",
      onPress: () => {},
    },
    {
      icon: "shield-checkmark-outline" as const,
      title: "Privacy & Security",
      subtitle: "Manage your privacy settings",
      onPress: () => {},
    },
    {
      icon: "help-circle-outline" as const,
      title: "Help & Support",
      subtitle: "Get help or contact support",
      onPress: () => {},
    },
    {
      icon: "information-circle-outline" as const,
      title: "About",
      subtitle: "App version and information",
      onPress: () => {},
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.full_name?.split(" ")[0]?.[0]?.toUpperCase()}
            {user?.full_name?.split(" ")[1]?.[0]?.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.full_name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#fff" />
          <Text style={styles.adminBadgeText}>Administrator</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.menuItem,
              index === menuItems.length - 1 && styles.menuItemLast,
            ]}
            onPress={item.onPress}
            activeOpacity={0.6}
          >
            <View style={styles.menuItemIcon}>
              <Ionicons name={item.icon} size={22} color="#153D6F" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#c0c0c0" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={20} color="#d32f2f" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Reporting System v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#153D6F",
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  userName: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 12,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  adminBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  menuSection: {
    backgroundColor: "#fff",
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e8eaed",
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f7ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#202124",
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: "#5f6368",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginTop: 24,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#d32f2f",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 12,
    color: "#9e9e9e",
  },
});
