# Festival Marketplace 2.0

Ứng dụng phi tập trung (dApp) cho sàn giao dịch vé sự kiện âm nhạc, được xây dựng bằng Solidity smart contracts, React, TypeScript và các công nghệ Web3 tiên tiến.

## 🏗️ Kiến trúc

### Smart Contracts

- **FestToken (ERC20)**: Token gốc cho sàn giao dịch
- **FestivalNFT (ERC721)**: NFT vé sự kiện với giới hạn bán lại
- **FestivalMarketplace**: Giao dịch vé sơ cấp và thứ cấp
- **FestiveTicketsFactory**: Tạo các instance sự kiện

### Frontend Stack

- **React 18** with TypeScript
- **Vite** cho phát triển nhanh
- **Tailwind CSS** cho styling
- **Wagmi + RainbowKit** cho tích hợp Web3
- **Biconomy SDK** cho giao dịch không phí gas
- **TanStack Query** cho quản lý state
- **IPFS** cho lưu trữ metadata

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Hardhat
- MetaMask hoặc ví tương thích

### 1. Cài đặt Dependencies

```bash
# Cài đặt smart contract dependencies (ở thư mục gốc)
npm install

# Cài đặt frontend dependencies
cd frontend
npm install
```

### 2. Test Smart Contracts

```bash
# Chạy test suite (từ thư mục gốc)
npx hardhat test

# Xem chi tiết gas usage
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

   - **Network Name**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: ETH

3. Import account để test:
   - Copy private key từ terminal Hardhat node (Account #0, #1, v.v.)
   - MetaMask → Import Account → Paste private key

### 6. Khởi động Frontend

Mở terminal thứ 3:

```bash
cd frontend
npm run dev
```

Truy cập: `http://localhost:5173`

### 7. Test Flow đầy đủ

1. **Kết nối ví**: Click "Kết nối ví" và chọn MetaMask
2. **Xem danh sách sự kiện**: HomePage hiển thị các sự kiện mẫu
3. **Xem chi tiết**: Click vào poster sự kiện
4. **Mua vé**: Test chức năng mua vé (nếu đã implement)
5. **Kiểm tra giao dịch**: Xem transactions trong MetaMask

### 8. Debug & Troubleshooting

```bash
# Xem logs của Hardhat node
# (Terminal đang chạy npx hardhat node)

# Reset local blockchain nếu cần
# Ctrl+C để dừng hardhat node, sau đó chạy lại:
npx hardhat node --reset

# Xem console logs của frontend
# Mở DevTools (F12) trong browser
```

## 🎯 Tính năng chính

### Tính năng Smart Contract

- **ERC20 Token (FEST)**: Tiền tệ của sàn giao dịch
- **ERC721 NFTs**: Vé sự kiện với metadata
- **Kiểm soát giá**: Giá bán lại tối đa 110%
- **Hệ thống hoa hồng**: Phí sàn 10%
- **Kiểm soát truy cập**: Quyền dựa trên vai trò
- **Bảo mật**: ReentrancyGuard, Pausable, Ownable

### Tính năng Frontend

- **Tích hợp Web3**: Kết nối với MetaMask/WalletConnect
- **Giao dịch không phí gas**: Biconomy Smart Accounts
- **Lưu trữ IPFS**: Lưu metadata phi tập trung
- **Thiết kế responsive**: Giao diện mobile-first
- **Cập nhật realtime**: Tích hợp React Query

## 📝 Hướng dẫn sử dụng

### Tạo sự kiện

1. Kết nối ví của bạn
2. Click "Tạo sự kiện"
3. Điền thông tin sự kiện
4. Deploy NFT + Marketplace contracts

### Mua vé sơ cấp

1. Duyệt danh sách sự kiện
2. Click "Mua vé"
3. Upload ảnh vé và metadata
4. Xác nhận giao dịch không phí gas

### Thị trường thứ cấp

1. Đăng vé để bán (≤ 110% giá gốc)
2. Duyệt vé thứ cấp có sẵn
3. Mua vé với hoa hồng tự động

### Lợi ích Smart Account

- **Không phí gas**: Biconomy trả phí gas
- **Giao dịch hàng loạt**: Approve + Mua trong một thao tác
- **Trải nghiệm tốt**: Không lo phí gas

## 🔧 Phát triển

### Cấu trúc Smart Contract

```
contracts/
├── FestToken.sol          # ERC20 token sàn giao dịch
├── FestivalNFT.sol        # ERC721 vé sự kiện
├── FestivalMarketplace.sol # Logic giao dịch
└── FestiveTicketsFactory.sol # Deploy sự kiện
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

## 🆘 Hỗ trợ

Để được hỗ trợ, vui lòng mở issue hoặc liên hệ team phát triển.

**Team phát triển:**

- Nguyễn Hải Dương
- Phạm Ngọc Khánh Duy
- Vũ Hoàng Anh

---
# BC_ban_ve
