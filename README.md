# 🎓 CampusMarket — MERN Stack Student Marketplace

A full-featured campus marketplace where college students can **buy, sell, and exchange** used academic resources. Built with MongoDB, Express, React, and Node.js.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 **College-Only Auth** | Register only with `.edu` / `.ac.in` emails |
| ✉️ **Email Verification** | Nodemailer sends verification link on signup |
| 🏪 **Listings** | Sell, Exchange, or give away items for Free |
| 📂 **Categories** | Textbooks, Notes, Electronics, Lab Gear, Cycles & more |
| 🔍 **Search & Filters** | Full-text search + category, type, condition, price filters |
| 💬 **Real-Time Chat** | Socket.IO powered instant messaging with read receipts & typing indicators |
| 🔔 **Notifications** | In-app notifications for messages, saves, and offers |
| 📸 **Image Uploads** | Cloudinary integration (up to 5 photos per listing) |
| 👤 **User Profiles** | Ratings, sold count, department, year of study |
| 🔖 **Save Listings** | Bookmark interesting items |
| 📱 **Responsive UI** | Works on mobile, tablet, desktop |
| 🌐 **Online Status** | Real-time online/offline indicators |

---

## 🗂️ Project Structure

```
campus-marketplace/
├── server/                  # Node.js + Express backend
│   ├── models/
│   │   ├── User.js          # User schema with college email validation
│   │   ├── Listing.js       # Listing schema (sell/exchange/free)
│   │   ├── Chat.js          # Message + Conversation schemas
│   │   └── Notification.js  # Notification schema
│   ├── routes/
│   │   ├── auth.js          # Register, login, verify, reset password
│   │   ├── listings.js      # CRUD + search + save
│   │   ├── chat.js          # Conversations + messages
│   │   ├── users.js         # Profile, saved listings, ratings
│   │   └── notifications.js # Read/list notifications
│   ├── middleware/
│   │   └── auth.js          # JWT protect + requireVerified middleware
│   ├── socket/
│   │   └── socketHandler.js # Socket.IO real-time logic
│   ├── config/
│   │   ├── cloudinary.js    # Cloudinary image upload config
│   │   └── email.js         # Nodemailer email service
│   ├── index.js             # Main Express server + Socket.IO setup
│   ├── .env.example         # Environment variables template
│   └── package.json
│
├── client/                  # React frontend
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.js    # Auth state + login/logout/register
│   │   │   └── SocketContext.js  # Socket.IO connection + online users
│   │   ├── pages/
│   │   │   ├── Home.js           # Landing page with hero + categories
│   │   │   ├── Listings.js       # Browse + filter all listings
│   │   │   ├── ListingDetail.js  # Single listing with contact/save
│   │   │   ├── CreateListing.js  # Create new listing form
│   │   │   ├── EditListing.js    # Edit existing listing
│   │   │   ├── Chat.js           # Full real-time chat UI
│   │   │   ├── Profile.js        # User profile + their listings
│   │   │   ├── MyListings.js     # Manage own listings
│   │   │   ├── SavedListings.js  # Bookmarked listings
│   │   │   ├── Login.js          # Login page
│   │   │   ├── Register.js       # Multi-step registration
│   │   │   ├── VerifyEmail.js    # Email verification handler
│   │   │   ├── ForgotPassword.js # Forgot password form
│   │   │   ├── ResetPassword.js  # Reset password with token
│   │   │   └── NotFound.js       # 404 page
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Navbar.js     # Sticky nav with notifications + search
│   │   │   └── listings/
│   │   │       └── ListingCard.js # Reusable listing card
│   │   ├── styles/
│   │   │   └── global.css        # Design system + CSS variables
│   │   ├── App.js               # Routes + providers
│   │   └── index.js             # React entry point
│   └── package.json
│
├── mongo-setup.js           # MongoDB index creation script
├── docker-compose.yml       # Docker setup (MongoDB + Server + Client)
├── package.json             # Root scripts (dev, install-all)
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

---

### Step 1: Clone & Install

```bash
# Clone the repo
git clone <your-repo-url>
cd campus-marketplace

# Install all dependencies at once
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

---

### Step 2: Configure Environment Variables

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campus_marketplace
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRE=7d

# Email (use Gmail App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password

# Cloudinary (free at cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
CLIENT_URL=http://localhost:3000

# Allowed college email domains (comma-separated)
ALLOWED_EMAIL_DOMAINS=edu,ac.in,iit.ac.in,bits-pilani.ac.in
```

---

### Step 3: Set Up MongoDB

#### Option A — Local MongoDB

```bash
# Start MongoDB service
sudo systemctl start mongod       # Linux
brew services start mongodb-community  # macOS

# Run index setup script
mongosh campus_marketplace mongo-setup.js
```

#### Option B — MongoDB Atlas (Free Cloud)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free cluster
3. Click **Connect** → **Drivers** → copy the URI
4. Replace `MONGODB_URI` in your `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campus_marketplace
   ```

#### Option C — Docker (MongoDB only)

```bash
docker run -d --name campus_mongo \
  -p 27017:27017 \
  -v campus_mongo_data:/data/db \
  mongo:7.0
```

---

### Step 4: Run the App

```bash
# From root directory — runs both server + client concurrently
npm run dev
```

Or run separately:

```bash
# Terminal 1 — Backend (port 5000)
cd server && npm run dev

# Terminal 2 — Frontend (port 3000)
cd client && npm start
```

Open **http://localhost:3000** in your browser 🎉

---

## 🛢️ MongoDB — Database Schema

### Collections Overview

```
campus_marketplace
├── users
├── listings
├── conversations
├── messages
└── notifications
```

### Key Indexes Created by `mongo-setup.js`

```js
// Users
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ college: 1 })

// Listings — full-text search
db.listings.createIndex({ title: "text", description: "text", tags: "text" })
db.listings.createIndex({ college: 1, category: 1, status: 1 })
db.listings.createIndex({ seller: 1 })

// Chat
db.conversations.createIndex({ participants: 1 })
db.messages.createIndex({ conversation: 1, createdAt: 1 })

// Notifications
db.notifications.createIndex({ recipient: 1, isRead: 1 })
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with college email |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/verify-email/:token` | Verify email |
| POST | `/api/auth/resend-verification` | Resend verification email |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password/:token` | Reset password |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |

### Listings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/listings` | Get all listings (filters, pagination) |
| GET | `/api/listings/:id` | Get single listing |
| POST | `/api/listings` | Create listing (auth + verified) |
| PUT | `/api/listings/:id` | Update listing (owner only) |
| DELETE | `/api/listings/:id` | Delete listing (owner only) |
| POST | `/api/listings/:id/save` | Save/unsave listing |
| PATCH | `/api/listings/:id/status` | Mark sold/reserved/active |
| POST | `/api/listings/upload-images` | Upload images to Cloudinary |
| GET | `/api/listings/user/:userId` | Get user's listings |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/conversations` | Get all conversations |
| POST | `/api/chat/conversations` | Start/get conversation |
| GET | `/api/chat/conversations/:id/messages` | Get messages |
| POST | `/api/chat/conversations/:id/messages` | Send message |
| GET | `/api/chat/unread-count` | Get total unread count |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/profile/update` | Update own profile |
| GET | `/api/users/me/saved` | Get saved listings |
| POST | `/api/users/:id/rate` | Rate a user |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications |
| PATCH | `/api/notifications/read-all` | Mark all as read |
| PATCH | `/api/notifications/:id/read` | Mark one as read |

---

## 🔌 Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `send_message` | `{ conversationId, content, type }` | Send a message |
| `typing_start` | `{ conversationId }` | User starts typing |
| `typing_stop` | `{ conversationId }` | User stops typing |
| `join_conversation` | `conversationId` | Join a chat room |
| `messages_read` | `{ conversationId }` | Mark messages as read |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | Message object | New message received |
| `typing` | `{ userId, name, conversationId }` | Someone is typing |
| `stop_typing` | `{ userId, conversationId }` | Stopped typing |
| `user_online` | `{ userId }` | User came online |
| `user_offline` | `{ userId }` | User went offline |
| `new_notification` | Notification object | New notification |
| `update_unread_count` | — | Trigger unread count refresh |

---

## ⚙️ External Services Setup

### Gmail App Password (for email)
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification (enable it)
3. Security → App Passwords → Create password for "Mail"
4. Copy the 16-character password into `.env` as `EMAIL_PASS`

### Cloudinary (for image uploads)
1. Sign up free at [cloudinary.com](https://cloudinary.com)
2. Dashboard → copy Cloud Name, API Key, API Secret
3. Paste into `.env`

> **Note:** The app works without Cloudinary — it will fall back to storing base64 image data. For production, always use Cloudinary.

---

## 🌍 Production Deployment

### Backend (Railway / Render / EC2)
```bash
cd server
npm start
```

Set all environment variables on your hosting platform.

### Frontend (Vercel / Netlify)
```bash
cd client
npm run build
# Deploy the /build folder
```

Set `REACT_APP_SERVER_URL=https://your-backend-url.com` in Vercel/Netlify env.

### MongoDB Atlas
Use Atlas in production — it's free for small projects and scales easily.

---

## 🎨 Design System

The UI uses a consistent design system defined in `client/src/styles/global.css`:

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#5B4AE8` | Brand purple — buttons, links, accents |
| `--secondary` | `#FF6B6B` | Coral red — badges, errors, danger |
| `--accent` | `#FFD93D` | Golden yellow — warnings, stars |
| `--success` | `#6BCB77` | Green — online status, success states |
| `--surface` | `#FFFFFF` | Card backgrounds |
| `--surface2` | `#F7F5FF` | Page backgrounds |
| `--text` | `#1A1035` | Primary text |
| `--text3` | `#8B82B0` | Muted/secondary text |

---

## 🧪 Test Accounts

After starting the app, register using any college email. For local testing, you can temporarily allow all emails by editing `User.js`:

```js
// In server/models/User.js, change this for testing:
userSchema.statics.isCollegeEmail = function(email) {
  return true; // Allow all emails in dev
};
```

---

## 📋 Checklist Before Going Live

- [ ] Set a strong `JWT_SECRET` (32+ random chars)
- [ ] Use MongoDB Atlas instead of local MongoDB
- [ ] Configure real Gmail App Password or SendGrid
- [ ] Set up Cloudinary with your own account
- [ ] Update `ALLOWED_EMAIL_DOMAINS` to your college's domain
- [ ] Set `CLIENT_URL` to your deployed frontend URL
- [ ] Enable HTTPS on your backend

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue first to discuss what you'd like to change.

---

## 📄 License

MIT — feel free to use this for your college project or startup!

---

Made with ❤️ for students, by students. Happy trading! 🎓
