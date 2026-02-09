# Backend API README

This is the backend API server for the Reporting System application. It provides a REST API for user authentication, ticket management, and notifications.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

Server will start on `http://localhost:3000`

## Project Structure

```
backend/
├── src/
│   ├── database/
│   │   └── db.ts              # SQLite database setup and initialization
│   ├── middleware/
│   │   └── auth.middleware.ts # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.routes.ts     # Authentication endpoints
│   │   ├── ticket.routes.ts   # Ticket management endpoints
│   │   ├── notification.routes.ts # Notification endpoints
│   │   └── user.routes.ts     # User management endpoints
│   └── server.ts              # Express app entry point
├── .env.example               # Environment variables template
├── .gitignore
├── package.json
└── tsconfig.json
```

## Environment Variables

Create a `.env` file with:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
NODE_ENV=development
DATABASE_PATH=./database.db
```

## API Documentation

### Base URL

- Development: `http://localhost:3000/api`
- Production: Your deployed URL

### Authentication

All authenticated endpoints require Bearer token in Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

#### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "student_id": "STU001" (optional),
  "phone": "+1234567890" (optional)
}

Response:
{
  "message": "User registered successfully",
  "token": "jwt-token",
  "user": { ...user object }
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": { ...user object }
}
```

#### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "user": { ...user object }
}
```

### Tickets

#### Create Ticket

```http
POST /api/tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Issue with login",
  "description": "Detailed description",
  "category": "technical",
  "priority": "high" (optional, default: "medium")
}

Response:
{
  "message": "Ticket created successfully",
  "ticket": { ...ticket object }
}
```

#### Get All Tickets

```http
GET /api/tickets
Authorization: Bearer <token>

Response:
{
  "tickets": [
    { ...ticket object with user info }
  ]
}
```

Note: Regular users only see their own tickets, admins see all tickets.

#### Get Single Ticket

```http
GET /api/tickets/:id
Authorization: Bearer <token>

Response:
{
  "ticket": { ...ticket object },
  "comments": [ ...comments array ]
}
```

#### Update Ticket Status (Admin Only)

```http
PATCH /api/tickets/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "in_progress" | "resolved" | "closed"
}

Response:
{
  "message": "Ticket updated successfully",
  "ticket": { ...updated ticket }
}
```

#### Add Comment

```http
POST /api/tickets/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "comment": "This is a comment"
}

Response:
{
  "message": "Comment added successfully",
  "comment": { ...comment object }
}
```

#### Delete Ticket (Admin Only)

```http
DELETE /api/tickets/:id
Authorization: Bearer <admin-token>

Response:
{
  "message": "Ticket deleted successfully"
}
```

### Notifications

#### Get User Notifications

```http
GET /api/notifications
Authorization: Bearer <token>

Response:
{
  "notifications": [
    {
      "id": 1,
      "title": "Ticket Status Updated",
      "message": "Your ticket...",
      "is_read": 0,
      "created_at": "2026-02-09T..."
    }
  ]
}
```

#### Get Unread Count

```http
GET /api/notifications/unread-count
Authorization: Bearer <token>

Response:
{
  "count": 5
}
```

#### Mark as Read

```http
PATCH /api/notifications/:id/read
Authorization: Bearer <token>

Response:
{
  "message": "Notification marked as read"
}
```

#### Mark All as Read

```http
PATCH /api/notifications/mark-all-read
Authorization: Bearer <token>

Response:
{
  "message": "All notifications marked as read"
}
```

#### Delete Notification

```http
DELETE /api/notifications/:id
Authorization: Bearer <token>

Response:
{
  "message": "Notification deleted successfully"
}
```

### Users (Admin Only)

#### Get All Users

```http
GET /api/users
Authorization: Bearer <admin-token>

Response:
{
  "users": [ ...users array ]
}
```

#### Get Statistics

```http
GET /api/users/stats
Authorization: Bearer <admin-token>

Response:
{
  "stats": {
    "totalUsers": 10,
    "totalTickets": 25,
    "pendingTickets": 5,
    "resolvedTickets": 20
  }
}
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  student_id TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tickets Table

```sql
CREATE TABLE tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### Comments Table

```sql
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  comment TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### Notifications Table

```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  ticket_id INTEGER,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE
);
```

## Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production server

## Default Admin Account

Email: `admin@system.com`
Password: `admin123`

**Important**: Change this password immediately after deployment!

## Development

### Adding New Endpoints

1. Create route handler in `src/routes/`
2. Add route to `src/server.ts`
3. Use authentication middleware as needed
4. Test with curl or Postman

### Database Queries

Use `better-sqlite3` synchronous API:

```typescript
import db from "../database/db";

// Get one
const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

// Get all
const users = db.prepare("SELECT * FROM users").all();

// Insert/Update/Delete
const result = db.prepare("INSERT INTO users (...) VALUES (...)").run(values);
```

## Security

- Passwords are hashed with bcryptjs
- JWT tokens for authentication
- Helmet.js for security headers
- CORS enabled for API access
- Input validation with express-validator

## License

ISC
