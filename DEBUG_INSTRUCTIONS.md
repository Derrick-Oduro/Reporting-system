# Debugging Instructions

## Current Issues and Solutions

### 1. Logout Button Not Working

#### Debug Steps:

1. **Clear cache and restart:**

   ```bash
   npx expo start -c
   ```

2. **Open the app and watch the terminal console**

3. **Press the logout button** - You should see these messages in order:

   ```
   Home logout pressed  (or Profile logout pressed)
   Logging out...
   Logout successful, user cleared
   Navigation effect - isAuthenticated: false, inAuthGroup: false, segments: [...]
   Navigating to login...
   ```

4. **If you don't see these messages:**
   - The button press handler is not firing
   - Check if Alert dialog appears
   - Check if "Cancel" or "Logout" was pressed

5. **If messages appear but navigation doesn't work:**
   - Check segments array value
   - Try force reloading the app (Cmd+R or Shake device → Reload)

#### Alternative Test:

Try logging out from the **Profile** tab instead of the Home tab to rule out component-specific issues.

### 2. iOS Not Loading on Expo Go

#### Issue:

SQLite is a native module that may have compatibility issues with Expo Go on iOS.

#### Solutions:

**Option A: Use Development Build (Recommended)**

```bash
# Install EAS CLI if you haven't
npm install -g eas-cli

# Login to Expo
eas login

# Create a development build
eas build --profile development --platform ios

# After build completes, install on your device
# Then start dev server:
npx expo start --dev-client
```

**Option B: Test on Android First**

```bash
# Start expo
npx expo start

# Press 'a' to open on Android emulator (or scan QR with Expo Go on Android device)
```

**Option C: Use iOS Simulator (Mac only)**

```bash
# Start expo
npx expo start

# Press 'i' to open in iOS Simulator
```

**Option D: Check Expo Go Version**

- Make sure you have the latest version of Expo Go installed on your iOS device
- Update from App Store if needed
- Compatible with SDK 54

### 3. SQLite Database Issues

If you encounter database errors:

```bash
# Clear all data and restart
npx expo start -c --clear

# On device: Delete the app and reinstall
```

### 4. AsyncStorage Issues

If logout clears data but navigation doesn't work:

```typescript
// Add this to a test button to check AsyncStorage:
import AsyncStorage from "@react-native-async-storage/async-storage";

const checkStorage = async () => {
  const user = await AsyncStorage.getItem("@ticketing_system:user");
  console.log("Stored user:", user);
};
```

## Testing Checklist

- [ ] Cleared cache with `npx expo start -c`
- [ ] Tested logout from Home tab
- [ ] Tested logout from Profile tab
- [ ] Checked terminal console for log messages
- [ ] Tried on Android device/emulator
- [ ] Updated Expo Go to latest version (iOS)
- [ ] Tried development build (if Expo Go fails)

## Common Errors and Fixes

### Error: "Unable to resolve module"

**Fix:** Clear cache and node_modules

```bash
rm -rf node_modules
npm install
npx expo start -c
```

### Error: "SQLite database is not open"

**Fix:** Wait for database to initialize

- Check that DatabaseContext isReady is true before accessing database
- Component should show loading state while isReady is false

### Error: "Navigation container not ready"

**Fix:** Ensure router is available

```typescript
// In your component:
const router = useRouter();

// Use setTimeout as workaround if needed:
setTimeout(() => router.replace("/auth/login"), 100);
```

## Next Steps

1. Follow the debug steps above for logout
2. Report which console messages you see
3. Try Android if iOS continues to fail
4. Consider development build for iOS if Expo Go doesn't work
