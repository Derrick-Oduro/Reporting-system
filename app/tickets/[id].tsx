import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useDatabaseContext } from "../../contexts/DatabaseContext";
import {
    Attachment,
    Comment,
    StatusHistory,
    TicketWithUser,
} from "../../types";

const STATUS_COLORS: Record<string, string> = {
  pending: "#ff9800",
  "in-progress": "#2196f3",
  resolved: "#4caf50",
  closed: "#757575",
};

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { ticketService } = useDatabaseContext();
  const [ticket, setTicket] = useState<TicketWithUser | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTicketDetails();
  }, [id]);

  const loadTicketDetails = async () => {
    if (!ticketService || !id) return;

    try {
      const ticketData = await ticketService.getTicketById(Number(id));
      if (ticketData) {
        setTicket(ticketData);
      }

      const ticketComments = await ticketService.getTicketComments(Number(id));
      setComments(ticketComments);

      const ticketAttachments = await ticketService.getTicketAttachments(
        Number(id),
      );
      setAttachments(ticketAttachments);

      const history = await ticketService.getTicketStatusHistory(Number(id));
      setStatusHistory(history);
    } catch (error) {
      console.error("Error loading ticket details:", error);
      Alert.alert("Error", "Failed to load ticket details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticketService || !user || !id) return;

    setIsSubmitting(true);
    try {
      await ticketService.addComment(Number(id), user.id, newComment.trim());
      setNewComment("");
      await loadTicketDetails();
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ticket not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Ticket Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.ticketId}>Ticket #{ticket.id}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[ticket.status] },
            ]}
          >
            <Text style={styles.statusText}>{ticket.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.title}>{ticket.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Category: {ticket.category}</Text>
          <Text style={styles.metaText}>Priority: {ticket.priority}</Text>
        </View>
        <Text style={styles.dateText}>
          Created: {formatDate(ticket.created_at)}
        </Text>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{ticket.description}</Text>
      </View>

      {/* Attachments */}
      {attachments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Attachments ({attachments.length})
          </Text>
          {attachments.map((attachment) => (
            <View key={attachment.id} style={styles.attachmentItem}>
              <Text style={styles.attachmentName}>{attachment.file_name}</Text>
              <Text style={styles.attachmentDate}>
                {formatDate(attachment.uploaded_at)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Status History */}
      {statusHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status History</Text>
          {statusHistory.map((history) => (
            <View key={history.id} style={styles.historyItem}>
              <View style={styles.historyDot} />
              <View style={styles.historyContent}>
                <Text style={styles.historyText}>
                  Changed to{" "}
                  <Text style={styles.historyStatus}>{history.new_status}</Text>
                </Text>
                <Text style={styles.historyMeta}>
                  by {history.changed_by_name} •{" "}
                  {formatDate(history.changed_at)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Comments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>

        {comments.map((comment) => (
          <View key={comment.id} style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor}>
                {comment.user_name}
                {comment.user_role === "admin" && (
                  <Text style={styles.adminBadge}> (Admin)</Text>
                )}
              </Text>
              <Text style={styles.commentDate}>
                {formatDate(comment.created_at)}
              </Text>
            </View>
            <Text style={styles.commentText}>{comment.comment}</Text>
          </View>
        ))}

        {/* Add Comment */}
        <View style={styles.addCommentContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[
              styles.commentButton,
              isSubmitting && styles.commentButtonDisabled,
            ]}
            onPress={handleAddComment}
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.commentButtonText}>Post Comment</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#1a73e8",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ticketId: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
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
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: "#666",
  },
  dateText: {
    fontSize: 12,
    color: "#999",
  },
  section: {
    backgroundColor: "#fff",
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },
  attachmentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  attachmentDate: {
    fontSize: 12,
    color: "#999",
  },
  historyItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1a73e8",
    marginTop: 4,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyText: {
    fontSize: 14,
    color: "#333",
  },
  historyStatus: {
    fontWeight: "600",
    color: "#1a73e8",
  },
  historyMeta: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  commentCard: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#1a73e8",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  adminBadge: {
    color: "#1a73e8",
    fontSize: 12,
  },
  commentDate: {
    fontSize: 12,
    color: "#999",
  },
  commentText: {
    fontSize: 14,
    color: "#666",
  },
  addCommentContainer: {
    marginTop: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  commentButton: {
    backgroundColor: "#1a73e8",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  commentButtonDisabled: {
    opacity: 0.6,
  },
  commentButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
