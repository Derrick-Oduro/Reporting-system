import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types";
import { apiClient } from "../utils/apiClient";

export class AuthService {
  async register(
    email: string,
    password: string,
    fullName: string,
    studentId?: string,
    phone?: string,
  ): Promise<User> {
    console.log("AuthService: Starting registration for", email);

    const response = await apiClient.post<{
      user: User;
      token: string;
      message?: string;
    }>("/auth/register", {
      email,
      password,
      full_name: fullName,
      student_id: studentId,
      phone,
    });

    console.log("AuthService: Registration response:", {
      hasError: !!response.error,
      hasData: !!response.data,
      hasUser: !!response.data?.user,
      hasToken: !!response.data?.token,
    });

    if (response.error) {
      console.error("AuthService: Registration error:", response.error);
      throw new Error(response.error);
    }

    if (response.data?.token) {
      console.log("AuthService: Saving token to storage");
      await AsyncStorage.setItem("auth_token", response.data.token);
    }

    if (!response.data?.user) {
      console.error("AuthService: No user in response data");
      throw new Error("Failed to create user");
    }

    console.log("AuthService: Registration successful, returning user");
    return response.data.user;
  }

  async login(email: string, password: string): Promise<User> {
    const response = await apiClient.post<{ user: User; token: string }>(
      "/auth/login",
      { email, password },
    );

    if (response.error) {
      throw new Error(response.error);
    }

    if (response.data?.token) {
      await AsyncStorage.setItem("auth_token", response.data.token);
    }

    if (!response.data?.user) {
      throw new Error("Invalid email or password");
    }

    return response.data.user;
  }

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
    await AsyncStorage.removeItem("auth_token");
  }

  async getUserById(userId: number): Promise<User | null> {
    const response = await apiClient.get<{ user: User }>("/auth/me");

    if (response.error) {
      return null;
    }

    return response.data?.user || null;
  }

  async getCurrentUser(): Promise<User | null> {
    const response = await apiClient.get<{ user: User }>("/auth/me");

    if (response.error) {
      return null;
    }

    return response.data?.user || null;
  }
}
