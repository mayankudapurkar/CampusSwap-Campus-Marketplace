// ==========================================================
// MongoDB Setup Script for Campus Marketplace
// Run this in MongoDB Shell (mongosh) or MongoDB Compass
// ==========================================================

// 1. Switch to the database
use campus_marketplace;

// 2. Create indexes for Users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ college: 1 });
db.users.createIndex({ isOnline: 1 });

// 3. Create indexes for Listings
db.listings.createIndex({ title: "text", description: "text", tags: "text" });
db.listings.createIndex({ college: 1, category: 1, status: 1 });
db.listings.createIndex({ seller: 1 });
db.listings.createIndex({ status: 1, createdAt: -1 });
db.listings.createIndex({ savedBy: 1 });

// 4. Create indexes for Messages & Conversations
db.conversations.createIndex({ participants: 1 });
db.conversations.createIndex({ listing: 1 });
db.conversations.createIndex({ lastMessageAt: -1 });
db.messages.createIndex({ conversation: 1, createdAt: 1 });
db.messages.createIndex({ sender: 1 });

// 5. Create indexes for Notifications
db.notifications.createIndex({ recipient: 1, isRead: 1 });
db.notifications.createIndex({ createdAt: -1 });

// 6. Optional: Seed a test user (password: "password123")
// Note: In production, passwords are bcrypt-hashed by the app.
// Use the /api/auth/register endpoint instead.

print("✅ Campus Marketplace database indexes created successfully!");
print("📌 Database: campus_marketplace");
print("📌 Collections will be auto-created when first documents are inserted.");
