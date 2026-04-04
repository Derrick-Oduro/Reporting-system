import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const isWeb = Platform.OS === "web";

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await login(email.toLowerCase().trim(), password);

      if (isWeb) {
        router.replace("/admin/dashboard");
        return;
      }

      // Navigation will be handled by auth state
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, isWeb && styles.webContainer]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.content, isWeb && styles.webContent]}>
          <View style={[styles.formShell, isWeb && styles.webFormShell]}>
            <Text style={styles.title}>Admin Login</Text>
            <Text style={styles.subtitle}>Reporting System</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="admin@example.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {!isWeb && (
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => router.push("/auth/register")}
                  disabled={isLoading}
                >
                  <Text style={styles.linkText}>
                    Don't have an account?{" "}
                    <Text style={styles.linkTextBold}>Register</Text>
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.divider} />

              <View style={styles.adminInfo}>
                <Text style={styles.adminInfoTitle}>Test Credentials:</Text>
                <Text style={styles.adminInfoText}>
                  Admin: admin@system.com / admin123
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  webContainer: {
    backgroundColor: "#eef2f7",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  webContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  formShell: {
    width: "100%",
    maxWidth: 420,
  },
  webFormShell: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(21,61,111,0.08)",
    shadowColor: "#153D6F",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#153D6F",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 24,
    shadowColor: "#153D6F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
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
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 6,
    padding: 14,
    fontSize: 15,
    backgroundColor: "#FAFAFA",
    color: "#212121",
  },
  button: {
    backgroundColor: "#153D6F",
    padding: 14,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkButton: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    color: "#666",
    fontSize: 14,
  },
  linkTextBold: {
    color: "#153D6F",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 20,
  },
  adminInfo: {
    padding: 16,
    backgroundColor: "#E8F4F8",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#153D6F",
  },
  adminInfoTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 6,
  },
  adminInfoText: {
    fontSize: 12,
    color: "#666",
  },
});
