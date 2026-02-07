import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
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
      // Create ticket
      const ticketId = await ticketService.createTicket(
        user.id,
        title.trim(),
        description.trim(),
        category,
        priority,
      );

      // Save attachments
      for (const attachment of attachments) {
        const fileName = attachment.name;
        const fileUri = attachment.uri;

        // Copy file to app directory
        const destPath = `${FileSystem.documentDirectory}tickets/${ticketId}/${fileName}`;
        const destDir = `${FileSystem.documentDirectory}tickets/${ticketId}`;

        // Create directory if it doesn't exist
        await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
        await FileSystem.copyAsync({ from: fileUri, to: destPath });

        // Save to database
        await ticketService.addAttachment(
          ticketId,
          fileName,
          destPath,
          attachment.mimeType,
          attachment.size,
        );
      }

      Alert.alert("Success", "Ticket submitted successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      Alert.alert("Error", error.message || "Failed to create ticket");
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
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 16,
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 120,
  },
  radioGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  radioButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  radioButtonSelected: {
    backgroundColor: "#1a73e8",
    borderColor: "#1a73e8",
  },
  radioText: {
    fontSize: 14,
    color: "#666",
  },
  radioTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  attachButton: {
    borderWidth: 1,
    borderColor: "#1a73e8",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderStyle: "dashed",
  },
  attachButtonText: {
    color: "#1a73e8",
    fontSize: 14,
    fontWeight: "600",
  },
  attachmentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginTop: 8,
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  removeButton: {
    color: "#d32f2f",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#1a73e8",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
