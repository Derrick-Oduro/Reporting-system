import { File, Paths } from "expo-file-system";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_CONFIG } from "../../config/api.config";
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
      console.log("Loaded comments:", ticketComments.length);
      setComments(ticketComments);

      const ticketAttachments = await ticketService.getTicketAttachments(
        Number(id),
      );
      console.log(
        "Loaded attachments:",
        ticketAttachments.length,
        ticketAttachments,
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

  const getAttachmentUrl = (filePath: string) => {
    // Check for local file paths that can't be accessed
    if (
      filePath.startsWith("file://") ||
      filePath.startsWith("content://") ||
      filePath.includes("var/mobile") ||
      filePath.includes("data/user")
    ) {
      return null; // Invalid - local file path
    }

    // If it's already a full URL, return as is
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      return filePath;
    }

    // Otherwise, construct full URL from backend base URL
    const baseUrl = API_CONFIG.BASE_URL.replace("/api", "");
    // Remove leading slash if present
    const cleanPath = filePath.startsWith("/")
      ? filePath.substring(1)
      : filePath;
    return `${baseUrl}/${cleanPath}`;
  };

  const handleOpenAttachment = async (attachment: Attachment) => {
    if (!attachment.file_path) {
      Alert.alert("Error", "File path not available");
      return;
    }

    try {
      const fullUrl = getAttachmentUrl(attachment.file_path);

      if (!fullUrl) {
        Alert.alert(
          "Cannot Open File",
          "This attachment was created before the file upload system was implemented and cannot be viewed. Please re-upload the file by creating a new ticket.",
        );
        return;
      }

      console.log("Opening attachment URL:", fullUrl);
      const isPDF = attachment.file_type?.includes("pdf");

      if (Platform.OS === "web") {
        // On web, open in new tab
        window.open(fullUrl, "_blank");
      } else if (isPDF) {
        // For PDFs, use WebBrowser
        await WebBrowser.openBrowserAsync(fullUrl);
      } else {
        // For other files, try to open with system
        const supported = await Linking.canOpenURL(fullUrl);
        if (supported) {
          await Linking.openURL(fullUrl);
        } else {
          Alert.alert("Error", "Unable to open this file type");
        }
      }
    } catch (error) {
      console.error("Error opening attachment:", error);
      Alert.alert("Error", "Failed to open attachment");
    }
  };

  const handleDownloadAttachment = async (attachment: Attachment) => {
    if (!attachment.file_path) {
      Alert.alert("Error", "File path not available");
      return;
    }

    try {
      const fullUrl = getAttachmentUrl(attachment.file_path);

      if (!fullUrl) {
        Alert.alert(
          "Cannot Download File",
          "This attachment was created before the file upload system was implemented and cannot be downloaded. Please re-upload the file by creating a new ticket.",
        );
        return;
      }

      console.log("Downloading attachment URL:", fullUrl);

      if (Platform.OS === "web") {
        // On web, trigger download
        const link = document.createElement("a");
        link.href = fullUrl;
        link.download = attachment.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert("Success", "Download started");
      } else {
        // On mobile, download to device
        const file = await File.downloadFileAsync(
          fullUrl,
          new File(Paths.cache, attachment.file_name),
        );

        Alert.alert("Success", `File downloaded successfully`, [
          {
            text: "Open",
            onPress: async () => {
              const supported = await Linking.canOpenURL(file.uri);
              if (supported) {
                await Linking.openURL(file.uri);
              }
            },
          },
          { text: "OK" },
        ]);
      }
    } catch (error) {
      console.error("Error downloading attachment:", error);
      Alert.alert("Error", "Failed to download attachment");
    }
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
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

        {/* Student Information */}
        {user?.role === "admin" && (
          <View style={styles.studentInfoCard}>
            <Text style={styles.studentInfoLabel}>Student Information</Text>
            <View style={styles.studentInfoRow}>
              <Text style={styles.studentInfoText}>
                Name: {ticket.user_name}
              </Text>
            </View>
            {ticket.student_id && (
              <View style={styles.studentIdHighlight}>
                <Text style={styles.studentIdLabel}>Student ID:</Text>
                <Text style={styles.studentIdValue}>{ticket.student_id}</Text>
              </View>
            )}
            <View style={styles.studentInfoRow}>
              <Text style={styles.studentInfoText}>
                Email: {ticket.user_email}
              </Text>
            </View>
          </View>
        )}

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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Attachments ({attachments.length})
        </Text>
        {attachments.length === 0 ? (
          <Text style={styles.noItemsText}>No attachments</Text>
        ) : (
          attachments.map((attachment) => (
            <View key={attachment.id} style={styles.attachmentItem}>
              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentName}>
                  {attachment.file_name}
                </Text>
                <Text style={styles.attachmentMeta}>
                  {attachment.file_type && `${attachment.file_type} • `}
                  {formatDate(attachment.uploaded_at)}
                </Text>
              </View>
              <View style={styles.attachmentActions}>
                <TouchableOpacity
                  style={styles.attachmentButton}
                  onPress={() => handleOpenAttachment(attachment)}
                >
                  <Text style={styles.attachmentButtonText}>View</Text>
                </TouchableOpacity>
                {user?.role === "admin" && (
                  <TouchableOpacity
                    style={[styles.attachmentButton, styles.downloadButton]}
                    onPress={() => handleDownloadAttachment(attachment)}
                  >
                    <Text style={styles.attachmentButtonText}>Download</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>

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
              <View style={styles.commentAuthorSection}>
                <Text style={styles.commentAuthor}>
                  {comment.user_name}
                  {comment.user_role === "admin" && (
                    <Text style={styles.adminBadge}> • Admin</Text>
                  )}
                </Text>
                <Text style={styles.commentDate}>
                  {formatDate(comment.created_at)}
                </Text>
              </View>
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
    backgroundColor: "#f5f7fa",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f7fa",
  },
  errorText: {
    fontSize: 18,
    color: "#757575",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#153D6F",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: "#153D6F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
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
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#212121",
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
  studentInfoCard: {
    backgroundColor: "#f0f4f8",
    padding: 18,
    borderRadius: 16,
    marginVertical: 16,
  },
  studentInfoLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#153D6F",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  studentInfoRow: {
    marginBottom: 8,
  },
  studentInfoText: {
    fontSize: 14,
    color: "#424242",
    fontWeight: "500",
  },
  studentIdHighlight: {
    backgroundColor: "#153D6F",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  studentIdLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    textTransform: "uppercase",
  },
  studentIdValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1,
  },
  section: {
    backgroundColor: "#fff",
    padding: 20,
    marginTop: 8,
    marginHorizontal: 12,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 10,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    color: "#212121",
    fontWeight: "500",
    marginBottom: 4,
  },
  attachmentMeta: {
    fontSize: 12,
    color: "#666",
  },
  attachmentActions: {
    flexDirection: "row",
    gap: 8,
  },
  attachmentButton: {
    backgroundColor: "#153D6F",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 4,
  },
  downloadButton: {
    backgroundColor: "#00897B",
  },
  attachmentButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  attachmentDate: {
    fontSize: 12,
    color: "#9E9E9E",
  },
  noItemsText: {
    fontSize: 15,
    color: "#9E9E9E",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 12,
  },
  historyItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#153D6F",
    marginTop: 6,
    marginRight: 16,
    shadowColor: "#153D6F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  historyContent: {
    flex: 1,
  },
  historyText: {
    fontSize: 15,
    color: "#424242",
    fontWeight: "500",
  },
  historyStatus: {
    fontWeight: "700",
    color: "#153D6F",
  },
  historyMeta: {
    fontSize: 13,
    color: "#9E9E9E",
    marginTop: 6,
  },
  commentCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  commentHeader: {
    marginBottom: 12,
  },
  commentAuthorSection: {
    flexDirection: "column",
  },
  commentAuthor: {
    fontSize: 15,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 4,
  },
  adminBadge: {
    color: "#153D6F",
    fontSize: 13,
    fontWeight: "600",
  },
  commentDate: {
    fontSize: 12,
    color: "#999",
    fontWeight: "400",
  },
  commentText: {
    fontSize: 15,
    color: "#616161",
    lineHeight: 22,
  },
  addCommentContainer: {
    marginTop: 20,
  },
  commentInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
    backgroundColor: "#f8f9fa",
    marginBottom: 12,
    color: "#212121",
    textAlignVertical: "top",
  },
  commentButton: {
    backgroundColor: "#153D6F",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#153D6F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  commentButtonDisabled: {
    opacity: 0.5,
  },
  commentButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
