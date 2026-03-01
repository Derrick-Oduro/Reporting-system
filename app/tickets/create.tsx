import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { TicketCategory, TicketPriority } from "../../types";

const CATEGORIES: { label: string; value: TicketCategory }[] = [
  { label: "Transcript Issue", value: "transcript" },
  { label: "Missing Result", value: "missing-result" },
  { label: "Registration Issue", value: "registration" },
  { label: "Academic Issue", value: "academic" },
  { label: "Administrative Issue", value: "administrative" },
  { label: "Other", value: "other" },
];

const PRIORITIES: { label: string; value: TicketPriority }[] = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

export default function CreateTicketScreen() {
  const { user } = useAuth();
  const { ticketService } = useDatabaseContext();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("academic");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect admins - they should not create tickets
  React.useEffect(() => {
    if (user?.role === "admin") {
      Alert.alert(
        "Access Denied",
        "Admins cannot create tickets. Only users can submit tickets.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    }
  }, [user]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "image/*",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setAttachments([...attachments, file]);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Error", "Please fill in title and description");
      return;
    }

    if (!user || !ticketService) {
      Alert.alert("Error", "Not authenticated");
      return;
    }

    setIsLoading(true);
    try {
      console.log("=== CREATING TICKET ===");
      console.log("Title:", title);
      console.log("Category:", category);
      console.log("Priority:", priority);
      console.log("Attachments to upload:", attachments.length);

      // Create ticket
      const ticketId = await ticketService.createTicket(
        user.id,
        title.trim(),
        description.trim(),
        category,
        priority,
      );

      console.log("✅ Ticket created with ID:", ticketId);

      // Save attachments metadata to database
      let attachmentSuccessCount = 0;
      let attachmentFailCount = 0;
      const failedAttachments: string[] = [];

      for (const attachment of attachments) {
        console.log("=== UPLOADING ATTACHMENT ===");
        console.log("File name:", attachment.name);
        console.log("File URI:", attachment.uri);
        console.log("File type:", attachment.mimeType);
        console.log("File size:", attachment.size);

        try {
          // First, upload the file to the server
          console.log("Uploading file to server...");
          const uploadedFilePath = await ticketService.uploadFile(
            attachment.uri,
            attachment.name,
            attachment.mimeType,
          );
          console.log("File uploaded to:", uploadedFilePath);

          // Then, save the attachment metadata with the server file path
          await ticketService.addAttachment(
            ticketId,
            attachment.name,
            uploadedFilePath,
            attachment.mimeType,
            attachment.size,
          );
          console.log("✅ Attachment saved successfully:", attachment.name);
          attachmentSuccessCount++;
        } catch (error: any) {
          console.error("❌ Failed to save attachment:", attachment.name);
          console.error("Error details:", error);
          console.error("Error message:", error.message);
          attachmentFailCount++;
          failedAttachments.push(attachment.name);
        }
      }

      console.log("=== UPLOAD SUMMARY ===");
      console.log("Successful:", attachmentSuccessCount);
      console.log("Failed:", attachmentFailCount);

      // Show appropriate message
      if (attachmentFailCount > 0) {
        Alert.alert(
          "Partial Success",
          `Ticket created successfully, but ${attachmentFailCount} attachment(s) failed to upload:\n${failedAttachments.join("\n")}\n\nYou can try adding them later by editing the ticket.`,
          [{ text: "OK", onPress: () => router.back() }],
        );
      } else {
        Alert.alert("Success", "Ticket submitted successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      console.error("❌ Error creating ticket:");
      console.error("Error object:", error);
      console.error("Error message:", error?.message);
      console.error("Error string:", String(error));

      const errorMessage =
        error?.message || error?.toString() || "Failed to create ticket";

      Alert.alert(
        "Error Creating Ticket",
        errorMessage + "\n\nPlease check the console logs for more details.",
        [{ text: "OK" }],
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief description of your issue"
            value={title}
            onChangeText={setTitle}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.radioGroup}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.radioButton,
                  category === cat.value && styles.radioButtonSelected,
                ]}
                onPress={() => setCategory(cat.value)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.radioText,
                    category === cat.value && styles.radioTextSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Priority *</Text>
          <View style={styles.radioGroup}>
            {PRIORITIES.map((pri) => (
              <TouchableOpacity
                key={pri.value}
                style={[
                  styles.radioButton,
                  priority === pri.value && styles.radioButtonSelected,
                ]}
                onPress={() => setPriority(pri.value)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.radioText,
                    priority === pri.value && styles.radioTextSelected,
                  ]}
                >
                  {pri.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide detailed information about your issue"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Attachments</Text>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={pickDocument}
            disabled={isLoading}
          >
            <Text style={styles.attachButtonText}>+ Add Document</Text>
          </TouchableOpacity>

          {attachments.map((file, index) => (
            <View key={index} style={styles.attachmentItem}>
              <Text style={styles.attachmentName} numberOfLines={1}>
                {file.name}
              </Text>
              <TouchableOpacity
                onPress={() => removeAttachment(index)}
                disabled={isLoading}
              >
                <Text style={styles.removeButton}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            isLoading && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Ticket</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    padding: 16,
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 4,
    padding: 12,
    fontSize: 15,
    backgroundColor: "#F5F5F5",
    color: "#212121",
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  radioGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  radioButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F5F5F5",
  },
  radioButtonSelected: {
    backgroundColor: "#153D6F",
    borderColor: "#153D6F",
  },
  radioText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  radioTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  attachButton: {
    borderWidth: 1,
    borderColor: "#153D6F",
    borderRadius: 4,
    padding: 14,
    alignItems: "center",
    borderStyle: "dashed",
    backgroundColor: "#F0F4F8",
  },
  attachButtonText: {
    color: "#153D6F",
    fontSize: 14,
    fontWeight: "600",
  },
  attachmentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  attachmentName: {
    flex: 1,
    fontSize: 13,
    color: "#212121",
  },
  removeButton: {
    color: "#F44336",
    fontSize: 13,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#153D6F",
    padding: 14,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
