import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { User } from "../types";
import { useDatabaseContext } from "./DatabaseContext";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    studentId?: string,
    phone?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const USER_STORAGE_KEY = "@ticketing_system:user";

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { authService, isReady } = useDatabaseContext();

  useEffect(() => {
    if (isReady) {
      loadStoredUser();
    }
  }, [isReady]);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    if (!authService) throw new Error("Auth service not initialized");

    const loggedInUser = await authService.login(email, password);
    setUser(loggedInUser);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    studentId?: string,
    phone?: string,
  ) => {
    if (!authService) throw new Error("Auth service not initialized");

    const newUser = await authService.register(
      email,
      password,
      fullName,
      studentId,
      phone,
    );
    setUser(newUser);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      console.log("Logging out...");
      setUser(null);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      console.log("Logout successful, user cleared");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
