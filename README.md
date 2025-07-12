# Friendlines - React Native Mobile App

A mobile news platform built with React Native and Expo, designed to look and feel like a professional news website. Users can write and share headlines with their network in a news-style interface.

## Features

- **News Website UI**: Professional news site layout with featured articles and sections
- **Headline Publishing**: Write and publish news headlines (180 characters max)
- **News Sections**: Organize content by sections (Friends, Work, etc.)
- **Journalist Network**: Connect with other journalists by username or email
- **Breaking News Alerts**: In-app notifications when headlines are published
- **Professional Profiles**: View journalist profiles, bio, and published articles
- **Dark Mode Support**: News-appropriate dark theme for comfortable reading
- **Offline-First**: JSON database using AsyncStorage for instant access

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (iOS/Android)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
# or
expo start
```

3. Scan the QR code with:
   - iOS: Camera app
   - Android: Expo Go app

## Demo Accounts

The app comes with pre-seeded demo accounts:

- Username: `noa` (has friends and groups)
- Username: `amir` (member of Friends group)
- Username: `maya` (member of Work group)

Note: Any password works for demo accounts in the mockup.

## App Structure

```
src/
├── components/          # Reusable UI components
│   ├── NewsflashCard.tsx
│   └── InAppNotification.tsx
├── constants/          # Theme and styling constants
│   └── theme.ts
├── navigation/         # Navigation setup
│   └── AppNavigator.tsx
├── screens/            # App screens
│   ├── LoginScreen.tsx
│   ├── FeedScreen.tsx
│   ├── CreateNewsflashScreen.tsx
│   ├── AddFriendScreen.tsx
│   └── ProfileScreen.tsx
├── services/           # Database and API services
│   └── database.ts
├── types/              # TypeScript type definitions
│   └── index.ts
└── utils/              # Helper functions
    └── helpers.ts
```

## Database Structure

The app uses AsyncStorage for persistent data storage with the following collections:

- **Users**: User profiles with friends list
- **Groups**: Group information with member lists
- **Newsflashes**: News updates with recipient information
- **Friend Requests**: Pending/accepted friend requests

## Key Features Implementation

### Publishing Headlines
1. Navigate to the "Write" tab (✍️)
2. Compose your headline (180 character limit)
3. Select news sections and/or specific contacts
4. Tap "Publish Headline" - breaking news notification appears

### Building Your Network
1. Go to the "Network" tab (🌐)
2. Search journalists by username or email
3. Send connection request
4. Once accepted, share headlines directly with them

### News Feed Experience
1. "Home" tab shows all headlines in news website layout
2. Featured articles appear with large hero images
3. Filter by sections using top navigation
4. Pull to refresh for latest headlines

## Future Enhancements

- Push notifications for new newsflashes
- Image attachments for newsflashes
- Comments and reactions
- Group creation and management
- Friend request notifications
- Search functionality
- Real-time updates with WebSocket
- Backend API integration

## Technologies Used

- React Native
- Expo
- TypeScript
- React Navigation
- AsyncStorage
- React Native Paper (UI components)

## License

This project is a demo/mockup for educational purposes. 