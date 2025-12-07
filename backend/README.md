# 🎫 Festival Marketplace Backend API

Backend service cho **Festival Ticket Marketplace** - index blockchain events, cache data, và cung cấp REST APIs.

---

## 🎯 Tổng Quan

Backend này giúp:

- **Index blockchain events** từ smart contracts
- **Cache dữ liệu** vào database để query nhanh
- **REST APIs** cho frontend consumption
- **Analytics & Statistics** cho marketplace
- **Search & Filter** festivals và tickets

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Cập nhật contract addresses từ deployedAddresses.json
# Cấu hình database và Redis connection
```

### 3. Setup Database (PostgreSQL)

```bash
# Cài PostgreSQL (nếu chưa có)
# Windows: Download từ https://www.postgresql.org/download/

# Tạo database
createdb festival_marketplace

# Hoặc dùng psql:
psql -U postgres
CREATE DATABASE festival_marketplace;
\q
```

### 4. Run Development Server

```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:3001`

---

## 📡 API Endpoints

### Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2024-12-07T10:30:00.000Z",
  "uptime": 123.456
}
```

### Festival APIs

#### Get All Festivals

```http
GET /api/festivals?status=Active&limit=10&offset=0
```

**Query Parameters:**

- `status` (optional): `Active`, `Paused`, `Cancelled`, `Completed`
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:**

```json
{
  "festivals": [
    {
      "id": 1,
      "nftContract": "0x1234...",
      "marketplaceContract": "0x5678...",
      "name": "Summer Music Fest",
      "organizer": "0xabcd...",
      "eventDate": 1735689600000,
      "location": "Hanoi, Vietnam",
      "status": "Active",
      "totalTickets": 1000,
      "soldTickets": 450,
      "imageUrl": "ipfs://Qm...",
      "createdAt": "2024-12-01T00:00:00.000Z"
    }
  ],
  "total": 50,
  "limit": 10,
  "offset": 0
}
```

#### Get Festival by NFT Contract

```http
GET /api/festivals/:nftContract
```

**Response:** Single festival object

#### Get Festival Tickets

```http
GET /api/festivals/:nftContract/tickets?available=true
```

**Response:**

```json
{
  "tickets": [
    {
      "tokenId": 42,
      "nftContract": "0x1234...",
      "owner": "0xabcd...",
      "ticketType": "VIP",
      "price": "100000000000000000000",
      "isUsed": false,
      "isListed": false,
      "purchasedAt": "2024-12-05T10:00:00.000Z"
    }
  ],
  "total": 450
}
```

### Ticket APIs

#### Get Ticket Details

```http
GET /api/tickets/:nftContract/:tokenId
```

**Response:**

```json
{
  "tokenId": 42,
  "nftContract": "0x1234...",
  "owner": "0xabcd...",
  "ticketType": "VIP",
  "price": "100000000000000000000",
  "isUsed": false,
  "isListed": false,
  "purchasedAt": "2024-12-05T10:00:00.000Z",
  "metadata": {
    "name": "Summer Music Fest - VIP #42",
    "description": "VIP ticket for Summer Music Fest",
    "image": "ipfs://Qm...",
    "attributes": [...]
  }
}
```

#### Get User's Tickets

```http
GET /api/users/:address/tickets?status=active
```

**Query Parameters:**

- `status`: `active`, `used`, `listed`, `all` (default: `active`)

**Response:**

```json
{
  "tickets": [...],
  "total": 5
}
```

#### Get Ticket Transaction History

```http
GET /api/tickets/:nftContract/:tokenId/history
```

**Response:**

```json
{
  "history": [
    {
      "txHash": "0xabcd...",
      "type": "PrimaryPurchase",
      "from": "0x0000...",
      "to": "0x1234...",
      "price": "100000000000000000000",
      "timestamp": "2024-12-05T10:00:00.000Z"
    },
    {
      "txHash": "0xef01...",
      "type": "SecondaryPurchase",
      "from": "0x1234...",
      "to": "0x5678...",
      "price": "110000000000000000000",
      "timestamp": "2024-12-06T15:30:00.000Z"
    }
  ]
}
```

### Transaction APIs

#### Get Festival Transactions

```http
GET /api/transactions/:nftContract?limit=20&offset=0
```

**Response:**

```json
{
  "transactions": [
    {
      "id": 1,
      "txHash": "0xabcd...",
      "nftContract": "0x1234...",
      "tokenId": 42,
      "type": "PrimaryPurchase",
      "buyer": "0x5678...",
      "seller": "0x0000...",
      "price": "100000000000000000000",
      "timestamp": "2024-12-05T10:00:00.000Z",
      "blockNumber": 12345
    }
  ],
  "total": 450
}
```

#### Get User Transactions

```http
GET /api/transactions/user/:address?type=all
```

**Query Parameters:**

- `type`: `PrimaryPurchase`, `SecondaryPurchase`, `Gift`, `all` (default: `all`)

### Analytics APIs

#### Get Marketplace Analytics

```http
GET /api/analytics/marketplace
```

**Response:**

```json
{
  "totalRevenue": "50000000000000000000000",
  "totalTransactions": 1250,
  "totalTicketsSold": 1250,
  "averageTicketPrice": "40000000000000000000",
  "platformFees": "5000000000000000000000",
  "topFestivals": [
    {
      "nftContract": "0x1234...",
      "name": "Summer Music Fest",
      "totalSales": "10000000000000000000000",
      "ticketsSold": 450
    }
  ],
  "revenueByDay": [
    {
      "date": "2024-12-01",
      "revenue": "1000000000000000000000",
      "transactions": 25
    }
  ]
}
```

#### Get Festival Analytics

```http
GET /api/analytics/festival/:nftContract
```

**Response:**

```json
{
  "nftContract": "0x1234...",
  "totalRevenue": "10000000000000000000000",
  "primarySales": "9000000000000000000000",
  "secondarySales": "1000000000000000000000",
  "ticketsSold": 450,
  "totalTickets": 1000,
  "selloutRate": 45,
  "averagePrice": "22222222222222222222",
  "priceHistory": [...]
}
```

#### Get User Analytics

```http
GET /api/analytics/user/:address
```

**Response:**

```json
{
  "address": "0xabcd...",
  "totalSpent": "5000000000000000000000",
  "totalEarned": "1000000000000000000000",
  "ticketsPurchased": 50,
  "ticketsSold": 10,
  "ticketsGifted": 5,
  "favoriteEvents": [...]
}
```

### Search APIs

#### Search Festivals

```http
GET /api/search/festivals?q=music&status=Active&minPrice=50&maxPrice=150
```

**Query Parameters:**

- `q`: Search query (name, location, description)
- `status`: Filter by status
- `minPrice`: Minimum ticket price (in FEST)
- `maxPrice`: Maximum ticket price
- `eventDateFrom`: Start date range
- `eventDateTo`: End date range

#### Search Tickets

```http
GET /api/search/tickets?q=VIP&minPrice=50&maxPrice=150&available=true
```

### IPFS APIs

#### Upload to IPFS

```http
POST /api/ipfs/upload
Content-Type: multipart/form-data
```

**Body:** File or JSON metadata

**Response:**

```json
{
  "ipfsHash": "QmXxx...",
  "url": "ipfs://QmXxx...",
  "gateway": "https://ipfs.io/ipfs/QmXxx..."
}
```

#### Get Metadata

```http
GET /api/metadata/:ipfsHash
```

### User Profile APIs

#### Get User Profile

```http
GET /api/users/:address/profile
```

**Response:**

```json
{
  "address": "0xabcd...",
  "festBalance": "10000000000000000000000",
  "ticketsOwned": 5,
  "ticketsUsed": 3,
  "totalSpent": "5000000000000000000000",
  "totalEarned": "1000000000000000000000",
  "createdAt": "2024-11-01T00:00:00.000Z"
}
```

#### Get User Statistics

```http
GET /api/users/:address/stats
```

### Webhook APIs (Internal)

#### Blockchain Event Webhook

```http
POST /api/webhooks/blockchain
Authorization: Bearer <ADMIN_API_KEY>
```

**Body:**

```json
{
  "event": "TicketPurchased",
  "nftContract": "0x1234...",
  "tokenId": 42,
  "buyer": "0xabcd...",
  "price": "100000000000000000000",
  "txHash": "0xef01...",
  "blockNumber": 12345
}
```

### Notification APIs

#### Get User Notifications

```http
GET /api/notifications/:address?unread=true
```

**Response:**

```json
{
  "notifications": [
    {
      "id": 1,
      "type": "TicketPurchased",
      "message": "You purchased VIP ticket for Summer Music Fest",
      "data": {
        "nftContract": "0x1234...",
        "tokenId": 42
      },
      "read": false,
      "createdAt": "2024-12-05T10:00:00.000Z"
    }
  ],
  "unreadCount": 3
}
```

---

## 🗄️ Database Schema

### Festivals Table

```sql
CREATE TABLE festivals (
  id SERIAL PRIMARY KEY,
  nft_contract VARCHAR(42) UNIQUE NOT NULL,
  marketplace_contract VARCHAR(42),
  name VARCHAR(255) NOT NULL,
  organizer VARCHAR(42) NOT NULL,
  event_date TIMESTAMP,
  location VARCHAR(255),
  description TEXT,
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'Active',
  total_tickets INTEGER DEFAULT 0,
  sold_tickets INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_festivals_status ON festivals(status);
CREATE INDEX idx_festivals_organizer ON festivals(organizer);
CREATE INDEX idx_festivals_event_date ON festivals(event_date);
```

### Tickets Table

```sql
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  nft_contract VARCHAR(42) NOT NULL,
  token_id INTEGER NOT NULL,
  owner VARCHAR(42) NOT NULL,
  ticket_type VARCHAR(50),
  price NUMERIC(78, 0),
  is_used BOOLEAN DEFAULT false,
  is_listed BOOLEAN DEFAULT false,
  purchased_at TIMESTAMP,
  used_at TIMESTAMP,
  metadata_uri TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(nft_contract, token_id)
);

CREATE INDEX idx_tickets_owner ON tickets(owner);
CREATE INDEX idx_tickets_nft_contract ON tickets(nft_contract);
CREATE INDEX idx_tickets_is_listed ON tickets(is_listed);
```

### Transactions Table

```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  tx_hash VARCHAR(66) UNIQUE NOT NULL,
  nft_contract VARCHAR(42) NOT NULL,
  token_id INTEGER,
  type VARCHAR(30) NOT NULL,
  buyer VARCHAR(42),
  seller VARCHAR(42),
  price NUMERIC(78, 0),
  platform_fee NUMERIC(78, 0),
  organizer_fee NUMERIC(78, 0),
  block_number INTEGER,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_nft_contract ON transactions(nft_contract);
CREATE INDEX idx_transactions_buyer ON transactions(buyer);
CREATE INDEX idx_transactions_seller ON transactions(seller);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);
```

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  address VARCHAR(42) UNIQUE NOT NULL,
  fest_balance NUMERIC(78, 0) DEFAULT 0,
  tickets_owned INTEGER DEFAULT 0,
  tickets_used INTEGER DEFAULT 0,
  total_spent NUMERIC(78, 0) DEFAULT 0,
  total_earned NUMERIC(78, 0) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_address ON users(address);
```

---

## 🔧 Blockchain Indexer Service

### Event Listeners

Backend service cần lắng nghe các events từ smart contracts:

**FestivalNFT Events:**

- `TicketMinted(address indexed buyer, uint256 indexed tokenId, string ticketType)`
- `TicketUsed(uint256 indexed tokenId, address indexed user)`
- `TicketGifted(address indexed from, address indexed to, uint256 indexed tokenId)`
- `EventStatusChanged(EventStatus newStatus)`

**FestivalMarketplace Events:**

- `TicketPurchased(address indexed buyer, address indexed seller, uint256 indexed tokenId, uint256 price, bool isPrimary)`
- `TicketListed(uint256 indexed tokenId, uint256 price)`
- `TicketDelisted(uint256 indexed tokenId)`

**FestiveTicketsFactory Events:**

- `FestivalCreated(address indexed nftContract, address indexed marketplaceContract, address indexed organizer)`

### Implementation Example

```typescript
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Listen to TicketPurchased event
const marketplaceContract = new ethers.Contract(
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI,
  provider
);

marketplaceContract.on(
  "TicketPurchased",
  async (buyer, seller, tokenId, price, isPrimary, event) => {
    console.log(`Ticket purchased: ${tokenId} by ${buyer}`);

    // Save to database
    await saveTransaction({
      txHash: event.transactionHash,
      nftContract: event.address,
      tokenId: tokenId.toString(),
      type: isPrimary ? "PrimaryPurchase" : "SecondaryPurchase",
      buyer,
      seller,
      price: price.toString(),
      blockNumber: event.blockNumber,
      timestamp: new Date(),
    });
  }
);
```

---

## 🚀 Deployment

### Local Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

### Environment Variables (Production)

- Update `RPC_URL` to testnet/mainnet
- Configure production database
- Set up Redis for caching
- Add IPFS service credentials
- Configure CORS for production frontend URL

---

## 📊 Tech Stack

- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL 14+
- **Cache**: Redis 7+
- **Blockchain**: Ethers.js v6
- **Security**: Helmet, CORS
- **Logging**: Morgan
- **Process Manager**: PM2 (production)

---

## 🧪 Testing

```bash
# Run tests
npm test

# With coverage
npm run test:coverage
```

---

## 📝 Notes

> **Lưu ý**: Backend này là **tùy chọn**. Frontend có thể hoạt động độc lập với mock data + blockchain queries. Backend chỉ cần thiết khi:
>
> - Cần query nhanh với lượng data lớn
> - Cần analytics và statistics phức tạp
> - Cần search/filter advanced
> - Muốn giảm RPC calls đến blockchain

---

## 🤝 Contributing

Backend đang trong giai đoạn phát triển. Các API endpoints trên là thiết kế tham khảo. Có thể adjust theo nhu cầu thực tế.

---

## 📧 Support

Liên hệ team nếu cần hỗ trợ implement backend service.
