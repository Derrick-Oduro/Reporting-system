import { useAuth } from "@/contexts/AuthContext";
import { useDatabaseContext } from "@/contexts/DatabaseContext";
import { Ticket } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const loadTickets = async () => {
    if (!ticketService || !user) return;

    try {
      const userTickets = await ticketService.getUserTickets(user.id);
      setTickets(userTickets);
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Get unique categories from tickets
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(tickets.map((t) => t.category)),
    );
    return ["all", ...uniqueCategories];
  }, [tickets]);

  // Filter tickets based on search and filters
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        searchQuery === "" ||
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "all" || ticket.status === selectedStatus;

      const matchesCategory =
        selectedCategory === "all" || ticket.category === selectedCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [tickets, searchQuery, selectedStatus, selectedCategory]);

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
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: STATUS_COLORS[item.status] },
          ]}
        />
        <Text style={styles.ticketTitle} numberOfLines={1}>
          {item.title}
        </Text>
      </View>
      <Text style={styles.ticketDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.ticketFooter}>
        <View style={styles.footerLeft}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[item.status] + "20" },
            ]}
          >
            <Text
              style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}
            >
              {STATUS_LABELS[item.status]}
            </Text>
          </View>
        </View>
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
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Tickets</Text>
          <TouchableOpacity
            style={styles.searchIconButton}
            onPress={() => setSearchExpanded(!searchExpanded)}
          >
            <Ionicons name="search-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Expandable Search Bar */}
        {searchExpanded && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search tickets"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close"
                  size={18}
                  color="rgba(255,255,255,0.8)"
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsContent}
        >
          {["all", "pending", "in-progress", "resolved", "closed"].map(
            (status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterTab,
                  selectedStatus === status && styles.filterTabActive,
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedStatus === status && styles.filterTabTextActive,
                  ]}
                >
                  {status === "all"
                    ? "All"
                    : STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </ScrollView>
      </View>

      {/* Tickets List */}
      <View style={styles.toolbar}>
        <Text style={styles.resultCount}>{filteredTickets.length} tickets</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/tickets/create")}
        >
          <Text style={styles.createButtonText}>+ New Ticket</Text>
        </TouchableOpacity>
      </View>

      {filteredTickets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {tickets.length === 0 ? "No tickets yet" : "No tickets found"}
          </Text>
          <Text style={styles.emptySubtext}>
            {tickets.length === 0
              ? "Create your first ticket to get started"
              : "Try adjusting your search or filters"}
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
          data={filteredTickets}
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
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#153D6F",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
  },
  searchIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
    padding: 0,
  },
  filterTabs: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8eaed",
  },
  filterTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: "#f1f3f4",
  },
  filterTabActive: {
    backgroundColor: "#153D6F",
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#5f6368",
  },
  filterTabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8eaed",
  },
  resultCount: {
    fontSize: 14,
    color: "#5f6368",
    fontWeight: "500",
  },
  createButton: {
    backgroundColor: "#153D6F",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  listContent: {
    padding: 16,
  },
  ticketCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8eaed",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  ticketTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#202124",
    lineHeight: 20,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  ticketDescription: {
    fontSize: 13,
    color: "#5f6368",
    marginBottom: 12,
    lineHeight: 18,
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f3f4",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: "#e3f2fd",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    color: "#153D6F",
    fontWeight: "600",
  },
  ticketDate: {
    fontSize: 12,
    color: "#5f6368",
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
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: "#153D6F",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
