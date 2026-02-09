import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { AuthService } from "../services/authService";
import { NotificationService } from "../services/notificationService";
import { TicketService } from "../services/ticketService";

interface DatabaseContextType {
  authService: AuthService | null;
  ticketService: TicketService | null;
  notificationService: NotificationService | null;
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextType>({
  authService: null,
  ticketService: null,
  notificationService: null,
  isReady: false,
});

export const useDatabaseContext = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabaseContext must be used within DatabaseProvider");
  }
  return context;
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({
  children,
}) => {
  const [authService, setAuthService] = useState<AuthService | null>(null);
  const [ticketService, setTicketService] = useState<TicketService | null>(
    null,
  );
  const [notificationService, setNotificationService] =
    useState<NotificationService | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const setupServices = async () => {
      try {
        // Initialize services (no database needed, they use API)
        setAuthService(new AuthService());
        setTicketService(new TicketService());
        setNotificationService(new NotificationService());
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize services:", error);
      }
    };

    setupServices();
  }, []);

  return (
    <DatabaseContext.Provider
      value={{
        authService,
        ticketService,
        notificationService,
        isReady,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};
