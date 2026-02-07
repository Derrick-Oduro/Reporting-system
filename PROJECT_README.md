# SPMS Ticketing System

A mobile ticketing system for the School of Physical and Mathematical Sciences (SPMS) that allows students to submit, track, and manage support tickets for academic and administrative issues.

## 🎯 Project Overview

### Aim

To develop a simple and efficient ticketing system for reporting and tracking student issues.

### Objectives

- Allow students to submit issues online
- Enable real-time tracking of issue status
- Help administrators manage issues efficiently
- Reduce repeated physical visits by students
- Improve transparency and communication

### Scope

The system handles academic and administrative issues such as:

- Transcript problems
- Missing results
- Registration issues
- Academic queries
- Administrative concerns

## 🏗️ System Architecture

### Technology Stack

- **Frontend**: React Native (Expo)
- **Database**: SQLite (expo-sqlite)
- **Navigation**: Expo Router
- **State Management**: React Context API
- **File Storage**: Expo FileSystem
- **Document Picker**: Expo Document Picker

### Database Schema

The system uses SQLite with the following tables:

- **users**: Student and admin accounts
- **tickets**: Support ticket records
- **comments**: Ticket comments/updates
- **attachments**: File attachments for tickets
- **status_history**: Track status changes
- **notifications**: User notifications

## ✨ Features

### Student Features

1. **Authentication**
   - Register with email, name, student ID
   - Secure login
   - Profile management

2. **Ticket Management**
   - Submit new tickets with title, description, category, and priority
   - Upload supporting documents (PDF, images, Word docs)
   - View all submitted tickets
   - Track ticket status in real-time
   - View detailed ticket information
   - Add comments to tickets

3. **Notifications**
   - Receive notifications when ticket status changes
   - Get notified of admin comments
   - Mark notifications as read
   - View notification history

4. **Dashboard**
   - View ticket statistics (pending, in-progress, resolved)
   - Quick access to create new tickets
   - Recent tickets overview

### Admin Features

1. **Dashboard**
   - View all submitted tickets
   - Filter tickets by status, category, priority
   - View comprehensive statistics

2. **Ticket Management**
   - Update ticket status (pending → in-progress → resolved → closed)
   - Add comments/feedback to tickets
   - View ticket history and all details
   - View student information

3. **Status Updates**
   - Change ticket status with single tap
   - Automatic notifications to students
   - Status change history tracking

## 📱 Screens

### Public Screens

- **Login** - User authentication
- **Register** - New student registration

### Student Screens (Tabs)

- **Home** - Dashboard with tickets list and statistics
- **Notifications** - View and manage notifications
- **Profile** - User profile information

### Additional Screens

- **Create Ticket** - Submit new support ticket
- **Ticket Details** - View and interact with a specific ticket

### Admin Screens

- **Admin Dashboard** - Manage all tickets

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or Expo Go app)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ReportingSystem
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

4. **Run on platform**

   ```bash
   # iOS
   npm run ios

   # Android
   npm run android

   # Web
   npm run web
   ```

### Default Credentials

**Admin Account:**

- Email: `admin@spms.edu`
- Password: `admin123`

**Note**: Students must register their own accounts through the registration screen.

## 📂 Project Structure

```
ReportingSystem/
├── app/                        # App screens (Expo Router)
│   ├── (tabs)/                # Tab navigation screens
│   │   ├── home.tsx          # Student dashboard
│   │   ├── notifications.tsx # Notifications screen
│   │   └── profile.tsx       # Profile screen
│   ├── admin/                # Admin screens
│   │   └── dashboard.tsx     # Admin dashboard
│   ├── auth/                 # Authentication screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── tickets/              # Ticket screens
│   │   ├── create.tsx        # Create ticket
│   │   └── [id].tsx          # Ticket details
│   └── _layout.tsx           # Root layout with providers
├── contexts/                  # React Context providers
│   ├── DatabaseContext.tsx   # Database initialization
│   └── AuthContext.tsx       # Authentication state
├── services/                  # Business logic services
│   ├── authService.ts        # Authentication operations
│   ├── ticketService.ts      # Ticket CRUD operations
│   └── notificationService.ts # Notification management
├── database/                  # Database setup
│   └── schema.ts             # SQLite schema and initialization
├── types/                     # TypeScript interfaces
│   └── index.ts              # Type definitions
├── components/               # Reusable UI components
├── constants/                # App constants
└── assets/                   # Images and static files
```

## 🔐 Security Features

- Password-based authentication
- User session persistence with AsyncStorage
- Role-based access control (student/admin)
- Secure file storage in app directory
- Input validation and sanitization

## 📊 Database Operations

### Key Services

**AuthService**

- User registration and login
- Profile management
- Password changes

**TicketService**

- Create, read, update tickets
- Filter and search functionality
- Attachment management
- Comment system
- Status tracking

**NotificationService**

- Create notifications
- Mark as read
- Get unread count
- Delete notifications

## 🎨 UI/UX Features

- Clean, modern interface
- Intuitive navigation with tab bar
- Real-time status indicators with color coding
- Pull-to-refresh functionality
- Loading states and error handling
- Empty states with helpful messages
- Modal dialogs for actions
- Responsive design

## 📈 Future Enhancements

- Push notifications using Expo Notifications
- Email notifications
- Advanced search and filtering
- Ticket assignment to specific admins
- File preview for attachments
- Export ticket reports
- Analytics dashboard
- Multi-language support
- Dark mode theme

## 🛠️ Development Commands

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web

# Lint code
npm run lint

# Reset project (clean template)
npm run reset-project
```

## 📝 System Requirements

### Hardware Requirements

- Computer or mobile device
- Internet connection
- Minimum 2GB RAM
- 100MB free storage

### Software Requirements

- React Native compatible device/emulator
- iOS 13+ or Android 6.0+
- Modern web browser (for web version)

## 🤝 Contributing

This is a student project for the School of Physical and Mathematical Sciences. For questions or suggestions, please contact the development team.

## 📄 License

This project is developed for educational purposes.

## 👥 Contact

For support or inquiries about the ticketing system, please contact:

- SPMS Administration
- Email: admin@spms.edu

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Developed for**: School of Physical and Mathematical Sciences
