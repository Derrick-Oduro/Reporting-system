import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useDatabaseContext } from "../../contexts/DatabaseContext";
import { TicketStatus, TicketWithUser } from "../../types";

import { Platform } from "react-native";

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
  const { user } = useAuth();
  const { ticketService } = useDatabaseContext();
  const [tickets, setTickets] = useState<TicketWithUser[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketWithUser[]>([]);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "priority" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadTickets = async () => {
    if (!ticketService) return;

    try {
      const allTickets = await ticketService.getAllTickets();
      setTickets(allTickets);
      applyFilters(allTickets, searchQuery, statusFilter);

      const ticketStats = await ticketService.getTicketStats();
      setStats(ticketStats);
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (
    allTickets: TicketWithUser[],
    query: string,
    status: TicketStatus | "all",
  ) => {
    let filtered = [...allTickets];

    // Filter by status
    if (status !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === status);
    }

    // Filter by search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(lowerQuery) ||
          ticket.description.toLowerCase().includes(lowerQuery) ||
          ticket.user_name.toLowerCase().includes(lowerQuery) ||
          ticket.id.toString().includes(lowerQuery),
      );
    }

    // Apply sorting
    filtered = applySorting(filtered);

    setFilteredTickets(filtered);
  };

  const applySorting = (ticketsToSort: TicketWithUser[]) => {
    const sorted = [...ticketsToSort];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case "status":
          const statusOrder = {
            pending: 1,
            "in-progress": 2,
            resolved: 3,
            closed: 4,
          };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  };

  const handleSortChange = (newSortBy: "date" | "priority" | "status") => {
    if (sortBy === newSortBy) {
      // Toggle order if same sort option
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      setSortOrder(newOrder);
      // Re-apply sorting with new order
      const sorted = applySorting(filteredTickets);
      setFilteredTickets(sorted);
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  // Re-apply sorting when sortBy changes
  React.useEffect(() => {
    if (tickets.length > 0) {
      applyFilters(tickets, searchQuery, statusFilter);
    }
  }, [sortBy, sortOrder]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applyFilters(tickets, text, statusFilter);
  };

  const handleStatusFilterChange = (status: TicketStatus | "all") => {
    setStatusFilter(status);
    applyFilters(tickets, searchQuery, status);
  };

  if (Platform.OS === "web") {
    return (
      <View style={webStyles.container}>
        <View style={webStyles.card}>
          <Text style={webStyles.title}>Admin Dashboard</Text>
          <Text style={webStyles.subtitle}>Empty dashboard page</Text>
        </View>
      </View>
    );
  }

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
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderTicketItem = ({ item }: { item: TicketWithUser }) => (
    <View style={styles.tableRow}>
      <TouchableOpacity
        style={styles.tableRowContent}
        onPress={() => router.push(`/tickets/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Info Column */}
        <View style={styles.infoColumn}>
          <View style={styles.titleRow}>
            <Text style={styles.tableTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {item.comment_count && item.comment_count > 0 && (
              <View style={styles.commentBadge}>
                <View style={styles.redDot} />
                <Text style={styles.commentCount}>{item.comment_count}</Text>
              </View>
            )}
          </View>
          <View style={styles.tableMetaRow}>
            {item.student_id && (
              <View style={[styles.metaChip, styles.studentIdChip]}>
                <Ionicons name="school" size={11} color="#153D6F" />
                <Text style={styles.studentIdChipText}>
                  ID: {item.student_id}
                </Text>
              </View>
            )}
            <View style={styles.metaChip}>
              <Ionicons name="folder" size={11} color="#666" />
              <Text style={styles.metaChipText}>{item.category}</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="time" size={11} color="#666" />
              <Text style={styles.metaChipText}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Priority Column */}
        <View style={styles.priorityColumn}>
          <View
            style={[
              styles.priorityBadge,
              {
                backgroundColor:
                  item.priority === "high"
                    ? "#ffebee"
                    : item.priority === "medium"
                      ? "#fff8e1"
                      : "#f1f8e9",
              },
            ]}
          >
            <Text
              style={[
                styles.priorityText,
                {
                  color:
                    item.priority === "high"
                      ? "#c62828"
                      : item.priority === "medium"
                        ? "#f57c00"
                        : "#558b2f",
                },
              ]}
            >
              {item.priority}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Column */}
      <View style={styles.actionColumn}>
        <TouchableOpacity
          style={[
            styles.statusButton,
            { backgroundColor: STATUS_COLORS[item.status] + "20" },
          ]}
          onPress={() => {
            setSelectedTicket(item);
            setShowStatusModal(true);
          }}
        >
          <View
            style={[
              styles.statusDotSmall,
              { backgroundColor: STATUS_COLORS[item.status] },
            ]}
          />
          <Text
            style={[
              styles.statusButtonText,
              { color: STATUS_COLORS[item.status] },
            ]}
          >
            {item.status}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={STATUS_COLORS[item.status]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

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
          <Text style={styles.greeting}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Ticket Management System</Text>
        </View>
      </View>

      {/* Search and Filter Section */}
      <View style={styles.controlsContainer}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={18}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tickets by ID, title, user..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === "all" && styles.filterChipActive,
            ]}
            onPress={() => handleStatusFilterChange("all")}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === "all" && styles.filterChipTextActive,
              ]}
            >
              All ({tickets.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === "pending" && styles.filterChipActive,
            ]}
            onPress={() => handleStatusFilterChange("pending")}
          >
            <View
              style={[
                styles.filterDot,
                { backgroundColor: STATUS_COLORS.pending },
              ]}
            />
            <Text
              style={[
                styles.filterChipText,
                statusFilter === "pending" && styles.filterChipTextActive,
              ]}
            >
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === "in-progress" && styles.filterChipActive,
            ]}
            onPress={() => handleStatusFilterChange("in-progress")}
          >
            <View
              style={[
                styles.filterDot,
                { backgroundColor: STATUS_COLORS["in-progress"] },
              ]}
            />
            <Text
              style={[
                styles.filterChipText,
                statusFilter === "in-progress" && styles.filterChipTextActive,
              ]}
            >
              In Progress
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === "resolved" && styles.filterChipActive,
            ]}
            onPress={() => handleStatusFilterChange("resolved")}
          >
            <View
              style={[
                styles.filterDot,
                { backgroundColor: STATUS_COLORS.resolved },
              ]}
            />
            <Text
              style={[
                styles.filterChipText,
                statusFilter === "resolved" && styles.filterChipTextActive,
              ]}
            >
              Resolved
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === "date" && styles.sortButtonActive,
          ]}
          onPress={() => handleSortChange("date")}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortBy === "date" && styles.sortButtonTextActive,
            ]}
          >
            Date
          </Text>
          {sortBy === "date" && (
            <Ionicons
              name={sortOrder === "asc" ? "arrow-up" : "arrow-down"}
              size={14}
              color="#fff"
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === "priority" && styles.sortButtonActive,
          ]}
          onPress={() => handleSortChange("priority")}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortBy === "priority" && styles.sortButtonTextActive,
            ]}
          >
            Priority
          </Text>
          {sortBy === "priority" && (
            <Ionicons
              name={sortOrder === "asc" ? "arrow-up" : "arrow-down"}
              size={14}
              color="#fff"
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === "status" && styles.sortButtonActive,
          ]}
          onPress={() => handleSortChange("status")}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortBy === "status" && styles.sortButtonTextActive,
            ]}
          >
            Status
          </Text>
          {sortBy === "status" && (
            <Ionicons
              name={sortOrder === "asc" ? "arrow-up" : "arrow-down"}
              size={14}
              color="#fff"
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>
          {filteredTickets.length} Ticket
          {filteredTickets.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Tickets Table */}
      {filteredTickets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="clipboard-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No tickets found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "All tickets will appear here"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.tableContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#153D6F"]}
            />
          }
        />
      )}

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

const webStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef2f7",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 960,
    minHeight: 420,
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(21,61,111,0.08)",
    shadowColor: "#153D6F",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#153D6F",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#5f6368",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#153D6F",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  // Stats Cards
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 160,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    fontWeight: "500",
  },
  // Search and Filter
  controlsContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    padding: 0,
  },
  filterContainer: {
    flexDirection: "row",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterChipActive: {
    backgroundColor: "#153D6F",
    borderColor: "#153D6F",
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  // Sort Options
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginRight: 12,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
    marginRight: 8,
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: "#153D6F",
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  sortButtonTextActive: {
    color: "#fff",
  },
  // Table
  tableHeader: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#e0e0e0",
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableContent: {
    paddingBottom: 20,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tableRowContent: {
    flex: 1,
    flexDirection: "row",
    padding: 16,
  },
  // Table Columns
  idColumn: {
    width: 50,
    justifyContent: "center",
    marginRight: 12,
  },
  idText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#153D6F",
  },
  infoColumn: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  tableTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },
  commentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff0f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ff3b30",
  },
  commentCount: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ff3b30",
  },
  tableMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  metaChipText: {
    fontSize: 11,
    color: "#666",
  },
  studentIdChip: {
    backgroundColor: "#e3f2fd",
    borderWidth: 1,
    borderColor: "#90caf9",
  },
  studentIdChipText: {
    fontSize: 11,
    color: "#153D6F",
    fontWeight: "700",
  },
  priorityColumn: {
    width: 70,
    justifyContent: "center",
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: "center",
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  actionColumn: {
    width: 120,
    justifyContent: "center",
    paddingRight: 12,
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusButtonText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 6,
    textAlign: "center",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: "65%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  statusOptionCurrent: {
    backgroundColor: "#f0f7ff",
    borderColor: "#153D6F",
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  statusOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    textTransform: "capitalize",
  },
  currentBadge: {
    fontSize: 11,
    color: "#153D6F",
    fontWeight: "700",
    textTransform: "uppercase",
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cancelButton: {
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
  },
  cancelButtonText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
  },
});
