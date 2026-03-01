import AsyncStorage from "@react-native-async-storage/async-storage";
import API_CONFIG from "../config/api.config";

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem("auth_token");
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getAuthToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.log(`📤 API Request: ${options.method || "GET"} ${endpoint}`);
    console.log("URL:", url);
    console.log("Has Token:", !!token);
    if (options.body) {
      console.log("Request Body:", options.body);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      console.log(`📥 API Response: ${options.method || "GET"} ${endpoint}`);
      console.log("Status:", response.status);
      console.log("OK:", response.ok);
      console.log("Response Data:", JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error(`❌ API Error ${endpoint}:`, data);
        return {
          error: data.error || data.message || "Request failed",
        };
      }

      // Return the parsed data directly (backend already returns proper structure)
      return { data: data as T };
    } catch (error: any) {
      console.error("❌ API request error:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);

      if (error.name === "AbortError") {
        return { error: "Request timeout" };
      }

      return {
        error: error.message || "Network error",
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async uploadFile(
    endpoint: string,
    fileUri: string,
    fileName: string,
    mimeType: string,
  ): Promise<ApiResponse<any>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getAuthToken();

    console.log(`📤 File Upload: POST ${endpoint}`);
    console.log("URL:", url);
    console.log("File:", fileName);

    try {
      const formData = new FormData();

      // Fetch the file and create a blob
      const response = await fetch(fileUri);
      const blob = await response.blob();

      // Append the file to FormData
      formData.append("file", blob, fileName);

      const uploadResponse = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });

      const result = await uploadResponse.json();

      console.log(`📥 Upload Response:`, result);

      if (!uploadResponse.ok) {
        return {
          error: result.error || result.message || "Upload failed",
        };
      }

      return { data: result };
    } catch (error: any) {
      console.error("❌ Upload error:", error);
      return {
        error: error.message || "Upload failed",
      };
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;
