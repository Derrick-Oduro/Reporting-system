# Setup Checklist & Troubleshooting

## ✅ What's Been Done

1. **Backend Created**: Full Express.js API with SQLite database
2. **Mobile Services Updated**: All services now use HTTP API calls
3. **Database Migration**: Changed from better-sqlite3 to sql.js (no Windows build tools needed)
4. **Documentation Created**: Comprehensive setup guides

## 🔧 Next Steps - Do These In Order

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

**Expected outcome**: All packages installed successfully (express, sql.js, bcryptjs, etc.)

### 2. Verify .env File Exists

Check that `backend/.env` exists with these contents:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-please-use-a-long-random-string
JWT_EXPIRES_IN=7d
NODE_ENV=development
DATABASE_PATH=./database.db
```

### 3. Start Backend Server

```bash
cd backend
npm run dev
```

**Expected outcome**:

- "Database initialized successfully"
- "Admin user created: admin@system.com / admin123"
- "🚀 Server running on port 3000"

**If you see errors**, check the [Troubleshooting](#troubleshooting) section below.

### 4. Test Backend is Working

Open a new terminal and run:

```bash
curl http://localhost:3000/health
```

**Expected response**: `{"status":"OK","message":"Server is running"}`

### 5. Update Mobile App API Configuration

Find your computer's IP address:

**Windows PowerShell**:

```powershell
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like '*Wi-Fi*' -or $_.InterfaceAlias -like '*Ethernet*'}).IPAddress
```

**Windows CMD**:

```bash
ipconfig
```

Look for "IPv4 Address" under your network adapter.

Then update `config/api.config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? "http://192.168.1.XXX:3000/api" // Replace XXX with your actual IP
    : "https://your-production-api.com/api",
  TIMEOUT: 10000,
};
```

**For different devices**:

- iOS Simulator: `http://localhost:3000/api`
- Android Emulator: `http://10.0.2.2:3000/api`
- Physical Device: `http://YOUR_COMPUTER_IP:3000/api`

### 6. Start Mobile App

```bash
# In root directory (NOT in backend/)
npm start
```

Then press `i` for iOS or `a` for Android.

### 7. Test the App

1. Login with:
   - Email: `admin@system.com`
   - Password: `admin123`

2. Try creating a ticket
3. Try adding a comment
4. Check notifications

## ❌ Common Errors & Solutions

### Error: "Cannot find module 'express'"

**Problem**: Backend dependencies not installed

**Solution**:

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 3000 already in use"

**Problem**: Another process is using port 3000

**Solution 1** - Kill the process:

```powershell
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

**Solution 2** - Use a different port:
Edit `backend/.env` and change `PORT=3000` to `PORT=3001`, then update mobile app config.

### Error: "Cannot connect to server" (Mobile App)

**Problem**: Wrong IP address or firewall blocking

**Solutions**:

1. Verify backend is running: `curl http://localhost:3000/health`
2. Check Windows Firewall:
   ```powershell
   New-NetFirewallRule -DisplayName "Node Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```
3. Verify you're using correct IP:
   - Android Emulator must use `10.0.2.2` not `localhost`
   - Physical device must use your computer's actual IP
4. Ensure phone and computer are on same Wi-Fi network

### Error: "Database locked" or Database errors

**Problem**: SQLite database file is corrupted or locked

**Solution**:

```bash
cd backend
rm database.db
npm run dev  # Will recreate database
```

### Error: TypeScript compilation errors

**Problem**: tsconfig.json issues

**Solution**:

```bash
cd backend
npm run build
```

If errors persist, check that all dependencies are installed.

### Error: "Invalid token" or Auth errors

**Problem**: Token mismatch or expired

**Solutions**:

1. Clear app data and login again
2. Restart backend server
3. Check that JWT_SECRET in `.env` is set correctly

### Error: npm install fails with "gyp ERR"

**This should NOT happen** since we're using sql.js (pure JavaScript). If you see this:

1. Check `backend/package.json` has `"sql.js": "^1.10.3"` (NOT `better-sqlite3`)
2. Delete `node_modules` and reinstall:
   ```bash
   cd backend
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📊 Verification Checklist

Run through this checklist to verify everything works:

- [ ] Backend dependencies installed (`cd backend && npm list` shows packages)
- [ ] Backend starts without errors (`npm run dev`)
- [ ] Health endpoint works (`curl http://localhost:3000/health`)
- [ ] Can login as admin (test with curl or Postman)
- [ ] Mobile app starts without errors (`npm start`)
- [ ] Mobile app API config has correct IP address
- [ ] Can login from mobile app
- [ ] Can create a ticket from mobile app
- [ ] Can see tickets in admin view
- [ ] Can add comments to tickets
- [ ] Can see notifications

## 🆘 Still Having Issues?

1. **Check all error messages** carefully - they usually tell you what's wrong
2. **Verify file paths** - make sure you're in the right directory
3. **Check versions**:
   ```bash
   node --version   # Should be v18 or higher
   npm --version    # Should be v8 or higher
   ```
4. **Try a clean install**:

   ```bash
   # Backend
   cd backend
   rm -rf node_modules package-lock.json
   npm install

   # Mobile app
   cd ..
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📁 Important Files to Check

If something isn't working, verify these files exist and are correct:

- `backend/.env` - Environment variables
- `backend/package.json` - Has sql.js (not better-sqlite3)
- `backend/src/database/db.ts` - Uses sql.js
- `config/api.config.ts` - Has correct API URL
- `utils/apiClient.ts` - HTTP client
- `services/*.ts` - All use apiClient

## 🚀 Production Deployment

Once everything works locally, deploy to production:

**Option A: Railway (Easiest)**

```bash
npm install -g @railway/cli
cd backend
railway login
railway init
railway up
```

**Option B: Render**

1. Push code to GitHub
2. Connect repo to render.com
3. Set environment variables
4. Deploy

See [BACKEND_SETUP.md](BACKEND_SETUP.md) for detailed deployment instructions.

## ✨ Success!

When everything is working, you should see:

- Backend server running on port 3000
- Mobile app can login as admin
- Can create and manage tickets
- Admin can see all users' tickets
- Notifications work
- Data persists across app restarts

Congratulations! Your reporting system now has a proper backend architecture! 🎉
