# Backend Migration to API with SQLite

This document guides you through setting up and running the backend server with SQLite database.

## Architecture Overview

The application now uses a **client-server architecture**:

- **Backend**: Node.js/Express server with SQLite database
- **Mobile App**: React Native app that makes API calls to the backend
- **Database**: SQLite stored on the server (shared across all users)

## Backend Setup

### 1. Install Backend Dependencies

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update it:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
DATABASE_PATH=./database.db
```

**Important**: Change `JWT_SECRET` to a strong random string in production!

### 3. Start the Backend Server

**Development mode** (with auto-reload):

```bash
npm run dev
```

**Production mode**:

```bash
npm run build
npm start
```

The server will start on `http://localhost:3000`

### 4. Verify Server is Running

Open your browser or use curl:

```bash
curl http://localhost:3000/health
```

You should see: `{"status":"OK","message":"Server is running"}`

## Default Admin Account

The backend automatically creates an admin account:

- **Email**: `admin@system.com`
- **Password**: `admin123`

**Change this password after first login!**

## Mobile App Configuration

### 1. Update API URL

Edit `config/api.config.ts`:

**For local development**:

- iOS Simulator: Use `http://localhost:3000/api`
- Android Emulator: Use `http://10.0.2.2:3000/api`
- Physical Device: Use your computer's IP address (e.g., `http://192.168.1.100:3000/api`)

**For production**:
Replace with your production API URL (e.g., `https://your-api.com/api`)

### 2. Find Your Computer's IP Address

**Windows**:

```bash
ipconfig
```

Look for "IPv4 Address" under your network adapter.

**macOS/Linux**:

```bash
ifconfig | grep "inet "
```

### 3. Test Mobile App

1. Start the backend server
2. Update `config/api.config.ts` with the correct IP
3. Start your mobile app: `npm start`
4. Try logging in with the admin credentials

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Tickets

- `POST /api/tickets` - Create ticket
- `GET /api/tickets` - Get all tickets (filtered by user role)
- `GET /api/tickets/:id` - Get single ticket with comments
- `PATCH /api/tickets/:id/status` - Update ticket status (admin only)
- `POST /api/tickets/:id/comments` - Add comment
- `DELETE /api/tickets/:id` - Delete ticket (admin only)

### Notifications

- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Users (Admin only)

- `GET /api/users` - Get all users
- `GET /api/users/stats` - Get system statistics

## Deployment Options

### Option 1: Railway (Recommended - Easy)

1. Create account at [railway.app](https://railway.app)
2. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```
3. Login and deploy:
   ```bash
   cd backend
   railway login
   railway init
   railway up
   ```
4. Add environment variables in Railway dashboard
5. Get your deployment URL and update mobile app config

### Option 2: Render

1. Create account at [render.com](https://render.com)
2. Create new "Web Service"
3. Connect your GitHub repo
4. Configure:
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
   - Add environment variables
5. Deploy and get your URL

### Option 3: Heroku

1. Create account at [heroku.com](https://heroku.com)
2. Install Heroku CLI
3. Deploy:
   ```bash
   cd backend
   heroku create your-app-name
   heroku config:set JWT_SECRET=your-secret-key
   git subtree push --prefix backend heroku main
   ```

### Option 4: VPS (DigitalOcean, AWS, etc.)

1. Set up a Linux server
2. Install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
3. Clone your repo and setup:
   ```bash
   git clone your-repo
   cd your-repo/backend
   npm install
   npm run build
   ```
4. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name reporting-api
   pm2 startup
   pm2 save
   ```
5. Setup nginx as reverse proxy
6. Get SSL certificate with Let's Encrypt

## Database Management

### View Database Contents

```bash
cd backend
npm install -g sqlite3
sqlite3 database.db
```

SQLite commands:

```sql
.tables                    -- List all tables
SELECT * FROM users;       -- View users
SELECT * FROM tickets;     -- View tickets
.schema users             -- View table structure
.exit                     -- Exit
```

### Backup Database

```bash
cp database.db database.backup.db
```

### Reset Database

```bash
rm database.db
npm run dev  # Will recreate database with admin user
```

## Troubleshooting

### "Cannot connect to server"

1. Verify backend is running: `curl http://localhost:3000/health`
2. Check firewall settings
3. Ensure correct IP address in mobile app config
4. On Android emulator, use `10.0.2.2` instead of `localhost`

### "Invalid token" errors

1. Clear app data/cache
2. Login again to get new token
3. Verify JWT_SECRET is set correctly

### "Database locked" errors

SQLite doesn't handle high concurrency well. For production with many users, consider migrating to PostgreSQL.

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET in production
- [ ] Enable HTTPS in production
- [ ] Set appropriate CORS origins
- [ ] Keep dependencies updated
- [ ] Regular database backups
- [ ] Monitor server logs
- [ ] Implement rate limiting (future enhancement)

## Next Steps

1. **Test all functionality**: Register, login, create tickets, add comments
2. **Deploy backend** to a hosting service
3. **Update mobile app** with production API URL
4. **Test on real devices**
5. **Monitor and iterate**

## Additional Features to Consider

- File upload support for attachments
- Push notifications integration
- Real-time updates with WebSockets
- Email notifications
- Advanced search and filtering
- Export reports to PDF/CSV
- Two-factor authentication

## Support

If you encounter issues:

1. Check backend logs: `npm run dev` shows detailed logs
2. Check mobile app console for errors
3. Verify API responses using tools like Postman or curl
4. Ensure all environment variables are set correctly
