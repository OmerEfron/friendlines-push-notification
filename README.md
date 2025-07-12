# Friendlines - React Native Mobile App

A social news-sharing app built with React Native and Expo, where users can share short news updates (newsflashes) with their friends and groups.

## Features

- **User Authentication**: Login/Register with username and email
- **Newsflashes**: Create and share short news updates (180 characters max)
- **Groups**: Share newsflashes with specific groups (Friends, Work, etc.)
- **Friend System**: Add friends by username or email
- **Real-time Notifications**: In-app notifications when newsflashes are created
- **User Profiles**: View profiles, edit bio, see stats
- **Dark Mode Support**: Automatic theme based on system preference
- **File-based Database**: JSON database using AsyncStorage (easy to migrate to real DB)

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

### Creating Newsflashes
1. Navigate to the "Create" tab
2. Enter your message (180 character limit)
3. Select groups and/or friends to send to
4. Tap "Post" - an in-app notification will appear

### Adding Friends
1. Go to the "Friends" tab
2. Search by username or email
3. Send friend request
4. Once accepted, you can send newsflashes directly to them

### Profile Management
1. Go to "Profile" tab to view your profile
2. Edit your bio
3. View your stats (newsflashes, friends, groups)
4. Logout from your profile screen

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