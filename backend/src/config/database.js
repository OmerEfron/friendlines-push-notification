const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(process.env.DATABASE_PATH || './database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

const initializeDatabase = () => {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT,
      bio TEXT,
      profile_picture TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create user_push_tokens table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_push_tokens (
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
  `);

  // Create groups table
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      creator_id INTEGER NOT NULL,
      profile_picture TEXT,
      is_private INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create group_members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS group_members (
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create group_invitations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS group_invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      inviter_id INTEGER NOT NULL,
      invitee_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(group_id, invitee_id),
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create sections table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create newsflashes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS newsflashes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create newsflash_sections junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS newsflash_sections (
      newsflash_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      PRIMARY KEY (newsflash_id, section_id),
      FOREIGN KEY (newsflash_id) REFERENCES newsflashes(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
    )
  `);

  // Create newsflash_recipients junction table (for individual recipients)
  db.exec(`
    CREATE TABLE IF NOT EXISTS newsflash_recipients (
      newsflash_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      is_read INTEGER DEFAULT 0,
      read_at DATETIME,
      PRIMARY KEY (newsflash_id, user_id),
      FOREIGN KEY (newsflash_id) REFERENCES newsflashes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create newsflash_groups junction table (for group recipients)
  db.exec(`
    CREATE TABLE IF NOT EXISTS newsflash_groups (
      newsflash_id INTEGER NOT NULL,
      group_id INTEGER NOT NULL,
      PRIMARY KEY (newsflash_id, group_id),
      FOREIGN KEY (newsflash_id) REFERENCES newsflashes(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
    )
  `);

  // Create friends table
  db.exec(`
    CREATE TABLE IF NOT EXISTS friends (
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, friend_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create friend_requests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(sender_id, receiver_id),
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      newsflash_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (newsflash_id) REFERENCES newsflashes(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create likes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS likes (
      newsflash_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (newsflash_id, user_id),
      FOREIGN KEY (newsflash_id) REFERENCES newsflashes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_newsflashes_author ON newsflashes(author_id);
    CREATE INDEX IF NOT EXISTS idx_newsflashes_created ON newsflashes(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_comments_newsflash ON comments(newsflash_id);
    CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
    CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
    CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON user_push_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_group_invitations_invitee ON group_invitations(invitee_id);
  `);

  // Seed initial data
  seedDatabase();
  
  console.log('✅ Database initialized successfully');
};

const seedDatabase = () => {
  // Check if data already exists
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) return;

  // Seed sections
  const sections = ['Friends', 'Work', 'Family', 'Sports', 'Technology', 'Entertainment'];
  const insertSection = db.prepare('INSERT INTO sections (name) VALUES (?)');
  
  sections.forEach(section => {
    insertSection.run(section);
  });

  // Seed demo users
  const hashedPassword = bcrypt.hashSync('demo123', 10);
  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password, display_name, bio) 
    VALUES (?, ?, ?, ?, ?)
  `);

  const demoUsers = [
    {
      username: 'noa',
      email: 'noa@example.com',
      display_name: 'Noa Cohen',
      bio: 'Tech journalist covering the latest in innovation'
    },
    {
      username: 'amir',
      email: 'amir@example.com',
      display_name: 'Amir Levi',
      bio: 'Sports reporter and fitness enthusiast'
    },
    {
      username: 'maya',
      email: 'maya@example.com',
      display_name: 'Maya Shapira',
      bio: 'Business and finance correspondent'
    }
  ];

  demoUsers.forEach(user => {
    insertUser.run(user.username, user.email, hashedPassword, user.display_name, user.bio);
  });

  // Create a demo group
  const noaId = db.prepare('SELECT id FROM users WHERE username = ?').get('noa').id;
  const amirId = db.prepare('SELECT id FROM users WHERE username = ?').get('amir').id;
  const mayaId = db.prepare('SELECT id FROM users WHERE username = ?').get('maya').id;

  // Create "Tech News Team" group
  const groupResult = db.prepare(`
    INSERT INTO groups (name, description, creator_id)
    VALUES (?, ?, ?)
  `).run('Tech News Team', 'A group for tech enthusiasts and journalists', noaId);

  const groupId = groupResult.lastInsertRowid;

  // Add members to the group
  db.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)').run(groupId, noaId, 'admin');
  db.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)').run(groupId, amirId, 'member');

  // Create friendships
  db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)').run(noaId, amirId, amirId, noaId);
  db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)').run(noaId, mayaId, mayaId, noaId);

  console.log('✅ Demo data seeded successfully');
};

module.exports = {
  db,
  initializeDatabase
}; 