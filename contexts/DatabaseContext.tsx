import * as SQLite from "expo-sqlite";
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { initializeDatabase, seedAdminUser } from "../database/schema";
import { AuthService } from "../services/authService";
import { NotificationService } from "../services/notificationService";
import { TicketService } from "../services/ticketService";

interface DatabaseContextType {
  db: SQLite.SQLiteDatabase | null;
  authService: AuthService | null;
  ticketService: TicketService | null;
  notificationService: NotificationService | null;
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextType>({
  db: null,
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
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [authService, setAuthService] = useState<AuthService | null>(null);
  const [ticketService, setTicketService] = useState<TicketService | null>(
    null,
  );
  const [notificationService, setNotificationService] =
    useState<NotificationService | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        const database = await initializeDatabase();
        await seedAdminUser(database);

        setDb(database);
        setAuthService(new AuthService(database));
        setTicketService(new TicketService(database));
        setNotificationService(new NotificationService(database));
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    };

    setupDatabase();
  }, []);

  return (
    <DatabaseContext.Provider
      value={{
        db,
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
