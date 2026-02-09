# 🎯 START HERE - Complete Migration Guide

Your Reporting System has been migrated from local SQLite to a backend API architecture!

## 📋 Quick Start (3 Steps)

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Start Backend Server

```bash
npm run dev
```

You should see:

```
Database initialized successfully
Admin user created: admin@system.com / admin123
🚀 Server running on port 3000
📍 API URL: http://localhost:3000
```

### Step 3: Update Mobile App & Start

1. **For iOS Simulator**: No changes needed, config is already set to `localhost`

2. **For Android Emulator**: Edit `config/api.config.ts`:

   ```typescript
   BASE_URL: "http://10.0.2.2:3000/api"; // Android emulator special address
   ```

3. **For Physical Device**: Find your computer's IP address:

   ```bash
   # Windows
   ipconfig

   # Look for "IPv4 Address" like 192.168.1.100
   ```

   Then update `config/api.config.ts`:

   ```typescript
   BASE_URL: "http://192.168.1.100:3000/api"; // Use YOUR actual IP
   ```

4. **Start the mobile app** (in root directory, NOT backend/):

   ```bash
   npm start
   ```

5. **Login** with default admin:
   - Email: `admin@system.com`
   - Password: `admin123`

## 🎉 That's It!

Your app should now:

- ✅ Connect to the backend server
- ✅ Allow login/registration
- ✅ Create and manage tickets
- ✅ Show notifications
- ✅ Support multiple users
- ✅ Let admins see all tickets

## ⚠️ Troubleshooting

**Backend won't start?**

- Check if you're in the `backend` directory
- Make sure `npm install` completed successfully
- Look at error messages carefully

**Mobile app can't connect?**

- Verify backend is running (you should see "Server running on port 3000")
- Check you updated `config/api.config.ts` with correct IP
- For Android Emulator, use `10.0.2.2` not `localhost`
- For physical device, ensure phone and computer are on same Wi-Fi

**Getting "Invalid token" errors?**

- Clear app data and login again
- Restart backend server

## 📚 Detailed Documentation

- **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** - Complete troubleshooting guide
- **[backend/INSTALLATION.md](backend/INSTALLATION.md)** - Detailed backend setup
- **[BACKEND_SETUP.md](BACKEND_SETUP.md)** - API documentation & deployment
- **[MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)** - What changed and why

## 🚀 Next Steps

1. **Test all features**: Create tickets, add comments, check notifications
2. **Change admin password**: Don't use `admin123` in production!
3. **Deploy to production**: See [BACKEND_SETUP.md](BACKEND_SETUP.md) for Railway/Render deployment

## 🆘 Still Having Problems?

See [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) for comprehensive troubleshooting, or:

1. Check that `backend/package.json` has `sql.js` (not `better-sqlite3`)
2. Verify `.env` file exists in `backend/` directory
3. Make sure you're using Node.js v18 or higher: `node --version`
4. Try deleting `node_modules` and running `npm install` again

## ✨ What's New?

Your app now has:

- **Centralized Database**: All users share the same data
- **Multi-user Support**: Admins can see and manage all tickets
- **Cross-device Access**: Login from any device
- **Persistent Data**: Data survives app uninstalls
- **Professional Architecture**: Industry-standard client-server design

## 🎮 Test It Out

1. Login as admin (`admin@system.com` / `admin123`)
2. Create a test ticket
3. Add a comment
4. Check notifications
5. Try logging out and back in
6. Data persists! 🎉

---

**Need help?** Check the detailed docs above or review the error messages carefully - they usually tell you exactly what's wrong!
