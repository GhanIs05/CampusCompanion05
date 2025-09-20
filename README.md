# CampusCompanion 🎓

A comprehensive campus management platform built with Next.js and Firebase, designed to connect students, faculty, and staff through events, forums, and resource sharing.

## 🌟 Features

### 📅 Event Management
- **Create & Manage Events**: Students and organizers can create campus events with detailed information
- **Image Upload**: Upload event images directly to Firebase Storage
- **RSVP System**: Students can RSVP to events and track their attendance
- **Event Discovery**: Browse upcoming campus events with filtering and search
- **Extended Descriptions**: Rich event details with optional extended information

### 💬 Community Forums
- **Discussion Threads**: Create and participate in campus-wide discussions
- **Reply System**: Nested reply system for meaningful conversations
- **Moderation Tools**: Admin and moderator controls for content management
- **Real-time Updates**: Live updates using Firebase real-time listeners

### 📚 Resource Sharing
- **File Uploads**: Share academic resources, documents, and study materials
- **Categorization**: Organize resources by subject, type, and relevance
- **Download Tracking**: Monitor resource usage and popularity
- **Search & Filter**: Find specific resources quickly

### 👥 User Management
- **Role-based Access**: Student, Moderator, and Admin roles with different permissions
- **Profile Management**: Customizable user profiles with avatar upload
- **Organizer Requests**: Students can request event creation permissions
- **Authentication**: Secure Firebase Authentication with email/password

### 🛡️ Admin Dashboard
- **User Analytics**: Comprehensive statistics on user activity
- **Content Moderation**: Manage events, forums, and user content
- **Permission Management**: Grant or revoke user permissions
- **System Analytics**: Monitor platform usage and engagement

## 🚀 Live Demo

**Live Application**: [https://cc02--campusconnect-ee87d.asia-east1.hosted.app/admin](https://campuscompanion-demo.vercel.app)  
**GitHub Repository**: [https://github.com/kkek-041405/CampusCompanion](https://github.com/kkek-041405/CampusCompanion)

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.3.3** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component library
- **Lucide React** - Beautiful icon library

### Backend & Database
- **Firebase Firestore** - NoSQL document database
- **Firebase Authentication** - User authentication and management
- **Firebase Storage** - File and image storage
- **Next.js API Routes** - Serverless API endpoints

### Development Tools
- **ESLint** - Code linting and formatting
- **TypeScript Compiler** - Type checking
- **Genkit** - AI integration development tools

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project with Firestore, Authentication, and Storage enabled

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/kkek-041405/CampusCompanion.git
   cd CampusCompanion
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Configuration**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database, Authentication (Email/Password), and Storage
   - Copy your Firebase config to `src/lib/firebase.ts`

4. **Environment Variables**
   Create a `.env.local` file:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account-email
   FIREBASE_PRIVATE_KEY=your-private-key
   ```

5. **Security Rules**
   Deploy the included Firestore and Storage rules:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules,storage:rules
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Set up admin user**
   ```bash
   node scripts/setup-admin.js your-email@example.com
   ```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   │   ├── events/        # Event management APIs
│   │   ├── forums/        # Forum APIs
│   │   ├── resources/     # Resource sharing APIs
│   │   └── user/          # User management APIs
│   ├── events/            # Event pages
│   ├── forums/            # Forum pages
│   ├── login/             # Authentication pages
│   └── profile/           # User profile management
├── components/            # Reusable React components
│   ├── ui/               # UI component library
│   └── AdminPanel.tsx    # Admin dashboard components
├── contexts/             # React context providers
│   └── AuthContext.tsx   # Authentication context
├── lib/                  # Utility libraries
│   ├── firebase.ts       # Firebase client configuration
│   ├── storage.ts        # File upload utilities
│   └── api.ts            # API client
└── hooks/                # Custom React hooks
```

## 🔐 Authentication & Permissions

### User Roles
- **Student**: Can create forum posts, RSVP to events, upload resources
- **Moderator**: Student permissions + content moderation
- **Admin**: Full system access and user management

### Permission System
- Event creation requires organizer approval
- Content moderation by admins and moderators
- Role-based API access control
- Secure Firebase rules for data protection

## 🗄️ Database Schema

### Collections
- **users**: User profiles and permissions
- **events**: Campus events with RSVP tracking
- **forumThreads**: Discussion threads with replies
- **resources**: Shared academic materials
- **organizerRequests**: Event organizer permission requests

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Mode**: System-aware theme switching
- **Accessible Components**: WCAG compliant UI components
- **Loading States**: Smooth loading indicators and skeleton screens
- **Toast Notifications**: User feedback for all actions
- **Error Boundaries**: Graceful error handling

## 🚀 Development Scripts

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Type checking
npm run typecheck

# Linting
npm run lint

# AI development tools
npm run genkit:dev
```

## 📱 Mobile Support

CampusCompanion is fully responsive and optimized for:
- 📱 Mobile devices (iOS/Android)
- 📊 Tablets 
- 💻 Desktop computers
- 🖥️ Large displays

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Implement proper error handling
- Add loading states for async operations
- Write accessible components
- Test on mobile devices

## 🐛 Known Issues & Limitations

- Firebase Admin SDK requires service account for production
- File upload size limited to 5MB for images
- Real-time features require active internet connection

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- Radix UI for accessible components
- Tailwind CSS for styling system
- Next.js team for the amazing framework
- Open source community for various packages

## 📞 Support

For support, email support@campuscompanion.com or create an issue on GitHub.

---

**Built with ❤️ for campus communities**
