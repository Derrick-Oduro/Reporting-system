# Backend Installation & Setup

## Step 1: Install Backend Dependencies

Open a terminal/command prompt and run:

```bash
cd backend
npm install
```

This will install all required packages including `sql.js` (a pure JavaScript SQLite implementation that works on Windows without build tools).

## Step 2: Create .env File

The `.env` file has already been created for you with default values. You can modify it if needed:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
DATABASE_PATH=./database.db
```

## Step 3: Start the Backend Server

### Development Mode (with auto-reload):

```bash
npm run dev
```

### Production Mode:

```bash
npm run build
npm start
```

The server will start on `http://localhost:3000`

## Step 4: Test the Server

Open your browser or use curl:

```bash
curl http://localhost:3000/health
```

You should see:

```json
{ "status": "OK", "message": "Server is running" }
```

## Step 5: Test Admin Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@system.com\",\"password\":\"admin123\"}"
```

You should receive a response with a JWT token and user object.

## Step 6: Configure Mobile App

1. Find your computer's IP address:
   - **Windows**: `ipconfig` (look for IPv4 Address)
   - **Mac/Linux**: `ifconfig | grep "inet "`

2. Update `config/api.config.ts` in your mobile app:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? "http://YOUR_COMPUTER_IP:3000/api" // e.g., http://192.168.1.100:3000/api
    : "https://your-production-api.com/api",
  TIMEOUT: 10000,
};
```

**Important IP addresses:**

- iOS Simulator: `http://localhost:3000/api`
- Android Emulator: `http://10.0.2.2:3000/api`
- Physical Device: Use your computer's actual IP address

## Step 7: Start Mobile App

```bash
# In the root directory (not backend/)
npm start
```

## Troubleshooting

### npm install fails

- Make sure you're in the `backend` directory
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Check your internet connection

### Server won't start

- Check if port 3000 is already in use
- Make sure `.env` file exists
- Check terminal for error messages

### Can't connect from mobile app

- Verify backend is running: `curl http://localhost:3000/health`
- Check firewall settings (allow connections on port 3000)
- Ensure you're using the correct IP address
- Make sure your phone and computer are on the same network

### "Invalid token" errors

- Clear app data and login again
- Verify JWT_SECRET is set correctly in `.env`

## Default Credentials

- **Email**: `admin@system.com`
- **Password**: `admin123`

**Important**: Change this password after first login!

## Next Steps

1. Test creating tickets from the mobile app
2. Test admin features (changing ticket status)
3. Test notifications
4. Consider deploying to a cloud platform for production use

## Production Deployment

For production, deploy to:

- Railway: `railway up` (easiest)
- Render: Connect GitHub repo
- Heroku: `git subtree push --prefix backend heroku main`

See [BACKEND_SETUP.md](../BACKEND_SETUP.md) for detailed deployment instructions.
