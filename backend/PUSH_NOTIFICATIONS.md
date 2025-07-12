# Push Notifications Implementation

This document describes the push notification implementation for the Friendlines app.

## Overview

The backend supports push notifications using Expo's push notification service. The system sends notifications for:

1. **New Newsflash** - When a friend posts a newsflash
2. **Friend Request** - When someone sends you a friend request
3. **Group Invitation** - When you're invited to join a group

## Backend Implementation

### Database Schema

```sql
-- Stores push tokens for each user
CREATE TABLE user_push_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  push_token TEXT NOT NULL,
  device_id TEXT,
  platform TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, push_token),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

### API Endpoints

#### Register Push Token
```
POST /api/v1/notifications/register-token
Authorization: Bearer <token>
Body: {
  "pushToken": "ExponentPushToken[...]",
  "deviceId": "optional-device-id",
  "platform": "ios|android|web"
}
```

#### Unregister Push Token
```
DELETE /api/v1/notifications/unregister-token
Authorization: Bearer <token>
Body: {
  "pushToken": "ExponentPushToken[...]"
}
```

#### Test Notification
```
POST /api/v1/notifications/test
Authorization: Bearer <token>
Body: {
  "type": "newsflash|friend_request|group_invitation"
}
```

### Notification Service

The `NotificationService` class handles all push notifications:

```javascript
// Send notification for new newsflash
NotificationService.notifyNewNewsflash(newsflash, recipientIds)

// Send notification for friend request
NotificationService.notifyFriendRequest(request, receiverId)

// Send notification for group invitation
NotificationService.notifyGroupInvitation(group, inviter, inviteeId)
```

## Frontend Integration

### Setup (App.tsx)
```typescript
// Register push token on login
const token = await registerForPushNotificationsAsync();
if (token) {
  await pushNotificationService.registerToken(token);
}
```

### Push Notification Service
```typescript
// Register token with backend
await pushNotificationService.registerToken(token);

// Unregister on logout
await pushNotificationService.unregisterToken();
```

## Testing

Run the test script to verify all notification types:

```bash
cd backend
node test-push-complete.js
```

This will:
1. Create a test user
2. Send friend request → notification
3. Create newsflash → notification to friends
4. Send group invitation → notification
5. Test all notification types

## Notification Payloads

### Newsflash Notification
```json
{
  "title": "John Doe posted a newsflash",
  "body": "Content preview...",
  "data": {
    "type": "newsflash",
    "newsflashId": 123,
    "authorId": 456
  }
}
```

### Friend Request Notification
```json
{
  "title": "New Friend Request",
  "body": "Jane Smith wants to be your friend",
  "data": {
    "type": "friend_request",
    "requestId": 789,
    "senderId": 101
  }
}
```

### Group Invitation Notification
```json
{
  "title": "Group Invitation",
  "body": "You've been invited to join 'Tech News Team'",
  "data": {
    "type": "group_invitation",
    "groupId": 1,
    "inviterId": 2
  }
}
```

## Environment Variables

Add to `.env`:
```
# Push Notifications (optional)
EXPO_ACCESS_TOKEN=your-expo-access-token
```

## Important Notes

1. Push tokens are automatically deactivated when users unregister
2. Only active tokens receive notifications
3. The system handles invalid tokens gracefully
4. Notifications are sent asynchronously to avoid blocking requests
5. Socket.IO events are also emitted for real-time updates

## Troubleshooting

1. **No notifications received**: Check if push token is registered and active
2. **Invalid token errors**: Token might be expired, re-register from client
3. **Rate limits**: Expo has rate limits, implement batching for large recipient lists 