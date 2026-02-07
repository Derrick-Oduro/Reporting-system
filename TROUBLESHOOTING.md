# Troubleshooting Guide

## Issue 1: Logout Button Not Working

### Quick Fix:

The logout is likely working, but the app might be cached. Try these steps:

1. **Clear Metro Cache**:

   ```bash
   npx expo start -c
   ```

2. **Reload the app** on your device:
   - Shake your device
   - Tap "Reload"

3. **If still not working**, try logging out from the **Profile tab** instead of the Home tab's header button.

---

## Issue 2: iOS Not Loading on Expo

### Common iOS Issues & Solutions:

#### Option A: Use Expo Go App (Easiest)

```bash
# 1. Stop current server (Ctrl+C)
# 2. Clear cache and restart
npx expo start -c

# 3. On your iOS device:
#    - Open Expo Go app
#    - Scan the QR code
```

#### Option B: Development Build (If Expo Go doesn't work)

```bash
# SQLite requires a development build for some features
# This creates a custom version with native modules

npx expo prebuild
npx expo run:ios
```

#### Option C: Use Android Instead (Temporary)

If iOS is giving issues, test on Android:

```bash
npx expo start -c
# Press 'a' for Android
```

---

## Complete Reset (Nuclear Option)

If nothing works, try this:

```bash
# 1. Stop the dev server (Ctrl+C)

# 2. Clear everything
rm -rf node_modules
rm -rf .expo
rm -rf ios
rm -rf android

# 3. Reinstall
npm install

# 4. Start fresh
npx expo start -c
```

---

## Testing on Different Platforms

### ✅ **Recommended: Android Emulator**

Most reliable for this app:

```bash
npx expo start -c
# Press 'a' when prompted
```

### ⚠️ **iOS Simulator** (Mac only)

Requires Xcode:

```bash
npx expo start -c
# Press 'i' when prompted
```

### 📱 **Physical Device** (Best for real testing)

1. Install Expo Go from App Store/Play Store
2. Run: `npx expo start -c`
3. Scan QR code with Expo Go

---

## Logout Debugging

Add console logs to see what's happening:

### Edit `app/(tabs)/home.tsx`:

```typescript
const handleLogout = () => {
  console.log("Logout button pressed");
  Alert.alert("Logout", "Are you sure you want to logout?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Logout",
      onPress: () => {
        console.log("Logout confirmed");
        logout();
        console.log("Logout function called");
      },
      style: "destructive",
    },
  ]);
};
```

### Check console output:

- Open Metro bundler terminal
- Look for the console.log messages
- This will tell you if the function is being called

---

## Known Issues

### SQLite on Web

- **Does not work** - Use mobile platforms only
- Web browsers don't support native SQLite

### iOS Simulator

- Sometimes slower than Android
- May require development build for SQLite

### Expo Go Limitations

- Some native modules might not work
- If you see "Cannot use SQLite", you need a development build

---

## Quick Test Checklist

Try these in order:

- [ ] Clear cache: `npx expo start -c`
- [ ] Reload app on device
- [ ] Try logout from Profile tab
- [ ] Test on Android instead of iOS
- [ ] Use physical device with Expo Go
- [ ] Create development build if needed

---

## Get Help

If still stuck, provide this info:

1. Platform (iOS/Android/Web)
2. Device (Simulator/Physical)
3. Any error messages in terminal
4. What happens when you press logout
