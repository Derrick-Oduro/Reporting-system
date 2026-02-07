# 🚀 Quick Start Guide

## Get Started in 3 Minutes!

### Step 1: Verify Installation ✅

All dependencies are installed! You're ready to go.

### Step 2: Start the App

```bash
npm start
```

This opens the Expo development server. You'll see a QR code and options.

### Step 3: Choose Your Platform

#### Option A: iOS (Mac only)

Press `i` to open iOS Simulator

#### Option B: Android

Press `a` to open Android Emulator

#### Option C: Physical Device

1. Install **Expo Go** app from App Store or Play Store
2. Scan the QR code shown in terminal

#### Option D: Web Browser

Press `w` to open in browser

---

## 🎯 First Time Login

### As Admin (Test the system)

```
Email: admin@spms.edu
Password: admin123
```

**What you'll see**:

- Admin Dashboard
- Empty ticket list (no tickets yet)
- Statistics showing all zeros
- Purple-themed interface

### As Student (Register a new account)

1. On login screen, tap **"Register"**
2. Fill in your details:
   ```
   Full Name: Your Name
   Email: your.email@example.com
   Student ID: 2024001234 (optional)
   Phone: +233 24 123 4567 (optional)
   Password: yourpassword
   Confirm Password: yourpassword
   ```
3. Tap **"Register"**
4. You're automatically logged in!

---

## 📝 Create Your First Ticket

1. **From Student Dashboard**, tap **"+ New"** or **"Create Ticket"**

2. **Fill in the form**:
   - **Title**: "Missing Final Exam Result"
   - **Category**: Select "Missing Result"
   - **Priority**: Select "High"
   - **Description**:
     ```
     I cannot find my final exam result for MATH 201.
     The result was supposed to be published last week.
     My index number is 12345678.
     ```

3. _(Optional)_ **Add documents**: Tap "+ Add Document" to attach files

4. **Submit**: Tap "Submit Ticket"

5. **Done!** Your ticket appears on the dashboard

---

## 👨‍💼 Manage Tickets as Admin

1. **Logout** from student account

2. **Login as admin** (credentials above)

3. **View the ticket** you just created

4. **Update Status**:
   - Tap "Update Status" on the ticket
   - Select "IN-PROGRESS"
   - Student receives notification!

5. **Add a comment**:
   - Tap the ticket to open details
   - Scroll to comments
   - Type: "We're looking into this issue"
   - Tap "Post Comment"
   - Student gets another notification!

6. **Resolve the ticket**:
   - Return to dashboard
   - Tap "Update Status" again
   - Select "RESOLVED"
   - Done!

---

## 🔔 Check Notifications

1. **Switch back to student** account

2. **Tap the Notifications tab** (bell icon)

3. **See your notifications**:
   - Status changed to IN-PROGRESS
   - New comment from admin
   - Status changed to RESOLVED

4. **Tap a notification** to view the ticket

---

## 🎉 You're All Set!

The system is fully functional. You can now:

- ✅ Create multiple tickets
- ✅ Update statuses as admin
- ✅ Add comments
- ✅ Upload files
- ✅ Receive notifications
- ✅ Track ticket progress
- ✅ Manage your profile

---

## 📱 Navigation Quick Reference

### Student Interface (3 Tabs)

- **Home** 🏠 - Your tickets and statistics
- **Notifications** 🔔 - Updates and alerts
- **Profile** 👤 - Your account info

### Available Actions

- **Create Ticket**: Home → "+ New" button
- **View Details**: Tap any ticket card
- **Add Comment**: Ticket Details → Type → "Post Comment"
- **Check Notifications**: Notifications tab
- **Logout**: Profile tab → "Logout"

---

## 🆘 Need Help?

### Common Questions

**Q: I forgot the admin password**  
**A**: Default password is `admin123`

**Q: How do I create a new student?**  
**A**: Use the Register screen, not the admin account

**Q: Where are notifications?**  
**A**: Tap the bell icon in the tab bar (student view)

**Q: Can students update ticket status?**  
**A**: No, only admins can change status

**Q: How do I attach files?**  
**A**: When creating a ticket, tap "+ Add Document"

---

## 🎓 Learning Path

1. **Day 1**: Create account, submit tickets
2. **Day 2**: Test admin features, manage tickets
3. **Day 3**: Explore notifications and comments
4. **Day 4**: Test with multiple users
5. **Day 5**: Deploy to production!

---

## 📊 Testing Checklist

Use this to test all features:

- [ ] Register new student account
- [ ] Login as student
- [ ] Create ticket without attachments
- [ ] Create ticket with attachments
- [ ] View ticket list
- [ ] View ticket details
- [ ] Add comment as student
- [ ] Check statistics
- [ ] Logout
- [ ] Login as admin
- [ ] View all tickets
- [ ] Update ticket status
- [ ] Add admin comment
- [ ] Resolve ticket
- [ ] Logout from admin
- [ ] Login as student again
- [ ] Check notifications
- [ ] Mark notification as read
- [ ] View updated ticket
- [ ] View profile
- [ ] Logout

---

## 🎯 Pro Tips

1. **Use descriptive titles** - Makes tickets easier to manage
2. **Add details** - More information = faster resolution
3. **Attach evidence** - Screenshots or documents help
4. **Check notifications** - Stay updated on your tickets
5. **Add comments** - Keep communication flowing

---

## 🚀 Ready to Go!

Your ticketing system is production-ready. Start the app with `npm start` and begin managing student issues efficiently!

For detailed information, see:

- `PROJECT_README.md` - Full documentation
- `TESTING_GUIDE.md` - Comprehensive testing scenarios
- `FEATURES.md` - Complete features list

**Happy Ticketing! 🎫**
