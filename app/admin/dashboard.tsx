import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useDatabaseContext } from "../../contexts/DatabaseContext";
import { TicketStatus, TicketWithUser } from "../../types";

const STATUS_COLORS: Record<string, string> = {
  pending: "#ff9800",
  "in-progress": "#2196f3",
  resolved: "#4caf50",
  closed: "#757575",
};

const STATUS_OPTIONS: TicketStatus[] = [
  "pending",
  "in-progress",
  "resolved",
  "closed",
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { ticketService } = useDatabaseContext();
  const [tickets, setTickets] = useState<TicketWithUser[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    resolved: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithUser | null>(
    null,
  );
  const [showStatusModal, setShowStatusModal] = useState(false);

  const loadTickets = async () => {
    if (!ticketService) return;

    try {
      const allTickets = await ticketService.getAllTickets();
      setTickets(allTickets);

      const ticketStats = await ticketService.getTicketStats();
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
    }, [ticketService]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    if (!selectedTicket || !ticketService || !user) return;

    try {
      await ticketService.updateTicketStatus(
        selectedTicket.id,
        newStatus,
        user.id,
      );
      setShowStatusModal(false);
      setSelectedTicket(null);
      Alert.alert("Success", "Ticket status updated");
      await loadTickets();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update status");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderTicketItem = ({ item }: { item: TicketWithUser }) => (
    <View style={styles.ticketCard}>
      <TouchableOpacity onPress={() => router.push(`/tickets/${item.id}`)}>
        <View style={styles.ticketHeader}>
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketId}>#{item.id}</Text>
            <Text style={styles.ticketTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[item.status] },
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.ticketDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.ticketMeta}>
          <Text style={styles.metaText}>User: {item.user_name}</Text>
          <Text style={styles.metaText}>Category: {item.category}</Text>
          <Text style={styles.metaText}>
            Date: {formatDate(item.created_at)}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.updateButton}
        onPress={() => {
          setSelectedTicket(item);
          setShowStatusModal(true);
        }}
      >
        <Text style={styles.updateButtonText}>Update Status</Text>
      </TouchableOpacity>
    </View>
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
          <Text style={styles.greeting}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Manage all tickets</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
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
        <View style={[styles.statCard, { backgroundColor: "#f3e5f5" }]}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Tickets List */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>All Tickets ({tickets.length})</Text>
      </View>

      <FlatList
        data={tickets}
        renderItem={renderTicketItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Ticket Status</Text>
            <Text style={styles.modalSubtitle}>
              Ticket #{selectedTicket?.id}: {selectedTicket?.title}
            </Text>

            {STATUS_OPTIONS.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  selectedTicket?.status === status &&
                    styles.statusOptionCurrent,
                ]}
                onPress={() => handleUpdateStatus(status)}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: STATUS_COLORS[status] },
                  ]}
                />
                <Text style={styles.statusOptionText}>
                  {status.toUpperCase()}
                </Text>
                {selectedTicket?.status === status && (
                  <Text style={styles.currentBadge}>Current</Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#153D6F",
  },
  greeting: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 6,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "600",
    color: "#212121",
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  ticketCard: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  ticketInfo: {
    flex: 1,
    marginRight: 12,
  },
  ticketId: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginTop: 4,
    lineHeight: 22,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  ticketDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  ticketMeta: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: "#999",
  },
  updateButton: {
    backgroundColor: "#153D6F",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 24,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#F5F5F5",
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  statusOptionCurrent: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#212121",
    textTransform: "uppercase",
  },
  currentBadge: {
    fontSize: 11,
    color: "#4CAF50",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  cancelButton: {
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
  },
});
