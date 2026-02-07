import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    console.log("Profile logout initiated");
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: () => {
          console.log("Alert confirmed, calling performLogout");
          performLogout();
        },
        style: "destructive",
      },
    ]);
  };

  const performLogout = async () => {
    console.log("=== PERFORM LOGOUT START ===");
    try {
      await logout();
      console.log("Logout completed");
      router.replace("/auth/login");
      console.log("Navigation called");
    } catch (error) {
      console.error("Logout error:", error);
    }
    console.log("=== PERFORM LOGOUT END ===");
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.full_name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.full_name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === "admin" ? "👑 Administrator" : "👤 Student"}
          </Text>
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Full Name</Text>
          <Text style={styles.infoValue}>{user?.full_name}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>

        {user?.student_id && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Student ID</Text>
            <Text style={styles.infoValue}>{user.student_id}</Text>
          </View>
        )}

        {user?.phone && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>
        )}

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Account Type</Text>
          <Text style={styles.infoValue}>
            {user?.role === "admin" ? "Administrator" : "Student"}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "N/A"}
          </Text>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          SPMS Ticketing System is designed to help students report and track
          issues efficiently. For academic and administrative support, submit a
          ticket and track its progress in real-time.
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: "#ff9800", marginBottom: 10 },
          ]}
          onPress={() => router.push("/test-logout")}
        >
          <Text style={styles.logoutButtonText}>🔧 Debug Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
        <Text style={styles.footerText}>
          School of Physical and Mathematical Sciences
        </Text>
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
    backgroundColor: "#1a73e8",
    padding: 32,
    paddingTop: 60,
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a73e8",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#e3f2fd",
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  roleText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  aboutText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
  },
  logoutButton: {
    backgroundColor: "#d32f2f",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    padding: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
});
