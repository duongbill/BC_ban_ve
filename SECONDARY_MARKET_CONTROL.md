# Kiểm Soát Thị Trường Chuyển Nhượng (Secondary Market Control)

## 📋 Tổng Quan

Tài liệu này mô tả các tính năng mới được thêm vào để kiểm soát thị trường chuyển nhượng vé, giúp chống đầu cơ và bảo vệ người mua.

## 🎯 Các Tính Năng Chính

### 1. Giới Hạn Vé Mỗi Ví (Anti-Scalping)

**Mục đích:** Ngăn chặn đầu cơ mua nhiều vé

**Smart Contract:** `FestivalNFT.sol`

```solidity
uint256 public maxTicketsPerWallet;
```

**Cách hoạt động:**

- Khi tạo Festival, BTC có thể thiết lập số lượng vé tối đa mỗi ví có thể sở hữu
- Giá trị `0` = không giới hạn
- Giá trị `> 0` = giới hạn số lượng vé
- Kiểm tra tự động khi mint vé (cả đơn lẻ và batch)

**Code:**

```solidity
function mintTicket(...) external {
    if (maxTicketsPerWallet > 0) {
        require(balanceOf(to) < maxTicketsPerWallet, "Wallet ticket limit reached");
    }
    // ...mint logic
}
```

### 2. Áp Trần Giá Bán Lại (Resale Price Ceiling)

**Mục đích:** Ngăn "phe vé" đẩy giá lên quá cao

**Smart Contract:** `FestivalNFT.sol`

```solidity
uint256 public maxResalePercentage;
```

**Cách hoạt động:**

- BTC thiết lập phần trăm tối đa so với giá gốc (ví dụ: 110% = chỉ được bán lại cao hơn 10%)
- Kiểm tra tự động khi người dùng list vé để bán
- Không cho phép list vé vượt quá giá trần

**Code:**

```solidity
function setTicketForSale(uint256 tokenId, uint256 sellingPrice) external {
    uint256 purchasePrice = _ticketPurchasePrice[tokenId];
    uint256 maxAllowed = (purchasePrice * maxResalePercentage) / 100;
    require(sellingPrice <= maxAllowed, "Price exceeds resale limit");
    // ...
}
```

### 3. Hoa Hồng Tự Động (Automatic Royalties)

**Mục đích:** BTC nhận lại % doanh thu từ thị trường thứ cấp

**Smart Contract:** `FestivalMarketplace.sol`

```solidity
uint256 public constant ROYALTY_PERCENTAGE = 5; // 5% royalty
```

**Cách hoạt động:**

- Mỗi khi vé được bán lại trên thị trường thứ cấp:
  - Người bán nhận: 85%
  - BTC nhận (royalty): 5%
  - Marketplace nhận (commission): 10%
- Tự động chuyển khoản thông qua Smart Contract

**Ví dụ giao dịch:**

```
Vé giá gốc: 100 FEST
Bán lại: 110 FEST

Phân chia:
- Người bán: 93.5 FEST (85%)
- BTC: 5.5 FEST (5%)
- Marketplace: 11 FEST (10%)
```

## 🏗️ Thay Đổi Smart Contracts

### FestivalNFT.sol

**Constructor mới:**

```solidity
constructor(
    string memory name,
    string memory symbol,
    address admin,
    uint256 _maxTicketsPerWallet,    // MỚI
    uint256 _maxResalePercentage     // MỚI
)
```

**Functions mới:**

```solidity
// Cập nhật giới hạn vé mỗi ví
function setMaxTicketsPerWallet(uint256 newMax) external onlyRole(DEFAULT_ADMIN_ROLE)

// Cập nhật % tối đa bán lại
function setMaxResalePercentage(uint256 newPercentage) external onlyRole(DEFAULT_ADMIN_ROLE)

// Lấy giá tối đa được phép bán lại
function getMaxResalePrice(uint256 tokenId) external view returns (uint256)
```

**Events mới:**

```solidity
event MaxTicketsPerWalletUpdated(uint256 indexed oldMax, uint256 indexed newMax);
event MaxResalePercentageUpdated(uint256 indexed oldPercentage, uint256 indexed newPercentage);
```

### FestiveTicketsFactory.sol

**createFestival mới:**

```solidity
function createFestival(
    string memory name,
    string memory symbol,
    address organiser,
    uint256 maxTicketsPerWallet,     // MỚI
    uint256 maxResalePercentage      // MỚI
) external returns (address nftContract, address marketplaceContract)
```

## 💻 Thay Đổi Frontend

### Components Mới

**1. SecondaryMarketInfo.tsx**

- Component hiển thị thông tin về các chính sách kiểm soát
- Hiển thị giới hạn vé, áp trần giá, royalty %
- Ví dụ giao dịch và lợi ích

**2. CSS mới: secondary-market-info.css**

- Styling cho component SecondaryMarketInfo
- Responsive design
- Animations và effects

### Types Updates

```typescript
export interface Festival {
  // ... existing fields
  maxTicketsPerWallet?: number; // MỚI
  maxResalePercentage?: number; // MỚI
  royaltyPercentage?: number; // MỚI
}

export interface Ticket {
  // ... existing fields
  maxResalePrice?: string; // MỚI
}
```

### ResellTicketModal Updates

- Tự động tính giá tối đa dựa trên `maxResalePercentage`
- Hiển thị giá trần động thay vì hard-code 110%
- Validation giá bán theo giới hạn của Festival

## 📝 Hướng Dẫn Triển Khai

### Bước 1: Compile Smart Contracts

```bash
npx hardhat compile
```

### Bước 2: Update Deploy Script

Cập nhật `scripts/deploy.js` để truyền các tham số mới:

```javascript
// Ví dụ: Tạo festival với giới hạn 5 vé/ví, tối đa bán lại 110%
const tx = await factory.createFestival(
  "Đêm Nhạc Sài Gòn",
  "SGM",
  organiserAddress,
  5, // maxTicketsPerWallet
  110 // maxResalePercentage (110%)
);
```

### Bước 3: Test

```bash
npx hardhat test
```

### Bước 4: Deploy

```bash
npx hardhat run scripts/deploy.js --network <network-name>
```

### Bước 5: Frontend

```bash
cd frontend
npm run dev
```

## 🧪 Test Cases Cần Kiểm Tra

### Smart Contract Tests

1. **Anti-Scalping:**

   - ✅ Không cho phép mua vượt quá `maxTicketsPerWallet`
   - ✅ Cho phép mua khi `maxTicketsPerWallet = 0`
   - ✅ Batch mint kiểm tra tổng số vé

2. **Price Ceiling:**

   - ✅ Không cho phép list vé vượt giá trần
   - ✅ Cho phép list vé đúng giá trần
   - ✅ Admin có thể cập nhật `maxResalePercentage`

3. **Royalty:**
   - ✅ Phân chia đúng % khi bán lại
   - ✅ BTC nhận đúng số tiền royalty
   - ✅ Seller nhận đúng số tiền sau trừ phí

### Frontend Tests

1. **Display:**

   - ✅ Hiển thị đúng thông tin giới hạn
   - ✅ SecondaryMarketInfo component render đúng
   - ✅ ResellTicketModal tính giá trần đúng

2. **Validation:**
   - ✅ Không cho phép nhập giá vượt trần
   - ✅ Hiển thị cảnh báo khi giá quá cao
   - ✅ Disable button khi giá không hợp lệ

## 🎨 Giao Diện Người Dùng

### SecondaryMarketInfo Component

Hiển thị 4 thông tin chính:

1. 🚫 **Chống Đầu cơ:** Giới hạn vé/ví
2. 📊 **Áp Trần Giá:** Giá bán lại tối đa
3. 💰 **Hoa Hồng BTC:** % royalty
4. 🏪 **Phí Sàn:** Commission marketplace

### Resell Modal Enhancement

- Hiển thị giá gốc và giá trần
- Progress bar màu xanh/đỏ theo giá
- Tính toán lợi nhuận real-time
- Validation trước khi submit

## 🔒 Bảo Mật

1. **Access Control:**

   - Chỉ admin có thể cập nhật giới hạn
   - Marketplace phải có MINTER_ROLE để mint
   - Owner có thể emergency withdraw

2. **Validation:**

   - Kiểm tra giá trần mỗi lần list vé
   - Kiểm tra số lượng vé mỗi lần mint
   - ReentrancyGuard trên tất cả functions quan trọng

3. **Events:**
   - Log mọi thay đổi cấu hình
   - Track royalty payments
   - Monitor ticket transfers

## 📊 Lợi Ích

### Cho Người Hâm Mộ

- ✅ Giá vé công bằng, không bị thổi phồng
- ✅ Bảo vệ khỏi phe vé
- ✅ Minh bạch trong giao dịch

### Cho Ban Tổ Chức

- ✅ Thu nhập thêm từ thị trường thứ cấp
- ✅ Kiểm soát được giá vé
- ✅ Ngăn chặn đầu cơ hiệu quả

### Cho Hệ Thống

- ✅ Tăng tính tin cậy
- ✅ Tuân thủ quy định
- ✅ Tự động hóa hoàn toàn

## 🚀 Tính Năng Tương Lai

1. **KYC Integration:** Yêu cầu xác minh danh tính để mua vé
2. **Dynamic Pricing:** Điều chỉnh giá trần theo nhu cầu
3. **Whitelist:** Ưu tiên bán cho fan trung thành
4. **Transfer Cooldown:** Giới hạn thời gian chờ giữa các lần chuyển vé
5. **Analytics Dashboard:** Theo dõi thị trường thứ cấp real-time

## 📞 Hỗ Trợ

Nếu gặp vấn đề, vui lòng kiểm tra:

1. Smart contracts đã được compile và deploy đúng chưa
2. Frontend đã cập nhật ABI mới chưa
3. Deployed addresses đã được cập nhật chưa
4. Gas fees đủ để thực hiện transaction chưa

## 📚 Tài Liệu Tham Khảo

- [OpenZeppelin AccessControl](https://docs.openzeppelin.com/contracts/4.x/access-control)
- [ERC721 Standard](https://eips.ethereum.org/EIPS/eip-721)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Viem Documentation](https://viem.sh/)
