import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

export default function TestLogoutScreen() {
  const { logout, isAuthenticated, user } = useAuth();
  const router = useRouter();

  const testLogout = async () => {
    console.log("=== TEST LOGOUT START ===");
    console.log("Before logout - isAuthenticated:", isAuthenticated);
    console.log("Before logout - user:", user);

    try {
      await logout();
      console.log("After logout called");

      // Check AsyncStorage
      const stored = await AsyncStorage.getItem("@ticketing_system:user");
      console.log("AsyncStorage after logout:", stored);

      console.log("After logout - isAuthenticated:", isAuthenticated);

      // Manual navigation
      setTimeout(() => {
        console.log("Manually navigating to login...");
        router.replace("/auth/login");
      }, 500);
    } catch (error) {
      console.error("Test logout error:", error);
    }

    console.log("=== TEST LOGOUT END ===");
  };

  const checkStorage = async () => {
    const stored = await AsyncStorage.getItem("@ticketing_system:user");
    console.log("Current AsyncStorage:", stored);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logout Debug Screen</Text>
      <Text style={styles.info}>
        isAuthenticated: {String(isAuthenticated)}
      </Text>
      <Text style={styles.info}>User: {user?.email || "None"}</Text>

      <Button title="Test Logout" onPress={testLogout} />
      <Button title="Check Storage" onPress={checkStorage} />
      <Button
        title="Manual Navigate to Login"
        onPress={() => router.replace("/auth/login")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    gap: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    marginBottom: 10,
  },
});
