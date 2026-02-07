import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DatabaseProvider } from "@/contexts/DatabaseContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "auth";

    console.log(
      "Navigation effect - isAuthenticated:",
      isAuthenticated,
      "inAuthGroup:",
      inAuthGroup,
      "segments:",
      segments,
    );

    if (!isAuthenticated && !inAuthGroup) {
      console.log("Navigating to login...");
      router.replace("/auth/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Navigate based on role
      if (user?.role === "admin") {
        console.log("Navigating to admin dashboard...");
        router.replace("/admin/dashboard");
      } else {
        console.log("Navigating to tabs...");
        router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen
          name="auth/register"
          options={{ title: "Register", headerShown: true }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen
          name="tickets/create"
          options={{ title: "Create Ticket", presentation: "modal" }}
        />
        <Stack.Screen
          name="tickets/[id]"
          options={{ title: "Ticket Details" }}
        />
        <Stack.Screen name="test-logout" options={{ title: "Test Logout" }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </DatabaseProvider>
  );
}
