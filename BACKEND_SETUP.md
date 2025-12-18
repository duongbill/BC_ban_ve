# Backend Setup Guide

## Prerequisites

### 1. Install MongoDB

**Windows:**

- Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
- Install with default settings
- Add MongoDB bin folder to PATH: `C:\Program Files\MongoDB\Server\7.0\bin`
- Restart terminal after installation

**MacOS:**

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**

```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### 2. Verify MongoDB Installation

```bash
mongod --version
mongo --version  # or mongosh --version for newer versions
```

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start MongoDB

**Windows:**

```bash
# Start MongoDB service (if not started automatically)
net start MongoDB

# Or start manually:
mongod --dbpath=C:\data\db
```

**MacOS/Linux:**

```bash
# Start MongoDB service
brew services start mongodb-community  # MacOS
sudo systemctl start mongodb           # Linux

# Or start manually:
mongod --dbpath=/data/db
```

### 3. Start Backend Server

```bash
cd backend
node server.js
```

Expected output:

```
Backend server running on http://localhost:4000
```

### 4. Seed Database with Sample Data

```bash
# In a new terminal (keep backend running)
cd ..
node scripts/seed-database.js
```

Expected output:

```
🌱 Seeding database...

📝 Creating festivals...
✅ Created festival: Summer Music Festival
✅ Created festival: Classical Music Night
...

📝 Creating tickets...
✅ Created ticket #1 for festival 1
...

✅ Database seeding completed!
📊 Summary:
   Festivals: 9
   Tickets: 3
```

### 5. Test Backend API

```bash
node scripts/test-backend.js
```

## API Endpoints

### Festivals

- `GET /festivals` - Get all festivals
- `GET /festivals/:id` - Get festival by ID
- `POST /festivals` - Create new festival
- `DELETE /festivals/:id` - Delete festival

### Tickets

- `GET /tickets` - Get all tickets
- `GET /tickets?festivalId=1` - Get tickets for specific festival
- `GET /tickets/:tokenId` - Get ticket by token ID
- `POST /tickets` - Create new ticket
- `PUT /tickets/:tokenId` - Update ticket
- `DELETE /tickets/:tokenId` - Delete ticket

## Troubleshooting

### MongoDB Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:** Make sure MongoDB is running:

```bash
mongod --dbpath=C:\data\db  # Windows
mongod --dbpath=/data/db    # MacOS/Linux
```

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::4000
```

**Solution:** Kill process on port 4000:

```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# MacOS/Linux
lsof -ti:4000 | xargs kill -9
```

### Cannot find module 'express'

```bash
cd backend
npm install
```

## Frontend Integration

Once backend is running, frontend will automatically connect to `http://localhost:4000`.

Make sure to:

1. Start backend server first
2. Seed database with sample data
3. Then start frontend dev server

```bash
# Terminal 1: Backend
cd backend
node server.js

# Terminal 2: Seed (one time)
node scripts/seed-database.js

# Terminal 3: Frontend
cd frontend
npm run dev
```
