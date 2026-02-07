# Logout and iOS Issues - Resolution Steps

## What I've Done

### 1. Enhanced Logout Debugging

I've added comprehensive logging to track the entire logout flow:

**Files Modified:**

- [contexts/AuthContext.tsx](contexts/AuthContext.tsx) - Added try-catch and console.log to logout function
- [app/(tabs)/home.tsx](<app/(tabs)/home.tsx>) - Made handleLogout async with error handling
- [app/(tabs)/profile.tsx](<app/(tabs)/profile.tsx>) - Added logging to profile logout
- [app/\_layout.tsx](app/_layout.tsx) - Added navigation logging and restored segments dependency

**Created:**

- [app/test-logout.tsx](app/test-logout.tsx) - A dedicated test screen to debug logout functionality

### 2. Test Screen for Logout

I've created a special debug screen at `/test-logout` that you can access from the Profile tab via the "🔧 Debug Logout" button. This screen lets you:

- Test logout with detailed console logging
- Check AsyncStorage contents
- Manually navigate to login
- See current authentication state

## How to Debug

### Step 1: Restart with Clean Cache

```bash
npx expo start -c
```

### Step 2: Test Logout Flow

1. **Login to the app** (use student@spms.edu / student123 or admin@spms.edu / admin123)

2. **Go to Profile tab** and press "🔧 Debug Logout" button

3. **Press "Test Logout"** and watch your terminal console

4. **You should see:**

   ```
   === TEST LOGOUT START ===
   Before logout - isAuthenticated: true
   Before logout - user: [user object]
   Logging out...
   Logout successful, user cleared
   After logout called
   AsyncStorage after logout: null
   Manually navigating to login...
   Navigation effect - isAuthenticated: false, inAuthGroup: false, segments: [...]
   Navigating to login...
   === TEST LOGOUT END ===
   ```

5. **If you see all messages but still stay logged in:**
   - This is a React state update timing issue
   - The manual navigation in the test screen should work
   - Check if the app reloaded after logout

### Step 3: Test Regular Logout

After testing the debug screen, try the regular logout buttons:

- From **Home** tab (top right header button)
- From **Profile** tab (red logout button)

Watch the console for these messages:

```
Home logout pressed (or Profile logout pressed)
Logging out...
Logout successful, user cleared
Navigation effect - isAuthenticated: false, inAuthGroup: false, segments: [...]
Navigating to login...
```

## iOS Loading Issue

### Why iOS Might Not Work on Expo Go

SQLite (`expo-sqlite`) is a **native module** that requires native code. Expo Go has limited native module support and may not include all native modules, especially on iOS.

### Solutions:

#### Option 1: Test on Android First (Quick Test)

```bash
npx expo start
# Press 'a' for Android emulator or scan QR with Android device
```

Android Expo Go typically has better SQLite support.

#### Option 2: Use iOS Simulator (Mac only)

```bash
npx expo start
# Press 'i' to launch iOS Simulator
```

iOS Simulator might work better than physical device with Expo Go.

#### Option 3: Create Development Build (Recommended for Production)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --profile development --platform ios

# After build, install on device and run:
npx expo start --dev-client
```

This creates a custom build with all native modules properly linked.

#### Option 4: Update Expo Go

- Go to App Store
- Update Expo Go to latest version
- Make sure it's compatible with SDK 54

## Expected Console Output

### Successful Logout:

```
Home logout pressed
Logging out...
Logout successful, user cleared
Navigation effect - isAuthenticated: false, inAuthGroup: false, segments: ["(tabs)"]
Navigating to login...
```

### Failed Logout (stays on same screen):

```
Home logout pressed
Logging out...
Logout successful, user cleared
```

(No navigation message = navigation effect not triggered)

## Common Issues and Fixes

### Issue: Console shows logout but stays logged in

**Cause:** React state not updating properly or navigation not triggering

**Fix:**

1. Try the test-logout screen which has manual navigation
2. Force reload app (shake device → Reload or Cmd+R)
3. Check if isAuthenticated actually changes (test screen shows this)

### Issue: Alert doesn't appear when pressing logout

**Cause:** Button handler not connected

**Fix:**

- Check if you're pressing the right button
- Try from different location (Profile vs Home)
- Restart app with cache clear

### Issue: Gets stuck on white screen after logout

**Cause:** Navigation not redirecting to login

**Fix:**

```typescript
// Manual navigation workaround
setTimeout(() => router.replace("/auth/login"), 100);
```

## Files to Check

1. **Terminal Console** - Where all console.log messages appear
2. [DEBUG_INSTRUCTIONS.md](DEBUG_INSTRUCTIONS.md) - Comprehensive debugging guide
3. [app/test-logout.tsx](app/test-logout.tsx) - Test screen code
4. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - General troubleshooting

## Next Steps

1. ✅ Clear cache and restart: `npx expo start -c`
2. ✅ Go to Profile → "🔧 Debug Logout"
3. ✅ Press "Test Logout" and observe console
4. ✅ Report what console messages you see
5. ✅ Try on Android if iOS doesn't work
6. ✅ Consider development build for iOS production use

## Quick Test Checklist

- [ ] Cleared cache
- [ ] Tested debug logout screen
- [ ] Checked console for all log messages
- [ ] Tested regular logout from Home
- [ ] Tested regular logout from Profile
- [ ] Tried on Android (if iOS fails)
- [ ] Updated Expo Go (iOS)
- [ ] Considered development build

---

Let me know what console messages you see when testing!
