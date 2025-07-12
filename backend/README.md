# Friendlines Backend API

A scalable Express.js backend for the Friendlines mobile app, featuring real-time notifications, JWT authentication, and SQLite database.

## Features

- **RESTful API** with Express.js following best practices
- **JWT Authentication** with secure token management
- **SQLite Database** with better-sqlite3 for zero-cost deployment
- **Real-time Updates** using Socket.IO for instant notifications
- **Image Processing** with Sharp for optimized media handling
- **Input Validation** using express-validator
- **Security** with Helmet, CORS, and rate limiting
- **File Uploads** with Multer and automatic image optimization
- **Comprehensive Error Handling** with proper HTTP status codes

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite with better-sqlite3
- **Authentication**: JWT (jsonwebtoken)
- **Real-time**: Socket.IO
- **Security**: Helmet, bcryptjs
- **Validation**: express-validator
- **File Processing**: Multer, Sharp
- **Logging**: Morgan

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository and navigate to backend:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
PORT=3000
JWT_SECRET=your-super-secret-key-change-this
DATABASE_PATH=./database.sqlite
```

### Running the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
Most endpoints require JWT authentication. Include the token in headers:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Authentication

**Register**
```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword",
  "displayName": "John Doe"
}
```

**Login**
```http
POST /auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "securepassword"
}
```

#### Users

**Get User Profile**
```http
GET /users/profile/:id
```

**Update Profile**
```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: multipart/form-data

displayName: "New Name"
bio: "Updated bio"
profilePicture: <file>
```

**Search Users**
```http
GET /users/search?q=john
Authorization: Bearer <token>
```

**Friend Management**
```http
GET /users/friends
POST /users/friends/request
PUT /users/friends/request/:id
DELETE /users/friends/:id
```

#### Newsflashes

**Get Feed**
```http
GET /newsflashes/feed?limit=20&offset=0&section=Technology
```

**Create Newsflash**
```http
POST /newsflashes
Authorization: Bearer <token>
Content-Type: multipart/form-data

content: "Breaking news headline here"
sections: ["Technology", "Sports"]
recipients: [1, 2, 3]
image: <file>
```

**Like/Unlike**
```http
POST /newsflashes/:id/like
Authorization: Bearer <token>
```

**Add Comment**
```http
POST /newsflashes/:id/comment
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Great article!"
}
```

#### Sections

**Get All Sections**
```http
GET /sections
```

**Get Popular Sections**
```http
GET /sections/popular
```

### WebSocket Events

Connect with Socket.IO client:
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

**Events:**
- `friend:online` - Friend comes online
- `friend:offline` - Friend goes offline
- `newsflash:new` - New newsflash notification
- `comment:new` - New comment on your newsflash
- `comment:live` - Real-time comment updates
- `friend:request` - New friend request
- `friend:accepted` - Friend request accepted

## Database Schema

### Users
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password` - Hashed password
- `display_name` - Display name
- `bio` - User biography
- `profile_picture` - Profile image URL
- `created_at` - Registration timestamp
- `updated_at` - Last update timestamp

### Newsflashes
- `id` - Primary key
- `author_id` - Foreign key to users
- `content` - Newsflash text (max 180 chars)
- `image` - Optional image URL
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Additional Tables
- `sections` - News categories
- `friends` - Friend relationships
- `friend_requests` - Pending friend requests
- `comments` - Newsflash comments
- `likes` - Newsflash likes
- `newsflash_sections` - Junction table
- `newsflash_recipients` - Junction table

## Security Best Practices

1. **Environment Variables**: Never commit `.env` file
2. **JWT Secret**: Use a strong, random secret key
3. **Password Hashing**: Bcrypt with salt rounds of 10
4. **Rate Limiting**: Prevents brute force attacks
5. **Input Validation**: All inputs are validated
6. **SQL Injection**: Using parameterized queries
7. **CORS**: Configured for specific origins
8. **Helmet**: Security headers enabled

## Scaling Considerations

### Current (Zero Cost)
- SQLite database (file-based)
- Single server deployment
- Local file storage for uploads

### Future Scaling Path
1. **10K+ Users**: 
   - Move to PostgreSQL
   - Add Redis for caching
   - Use CDN for static files

2. **100K+ Users**:
   - Horizontal scaling with load balancer
   - Separate media server
   - Database read replicas

3. **1M+ Users**:
   - Microservices architecture
   - Message queue (RabbitMQ/Kafka)
   - Distributed caching
   - Geographic distribution

## Development

### Project Structure
```
backend/
├── src/
│   ├── config/         # Database and app configuration
│   ├── controllers/    # Route controllers (if needed)
│   ├── middleware/     # Custom middleware
│   ├── models/         # Data models (if needed)
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Helper functions
│   └── server.js       # Main server file
├── uploads/            # User uploads (gitignored)
├── .env               # Environment variables (gitignored)
├── .gitignore         # Git ignore rules
├── package.json       # Dependencies
└── README.md          # This file
```

### Error Response Format
```json
{
  "error": "Error Type",
  "message": "Human readable error message",
  "details": [...]  // Optional validation errors
}
```

### Success Response Format
```json
{
  "message": "Success message",
  "data": {...}     // Response data
}
```

## Demo Data

The database is seeded with demo users on first run:
- Username: `noa` / Password: `demo123`
- Username: `amir` / Password: `demo123`
- Username: `maya` / Password: `demo123`

## Contributing

1. Follow existing code style
2. Add proper error handling
3. Include input validation
4. Update documentation
5. Test your changes

## License

This project is for educational purposes. 