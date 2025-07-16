# Friendlines - React Native Mobile App

A mobile news platform built with React Native and Expo, designed to look and feel like a professional news website. Users can write and share headlines with their network in a news-style interface.

## Features

- **News Website UI**: Professional news site layout with featured articles and compact news cards 
- **Headline Publishing**: Write and publish news headlines (180 characters max)
- **News Sections**: Organize content by sections (Friends, Work, etc.)
- **Journalist Network**: Connect with other journalists by username or email
- **Breaking News Alerts**: In-app notifications when headlines are published
- **Professional Profiles**: View journalist profiles, bio, and published articles
- **Dark Mode Support**: News-appropriate dark theme for comfortable reading
- **Offline-First**: JSON database using AsyncStorage for instant access
- **Responsive Layout**: Properly handles safe areas on both iOS and Android devices

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

### Connecting to the Backend

This frontend requires a running instance of the `friendlines-backend`.

1.  **Set up the backend**: Follow the instructions in the `friendlines-backend` repository's `README.md` to get the backend server running.

2.  **Configure the API URL**: Create a `.env` file in the root of this project by copying the example file:
    ```bash
    cp env.example .env
    ```

3.  **Update the API URL**: Open the `.env` file and update the `EXPO_PUBLIC_API_URL` to point to your backend.
    *   If you are running the backend locally and using an Android emulator, you can often use `http://10.0.2.2:3000/api/v1`.
    *   If you are using a physical device with Expo Go, you will need to use a tool like `ngrok` to expose your local backend. Follow the instructions in the backend's `README.md` to set up `ngrok` and get your public URL.

### Running the Frontend

1. Start the development server:
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
3. Compact news cards with:
   - Category labels
   - Clear headline text
   - Author attribution
   - Thumbnail images
   - Professional spacing and layout
4. Filter by sections using top navigation
5. Pull to refresh for latest headlines

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

## UI Components

### NewsflashCard
- Two display modes:
  1. Featured article: Large hero image with prominent headline
  2. Compact card: Ynet-style layout with:
     - Right-aligned thumbnail (120x80px)
     - Category label
     - Headline with proper text wrapping
     - Author and timestamp footer
- Proper spacing and no text overlapping
- Responsive to different screen sizes

### Navigation
- Bottom tab navigation with proper safe area handling
- Intuitive icons: Home🏠, Write✍️, Network🌐, Profile👤
- Properly positioned above system navigation on Android
- Consistent experience across iOS and Android 