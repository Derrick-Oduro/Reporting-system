import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { initializeDatabase } from "./database/db";
import authRoutes from "./routes/auth.routes";
import notificationRoutes from "./routes/notification.routes";
import ticketRoutes from "./routes/ticket.routes";
import userRoutes from "./routes/user.routes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database first
    console.log("Initializing database...");
    await initializeDatabase();
    console.log("Database ready!");

    // Routes - only set up after database is ready
    app.use("/api/auth", authRoutes);
    app.use("/api/tickets", ticketRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/users", userRoutes);

    // Root endpoint
    app.get("/", (req: express.Request, res: express.Response) => {
      res.json({
        message: "Reporting System API",
        version: "1.0.0",
        status: "running",
        endpoints: {
          health: "GET /health",
          auth: {
            register: "POST /api/auth/register",
            login: "POST /api/auth/login",
            me: "GET /api/auth/me",
            logout: "POST /api/auth/logout",
          },
          tickets: {
            create: "POST /api/tickets",
            getAll: "GET /api/tickets",
            getOne: "GET /api/tickets/:id",
            updateStatus: "PATCH /api/tickets/:id/status",
            addComment: "POST /api/tickets/:id/comments",
            delete: "DELETE /api/tickets/:id",
          },
          notifications: {
            getAll: "GET /api/notifications",
            getUnreadCount: "GET /api/notifications/unread-count",
            markRead: "PATCH /api/notifications/:id/read",
            markAllRead: "PATCH /api/notifications/mark-all-read",
            delete: "DELETE /api/notifications/:id",
          },
          users: {
            getAll: "GET /api/users (admin only)",
            getStats: "GET /api/users/stats (admin only)",
          },
        },
        defaultCredentials: {
          email: "admin@system.com",
          password: "admin123",
          note: "Change this password in production!",
        },
      });
    });

    // Health check
    app.get("/health", (req: express.Request, res: express.Response) => {
      res.json({ status: "OK", message: "Server is running" });
    });

    // Error handling middleware
    app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        console.error("Error:", err);
        res.status(err.status || 500).json({
          error: err.message || "Internal server error",
        });
      },
    );

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
