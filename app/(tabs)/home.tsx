import { useAuth } from "@/contexts/AuthContext";
import { useDatabaseContext } from "@/contexts/DatabaseContext";
import { Ticket } from "@/types";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const STATUS_COLORS: Record<string, string> = {
  pending: "#ff9800",
  "in-progress": "#2196f3",
  resolved: "#4caf50",
  closed: "#757575",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  "in-progress": "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { ticketService } = useDatabaseContext();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    resolved: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTickets = async () => {
    if (!ticketService || !user) return;

    try {
      const userTickets = await ticketService.getUserTickets(user.id);
      setTickets(userTickets);

      const ticketStats = await ticketService.getTicketStats(user.id);
      setStats(ticketStats);
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [ticketService, user]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleLogout = () => {
    console.log("Home logout initiated");
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

  const renderTicketItem = ({ item }: { item: Ticket }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => router.push(`/tickets/${item.id}`)}
    >
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: STATUS_COLORS[item.status] },
          ]}
        >
          <Text style={styles.statusText}>{STATUS_LABELS[item.status]}</Text>
        </View>
      </View>
      <Text style={styles.ticketDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.ticketFooter}>
        <Text style={styles.ticketCategory}>{item.category}</Text>
        <Text style={styles.ticketDate}>{formatDate(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.full_name}!</Text>
          <Text style={styles.subtitle}>Track your tickets</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: "#fff3e0" }]}>
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#e3f2fd" }]}>
          <Text style={styles.statNumber}>{stats.inProgress}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#e8f5e9" }]}>
          <Text style={styles.statNumber}>{stats.resolved}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      {/* Tickets List */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>My Tickets ({tickets.length})</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/tickets/create")}
        >
          <Text style={styles.createButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {tickets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tickets yet</Text>
          <Text style={styles.emptySubtext}>
            Create your first ticket to get started
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push("/tickets/create")}
          >
            <Text style={styles.emptyButtonText}>Create Ticket</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderTicketItem}
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
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#1a73e8",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "#e3f2fd",
    marginTop: 4,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  createButton: {
    backgroundColor: "#1a73e8",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  ticketCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  ticketTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  ticketDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ticketCategory: {
    fontSize: 12,
    color: "#1a73e8",
    fontWeight: "600",
  },
  ticketDate: {
    fontSize: 12,
    color: "#999",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#1a73e8",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
