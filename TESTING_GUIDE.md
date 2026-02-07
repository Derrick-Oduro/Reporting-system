# SPMS Ticketing System - Setup & Testing Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the App

```bash
npm start
```

Then press:

- `i` for iOS simulator
- `a` for Android emulator
- `w` for web browser
- Scan QR code with Expo Go app on your phone

## 🧪 Testing the System

### Test Scenario 1: Admin Login & Ticket Management

1. **Login as Admin**
   - Open the app
   - Email: `admin@spms.edu`
   - Password: `admin123`
   - You'll be redirected to the Admin Dashboard

2. **View Dashboard**
   - See statistics: Pending, In Progress, Resolved, Total tickets
   - View list of all submitted tickets (will be empty initially)

3. **Wait for Student Tickets**
   - Students need to register and create tickets first
   - Then you can manage them from the admin dashboard

### Test Scenario 2: Student Registration & Ticket Submission

1. **Logout from Admin**
   - Tap profile icon or logout button

2. **Register as Student**
   - Tap "Don't have an account? Register"
   - Fill in:
     - Full Name: John Doe
     - Email: john.doe@student.edu
     - Student ID: 2024001234
     - Phone: +233 24 123 4567
     - Password: password123
     - Confirm Password: password123
   - Tap "Register"
   - You'll be logged in automatically

3. **View Student Dashboard**
   - See your personal statistics (all zeros initially)
   - Empty tickets list with prompt to create first ticket

4. **Create a Ticket**
   - Tap "+ New" or "Create Ticket" button
   - Fill in ticket details:
     - Title: "Missing Final Exam Result"
     - Category: Select "Missing Result"
     - Priority: Select "High"
     - Description: "I cannot find my final exam result for MATH 201. The result was supposed to be published last week."
   - Optional: Tap "+ Add Document" to attach supporting files
   - Tap "Submit Ticket"
   - You'll be returned to the dashboard

5. **View Your Ticket**
   - Your new ticket appears in the list
   - Status badge shows "PENDING"
   - Tap on the ticket to view details

6. **Ticket Details**
   - View full description
   - See status history
   - Add comments by typing in the comment box
   - Tap "Post Comment"

7. **Check Notifications**
   - Tap the Notifications tab (bell icon)
   - Currently empty (will show updates when admin changes status)

### Test Scenario 3: Admin Ticket Management

1. **Switch to Admin**
   - Logout from student account
   - Login with admin credentials

2. **View Student Tickets**
   - See all submitted tickets
   - Notice the new ticket from John Doe
   - View statistics updated

3. **Update Ticket Status**
   - Tap "Update Status" on a ticket
   - Select "IN-PROGRESS"
   - Ticket status updates
   - Student receives notification

4. **View Ticket Details**
   - Tap on the ticket to open details
   - View student information
   - See description and attachments
   - View status history

5. **Add Admin Comment**
   - Scroll to comments section
   - Type: "We are investigating this issue. We'll have an update within 24 hours."
   - Tap "Post Comment"
   - Student receives notification

6. **Resolve Ticket**
   - Return to dashboard
   - Tap "Update Status" on the ticket
   - Select "RESOLVED"
   - Confirm the action

### Test Scenario 4: Student Notification Flow

1. **Switch Back to Student**
   - Logout from admin
   - Login as John Doe

2. **Check Notifications**
   - Tap Notifications tab
   - See new notifications:
     - Status changed to IN-PROGRESS
     - New comment from admin
     - Status changed to RESOLVED
   - Notice unread indicators (blue dot, highlighted background)

3. **Read Notifications**
   - Tap a notification to view the ticket
   - Notification marked as read automatically
   - Blue dot disappears

4. **View Updated Ticket**
   - See updated status: RESOLVED
   - Read admin's comment
   - View status history with timestamps
   - Add thank you comment if desired

5. **Dashboard Updates**
   - Return to Home tab
   - Statistics updated (Resolved: 1)
   - Ticket shows green "RESOLVED" badge

## 📋 Additional Test Scenarios

### Test Multiple Tickets

1. Create tickets with different:
   - Categories (Transcript, Registration, Academic, etc.)
   - Priorities (Low, Medium, High)
   - With and without attachments

### Test Profile Management

1. Tap Profile tab
2. View your information
3. See member since date
4. Test logout functionality

### Test Search and Filter

1. Create multiple tickets
2. Admin can view all tickets grouped by status
3. Test pull-to-refresh on all screens

## 🔍 Verification Checklist

### Student Features ✓

- [ ] Register new account
- [ ] Login successfully
- [ ] Submit ticket with all details
- [ ] Upload attachments
- [ ] View submitted tickets
- [ ] Track ticket status
- [ ] Add comments
- [ ] Receive notifications
- [ ] View ticket details
- [ ] View profile
- [ ] Logout

### Admin Features ✓

- [ ] Login as admin
- [ ] View all tickets
- [ ] See ticket statistics
- [ ] Update ticket status
- [ ] Add comments to tickets
- [ ] View student information
- [ ] View ticket history
- [ ] Logout

### Database Operations ✓

- [ ] Database created on first launch
- [ ] Admin user seeded automatically
- [ ] User data persists after app restart
- [ ] Tickets persist after logout
- [ ] Notifications stored correctly
- [ ] Status history tracked

### UI/UX ✓

- [ ] Smooth navigation
- [ ] Loading states show
- [ ] Error messages display
- [ ] Pull-to-refresh works
- [ ] Empty states are helpful
- [ ] Color-coded status badges
- [ ] Responsive layout

## 🐛 Common Issues & Solutions

### Issue: "Database not initialized"

**Solution**: Restart the app. Database initializes on first launch.

### Issue: "Can't upload attachments"

**Solution**: Grant file access permissions when prompted.

### Issue: "Notifications not showing"

**Solution**:

1. Make sure you're logged in as the ticket owner
2. Refresh the notifications screen
3. Check that admin updated the status

### Issue: "Admin dashboard empty"

**Solution**: Create tickets as a student first, then login as admin.

### Issue: "Can't see other tabs"

**Solution**: Make sure you're logged in as student (not admin).

## 📱 Platform-Specific Notes

### iOS

- Simulator: Use Xcode Simulator
- Physical device: Use Expo Go app
- File picker works in simulator

### Android

- Emulator: Use Android Studio AVD
- Physical device: Use Expo Go app
- May need to enable storage permissions

### Web

- Runs in browser
- File picker may have different UI
- Full functionality available

## 🎯 Test Data Examples

### Sample Tickets

1. **Transcript Issue**
   - Title: "Transcript not reflecting updated grades"
   - Category: Transcript
   - Priority: High
   - Description: "My transcript still shows the old grade for CSC 301..."

2. **Registration Problem**
   - Title: "Unable to register for elective courses"
   - Category: Registration
   - Priority: Medium
   - Description: "The registration portal shows an error when I try..."

3. **Academic Query**
   - Title: "Course prerequisite clarification needed"
   - Category: Academic
   - Priority: Low
   - Description: "I'd like to know if I can take MATH 401 without..."

## 📊 Expected Results

After complete testing:

- Multiple users registered
- Various tickets created
- Tickets in different states (pending, in-progress, resolved)
- Comments from both students and admin
- Notifications generated and read
- Status history recorded
- Dashboard statistics accurate

## 🎓 Learning Outcomes

By testing this system, you've experienced:

- Mobile app development with React Native
- SQLite database operations
- Authentication and authorization
- Real-time updates and notifications
- File upload and management
- State management with Context API
- Navigation with Expo Router
- CRUD operations
- Role-based access control

---

**Ready to Test?** Start with Test Scenario 1 and work through each scenario in order for the best experience!
