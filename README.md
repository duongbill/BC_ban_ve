# 🎫 Festival Ticket Marketplace

> **Hệ thống quản lý và mua bán vé sự kiện trên blockchain**  
> Ứng dụng Web3 với smart contracts Solidity, React TypeScript, và UI hiện đại

---

## 📖 Giới Thiệu

**Festival Ticket Marketplace** là nền tảng mua bán vé sự kiện phi tập trung, sử dụng công nghệ blockchain để đảm bảo:

- ✅ **Chống giả mạo vé** - Mỗi vé là NFT duy nhất trên blockchain
- ✅ **Minh bạch giao dịch** - Lịch sử mua bán được ghi nhận công khai
- ✅ **Giới hạn chênh lệch giá** - Tối đa 110% giá gốc khi bán lại
- ✅ **Xác thực QR code** - Quét mã QR tại cổng vào sự kiện
- ✅ **Tặng vé miễn phí** - Chuyển vé cho bạn bè không qua sàn
- ✅ **Hoa hồng công bằng** - 5% cho ban tổ chức, 10% cho sàn

---

## 🎯 Tính Năng Chính

### 🎪 Cho Người Tổ Chức Sự Kiện

- Tạo sự kiện và phát hành vé NFT
- Quản lý trạng thái sự kiện (Active/Paused/Cancelled/Completed)
- Nhận hoa hồng 5% từ giao dịch thứ cấp
- Xác thực vé tại cổng vào (VERIFIER_ROLE)
- Theo dõi số lượng vé đã bán

### 🎟️ Cho Người Mua Vé

- Mua vé trực tiếp từ ban tổ chức
- Xem tất cả vé đã mua với QR code
- Bán lại vé (tối đa 110% giá gốc)
- Tặng vé miễn phí cho bạn bè
- Xem lịch sử giá và giao dịch
- Tải xuống QR code để vào cổng

### 🛒 Chợ Thứ Cấp

- Mua vé từ người dùng khác
- Filter: Upcoming / Past / All events
- So sánh giá với giá gốc
- Hệ thống phí minh bạch (15% total)

---

## 🏗️ Kiến Trúc Hệ Thống

### Smart Contracts

```
┌─────────────────────────────────────────────────┐
│           FestToken (ERC20)                     │
│  Token thanh toán (FEST) - 18 decimals         │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│     FestiveTicketsFactory                       │
│  Factory tạo NFT + Marketplace cho mỗi event    │
└─────────────────────────────────────────────────┘
           │                        │
           ▼                        ▼
┌────────────────────┐   ┌────────────────────────┐
│  FestivalNFT       │   │ FestivalMarketplace    │
│  (ERC721)          │◄─►│  Primary + Secondary   │
│                    │   │  Sales Marketplace     │
│  • Event Status    │   │                        │
│  • QR Verify       │   │  • Batch Purchase      │
│  • Gift Transfer   │   │  • Royalty System      │
│  • Batch Minting   │   │  • Fee Calculation     │
└────────────────────┘   └────────────────────────┘
```

### Frontend Stack

```
React 18 + TypeScript + Vite
├── Wagmi v2 - Web3 wallet integration
├── RainbowKit - Beautiful wallet UI
├── TanStack Query - Data fetching & caching
├── Tailwind CSS - Utility-first styling
├── QRCode - Generate ticket QR codes
└── React Hot Toast - Notifications
```

---

## 🚀 Quick Start

### Yêu Cầu Hệ Thống

- **Node.js** 18+
- **npm** or **yarn**
- **MetaMask** browser extension
- **Git**

### Bước 1: Clone & Install

```bash
# Clone repository
git clone https://github.com/duongbill/BC_ban_ve.git
cd BC_ban_ve

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
REPORT_GAS=true npx hardhat test

# Test một file cụ thể
npx hardhat test test/FestivalMarketplace.test.js
```

### 3. Khởi động Hardhat Network (Local Blockchain)

Mở terminal mới và chạy:

```bash
npx hardhat node
```

Terminal này sẽ chạy local blockchain với 20 accounts có sẵn ETH để test.

### 4. Deploy Smart Contracts lên Local Network

Mở terminal thứ 2 và chạy:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Sau khi deploy xong, địa chỉ contracts sẽ được lưu vào `deployedAddresses.json`.

### 5. Cấu hình MetaMask cho Local Network

1. Mở MetaMask
2. Thêm network mới với thông tin:

   - **Network Name**: `Hardhat Local` (hoặc tên bất kỳ)
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337` ⚠️ **QUAN TRỌNG: Phải là 31337, không phải 1337**
   - **Currency Symbol**: `ETH`

3. Import account để test:

   - **Account #1** (Organiser - có FEST tokens):
     - Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
     - Private key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
     - **✅ Dùng account này để mua vé** (có 10,000 FEST tokens)
   - **Account #0** (Deployer):
     - Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
     - Private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - MetaMask → Import Account → Paste private key

4. Thêm FEST Token vào MetaMask:
   - Click "Import tokens" trong MetaMask
   - Token Contract Address: Lấy từ `deployedAddresses.json` → `FestToken`
   - Token Symbol: `FEST`
   - Token Decimal: `18`
   - Account #1 sẽ hiển thị 10,000 FEST

### 6. Khởi động Frontend

Mở terminal thứ 3:

```bash
cd frontend
npm run dev
```

Truy cập: `http://localhost:5173`

### 7. Test Flow mua vé

1. **Kết nối ví**:

   - Click "Kết nối ví" và chọn MetaMask
   - Chọn Account #1 (`0x70997970...C8`) - account có FEST tokens
   - Đảm bảo network là "Hardhat Local" (Chain ID 31337)

2. **Xem danh sách sự kiện**:

   - HomePage hiển thị "Summer Music Fest"

3. **Xem chi tiết**:

   - Click vào festival card

4. **Mua vé sơ cấp**:

   - Click "Mua vé sơ cấp"
   - Chọn loại vé: VIP (100 FEST), Standard (50 FEST), Early Bird (40 FEST), hoặc Student (35 FEST)
   - Click "Mua vé"
   - **Xác nhận 2 transactions trong MetaMask**:
     - Transaction 1: Approve FEST tokens cho marketplace
     - Transaction 2: Mua vé từ organiser
   - Đợi confirmation (~2-3 giây cho mỗi transaction)
   - Thấy toast "🎉 Vé đã được mua thành công!"

5. **Kiểm tra vé đã mua**:
   - Vào trang "Vé của tôi"
   - Xem NFT ticket vừa mua (fetch trực tiếp từ blockchain)
   - Tạo QR code cho vé
   - Có thể resell hoặc gift vé

> **Lưu ý**: Danh sách festivals trên HomePage hiện dùng mock data. Vé đã mua trên MyTicketsPage được fetch từ blockchain thực tế thông qua hook `useMyTickets()`.

### 8. Debug & Troubleshooting

**Nếu gặp lỗi "ERR_CONNECTION_REFUSED":**

```bash
# Hardhat node không chạy
# Mở terminal và start lại:
npx hardhat node
```

**Nếu gặp lỗi "returned no data (0x)":**

```bash
# Contracts chưa deploy hoặc node bị reset
# Deploy lại contracts:
npx hardhat run scripts/deploy.js --network localhost
node scripts/update-env.js

# Sau đó restart frontend để load .env mới
cd frontend
npm run dev
```

**Nếu MetaMask báo "Internal JSON-RPC error" khi approve:**

- Kiểm tra Chain ID = 31337 (không phải 1337)
- Kiểm tra account có đủ FEST tokens (10,000 FEST)
- Restart MetaMask và refresh trang

**Reset local blockchain nếu cần:**

```bash
# Ctrl+C để dừng hardhat node
# Chạy lại với --reset:
npx hardhat node --reset

# Deploy lại contracts
npx hardhat run scripts/deploy.js --network localhost
node scripts/update-env.js
```

**Xem console logs:**

- Mở DevTools (F12) trong browser
- Tab Console sẽ hiển thị debug info khi mua vé

## 🎯 Tính năng chính

### Tính năng Smart Contract

- **ERC20 Token (FEST)**: Tiền tệ của sàn giao dịch
- **ERC721 NFTs**: Vé sự kiện với metadata
- **Kiểm soát giá**: Giá bán lại tối đa 110%
- **Hệ thống hoa hồng**: Phí sàn 10%
- **Kiểm soát truy cập**: Quyền dựa trên vai trò
- **Bảo mật**: ReentrancyGuard, Pausable, Ownable

### Tính năng Frontend

- **Tích hợp Web3**: Kết nối với MetaMask qua RainbowKit
- **Wagmi v2**: React hooks cho blockchain interactions
- **EIP-712 Signing**: Ký xác nhận tham gia sự kiện với metadata rõ ràng trong MetaMask
- **Event-Specific Metadata**: Mỗi transaction chứa đầy đủ thông tin sự kiện
- **Mock IPFS**: Local testing không cần API key
- **Mock Data**: Dữ liệu demo cho festivals và tickets (có thể thay bằng API thật)
- **Blockchain Query**: Vé đã mua được fetch trực tiếp từ smart contract
- **Thiết kế responsive**: Giao diện mobile-first với Tailwind CSS
- **Cập nhật realtime**: Tích hợp TanStack React Query
- **Ticket Selection UI**: Chọn loại vé từ 4 options có sẵn (VIP, Standard, Early Bird, Student)
- **Balance Check**: Tự động kiểm tra số dư FEST trước khi mua
- **Transaction Waiting**: Đợi transaction confirmation thực sự thay vì timeout

## 📝 Hướng dẫn sử dụng

### Tạo sự kiện

1. Kết nối ví của bạn
2. Click "Tạo sự kiện"
3. Điền thông tin sự kiện
4. Deploy NFT + Marketplace contracts

### Mua vé sơ cấp

1. Kết nối MetaMask với Account #1 (có FEST tokens)
2. Vào trang festival detail
3. Click "Mua vé sơ cấp"
4. Chọn loại vé: VIP (100 FEST), Standard (50 FEST), Early Bird (40 FEST), hoặc Student (35 FEST)
5. Hook `useBuyTicket` sẽ:
   - Check balance (đảm bảo đủ FEST)
   - Upload metadata lên IPFS (mock mode)
   - Approve FEST tokens cho marketplace (transaction 1)
   - Đợi approve confirmation
   - Mua vé từ organiser (transaction 2)
   - Đợi buy confirmation
6. Xác nhận cả 2 transactions trong MetaMask
7. NFT ticket sẽ được mint cho buyer

### Thị trường thứ cấp

1. Đăng vé để bán (≤ 110% giá gốc)
2. Duyệt vé thứ cấp có sẵn
3. Mua vé với hoa hồng tự động (phí sàn 10%)

## 🔑 Thông tin quan trọng

### Local Development Addresses

**Hardhat Accounts (có sẵn sau khi chạy `npx hardhat node`):**

- Account #0 (Deployer): `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Account #1 (Organiser): `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` ⭐ **Dùng account này để test**

**Contract Addresses** (thay đổi sau mỗi lần deploy):

- Xem file `deployedAddresses.json` sau khi deploy
- Hoặc xem output của `npx hardhat run scripts/deploy.js`

**Network Config:**

- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337` (Hardhat default)
- Currency: ETH

### Token Information

**FEST Token (ERC20):**

- Decimals: 18
- Initial Supply: Minted theo deploy script
- Account #0: 10,000 FEST
- Account #1: 10,000 FEST (organiser)

**Ticket Types:**

- VIP: 100 FEST
- Standard: 50 FEST
- Early Bird: 40 FEST
- Student: 35 FEST

## 🔧 Phát triển

### Cấu trúc Smart Contract

```
contracts/
├── FestToken.sol          # ERC20 token sàn giao dịch
├── FestivalNFT.sol        # ERC721 vé sự kiện
├── FestivalMarketplace.sol # Logic giao dịch
└── FestiveTicketsFactory.sol # Deploy sự kiện
```

### Cấu trúc Backend (Tùy chọn)

```
backend/
├── src/
│   ├── controllers/      # API controllers
│   ├── services/         # Business logic
│   ├── routes/          # API routes
│   ├── models/          # Database models
│   ├── middleware/      # Express middleware
│   └── utils/           # Helper functions
├── config/              # Configuration files
├── tests/               # API tests
└── package.json
```

### Cấu trúc Frontend

```
src/
├── components/            # UI components tái sử dụng
├── config/               # Cấu hình Web3
├── hooks/                # Custom React hooks
├── pages/                # Route components
├── services/             # Dịch vụ bên ngoài (IPFS)
├── types/                # Định nghĩa TypeScript
└── main.tsx              # Entry point
```

### Hooks chính

- `useBiconomyAccount`: Quản lý smart account
- `useFestivalMutations`: Tương tác blockchain
- `useCreateFestival`: Deploy sự kiện
- `useBuyTicket`: Mua vé
- `useListTicketForSale`: Đăng bán vé thứ cấp

## 🛠️ Technology Stack

### Blockchain

- **Solidity ^0.8.20**: Smart contract language
- **OpenZeppelin v5**: Security standards
- **Hardhat**: Development framework

### Frontend

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **Vite**: Build tool

### Web3 Integration

- **Wagmi**: React hooks for Ethereum
- **RainbowKit**: Wallet connection UI
- **Viem**: TypeScript Ethereum library
- **Biconomy**: Account abstraction

### Data & State

- **TanStack Query**: Server state management
- **NFT.Storage**: IPFS pinning service
- **React Hot Toast**: Notifications

## 🔐 Tính năng bảo mật

- **ReentrancyGuard**: Ngăn chặn tấn công reentrancy
- **Pausable**: Chức năng tạm dừng khẩn cấp
- **Access Control**: Phân quyền dựa trên vai trò
- **Price Validation**: Ngăn đẩy giá quá mức
- **Commission Protection**: Đảm bảo phí sàn giao dịch

## 🧪 Testing Guide

### Quick Test (Khuyến nghị)

**Cách nhanh nhất để test toàn bộ dự án:**

```bash
# Terminal 1: Khởi động Hardhat Network
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: Khởi động frontend
cd frontend
npm run dev
```

Sau đó:

1. Cấu hình MetaMask (xem mục 5 ở trên)
2. Truy cập `http://localhost:5173`
3. Connect wallet và test các tính năng

### Smart Contract Testing

```bash
# Test tất cả contracts
npx hardhat test

# Test với báo cáo gas
REPORT_GAS=true npx hardhat test

# Test một file cụ thể
npx hardhat test test/FestivalMarketplace.test.js

# Test với coverage
npx hardhat coverage
```

### Frontend Manual Testing Checklist

- [ ] Connect wallet thành công
- [ ] Hiển thị danh sách sự kiện
- [ ] Navigation hoạt động (Home, Tạo sự kiện, Vé của tôi)
- [ ] Search bar hoạt động
- [ ] Hero carousel tự động chuyển slide
- [ ] Hover vào festival card hiển thị buttons
- [ ] Click "Xem Chi tiết" navigate đến festival page
- [ ] Responsive trên mobile
- [ ] Dark theme hiển thị đúng

### Common Issues

**Lỗi: "Cannot connect to network"**

- Kiểm tra Hardhat node đang chạy
- Đảm bảo MetaMask đang ở network Hardhat Local (Chain ID 31337)

**Lỗi: "Nonce too high"**

- MetaMask → Settings → Advanced → Clear activity tab data

**Lỗi: "Contract not deployed"**

- Chạy lại deploy script
- Kiểm tra file `deployedAddresses.json` có tồn tại

**Frontend không load contracts**

- Kiểm tra file `artifacts/contracts/` đã được generate
- Restart frontend dev server

## 🚀 Triển khai

### Triển khai Testnet

```bash
# Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

### Triển khai Mainnet

```bash
# Polygon mainnet
npx hardhat run scripts/deploy.js --network polygon
```

## 📊 Tối ưu Gas

- **Giao dịch hàng loạt**: Biconomy User Operations
- **Lưu trữ hiệu quả**: Packed structs
- **Giảm thiểu external calls**: Giảm chi phí gas
- **OpenZeppelin**: Contracts đã được audit và tối ưu

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch
3. Thực hiện thay đổi
4. Thêm tests
5. Gửi pull request

## 📄 License

MIT License - see LICENSE file

## 🔗 Links

- [OpenZeppelin](https://openzeppelin.com/)
- [Hardhat](https://hardhat.org/)
- [React](https://reactjs.org/)
- [Wagmi](https://wagmi.sh/)
- [RainbowKit](https://www.rainbowkit.com/)
- [Biconomy](https://biconomy.io/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 🔌 Backend APIs (Tùy chọn)

> **Lưu ý**: Hiện tại project sử dụng **mock data + blockchain queries** để hoạt động độc lập. Backend APIs dưới đây là thiết kế cho tương lai nếu muốn mở rộng với database và indexer service.

### 🎯 Tổng quan Backend

Backend service giúp:

- **Index blockchain events** → Lưu vào database để query nhanh
- **Cache dữ liệu** → Giảm RPC calls đến blockchain
- **Quản lý metadata** → Upload/serve IPFS content
- **Analytics** → Thống kê giao dịch, doanh thu
- **Search & Filter** → Tìm kiếm sự kiện, vé

### 📡 API Categories

#### 1. Festival APIs

```
GET    /api/festivals
GET    /api/festivals/:nftContract
GET    /api/festivals/:nftContract/tickets
POST   /api/festivals (Admin only)
```

**Response Example:**

```json
{
  "nftContract": "0x1234...",
  "name": "Summer Music Fest",
  "organizer": "0xabcd...",
  "eventDate": 1735689600000,
  "location": "Hanoi",
  "status": "Active",
  "totalTickets": 1000,
  "soldTickets": 450,
  "imageUrl": "ipfs://Qm..."
}
```

#### 2. Ticket APIs

```
GET    /api/tickets/:nftContract/:tokenId
GET    /api/users/:address/tickets
GET    /api/tickets/:nftContract/:tokenId/history
```

**Response Example:**

```json
{
  "tokenId": 42,
  "nftContract": "0x1234...",
  "owner": "0xabcd...",
  "ticketType": "VIP",
  "price": "100000000000000000000",
  "isUsed": false,
  "purchasedAt": 1735000000000,
  "qrCode": "data:image/png;base64,..."
}
```

#### 3. Transaction APIs

```
GET    /api/transactions/:nftContract
GET    /api/transactions/user/:address
GET    /api/transactions/:txHash
```

**Response Example:**

```json
{
  "txHash": "0xabcd...",
  "type": "PrimaryPurchase",
  "buyer": "0x1234...",
  "seller": "0x5678...",
  "tokenId": 42,
  "price": "100000000000000000000",
  "timestamp": 1735000000000
}
```

#### 4. Analytics APIs

```
GET    /api/analytics/marketplace
GET    /api/analytics/festival/:nftContract
GET    /api/analytics/user/:address
```

**Response Example:**

```json
{
  "totalRevenue": "50000000000000000000000",
  "totalTransactions": 1250,
  "averageTicketPrice": "40000000000000000000",
  "topFestivals": [...],
  "revenueByDay": [...]
}
```

#### 5. Search APIs

```
GET    /api/search/festivals?q=music&status=Active
GET    /api/search/tickets?minPrice=50&maxPrice=100
```

#### 6. IPFS APIs

```
POST   /api/ipfs/upload
GET    /api/metadata/:ipfsHash
```

#### 7. User Profile APIs

```
GET    /api/users/:address/profile
GET    /api/users/:address/stats
```

#### 8. Webhook & Notifications

```
POST   /api/webhooks/blockchain (Internal)
GET    /api/notifications/:address
```

### 🛠️ Tech Stack đề xuất

**Backend Framework:**

- Node.js + Express.js
- TypeScript
- PostgreSQL / MongoDB
- Redis (caching)

**Blockchain Indexer:**

- Ethers.js / Viem
- Event listeners cho contracts
- Queue system (Bull/Redis)

**Infrastructure:**

- Docker + Docker Compose
- Nginx reverse proxy
- PM2 process manager

### 📊 Database Schema (PostgreSQL)

```sql
-- Festivals table
CREATE TABLE festivals (
  id SERIAL PRIMARY KEY,
  nft_contract VARCHAR(42) UNIQUE NOT NULL,
  marketplace_contract VARCHAR(42),
  name VARCHAR(255),
  organizer VARCHAR(42),
  event_date TIMESTAMP,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tickets table
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  nft_contract VARCHAR(42),
  token_id INTEGER,
  owner VARCHAR(42),
  ticket_type VARCHAR(50),
  price NUMERIC(78, 0),
  is_used BOOLEAN DEFAULT false,
  purchased_at TIMESTAMP,
  UNIQUE(nft_contract, token_id)
);

-- Transactions table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  tx_hash VARCHAR(66) UNIQUE,
  nft_contract VARCHAR(42),
  token_id INTEGER,
  type VARCHAR(30),
  buyer VARCHAR(42),
  seller VARCHAR(42),
  price NUMERIC(78, 0),
  timestamp TIMESTAMP
);
```

### 🚀 Quick Start Backend (Nếu cần)

```bash
# Tạo backend directory
mkdir backend
cd backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express cors dotenv ethers pg redis
npm install -D typescript @types/node @types/express ts-node nodemon

# Xem file backend/README.md để biết thêm chi tiết
```

> **Khuyến nghị**: Bắt đầu với mock data và blockchain queries như hiện tại. Chỉ implement backend khi cần scale hoặc cần tính năng analytics phức tạp.

---

## 🆘 Hỗ trợ

Để được hỗ trợ, vui lòng mở issue hoặc liên hệ team phát triển.

**Team phát triển:**

- Nguyễn Hải Dương
- Phạm Ngọc Khánh Duy
- Vũ Hoàng Anh

---

# BC_ban_ve
