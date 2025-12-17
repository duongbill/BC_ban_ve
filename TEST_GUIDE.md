# 🧪 Testing Secondary Market Control Features

## Tổng Quan

Hệ thống test kiểm tra các tính năng kiểm soát thị trường chuyển nhượng:

- ✅ Giới hạn vé mỗi ví (Anti-Scalping)
- ✅ Áp trần giá bán lại (Price Ceiling)
- ✅ Phân phối royalty tự động
- ✅ Cập nhật cấu hình

## 🚀 Cách Chạy Tests

### Option 1: Test Tự Động (Hardhat Tests)

Chạy toàn bộ test suite:

```bash
npx hardhat test test/SecondaryMarketControl.test.js
```

Hoặc sử dụng script wrapper:

```bash
node scripts/test-secondary-market.js
```

### Option 2: Test Thủ Công (Manual Test Script)

Test thủ công với output chi tiết:

```bash
npx hardhat run scripts/manual-test-secondary-market.js --network localhost
```

**Lưu ý:** Cần chạy local node trước:

```bash
# Terminal 1
npx hardhat node

# Terminal 2 (sau khi node đã chạy)
npx hardhat run scripts/manual-test-secondary-market.js --network localhost
```

## 📋 Test Cases

### 1. Anti-Scalping Tests

#### Test 1.1: Enforce Max Tickets Per Wallet

```javascript
// Kiểm tra giới hạn 5 vé/ví được thiết lập đúng
expect(await festivalNFT.maxTicketsPerWallet()).to.equal(5);
```

#### Test 1.2: Allow Minting Up To Limit

```javascript
// Mint 5 vé (đúng giới hạn) - PASS
for (let i = 0; i < 5; i++) {
  await festivalNFT.mintTicket(buyer, `ipfs://ticket${i}`, TICKET_PRICE);
}
expect(await festivalNFT.balanceOf(buyer)).to.equal(5);
```

#### Test 1.3: Prevent Minting Beyond Limit

```javascript
// Mint vé thứ 6 - FAIL
await expect(
  festivalNFT.mintTicket(buyer, "ipfs://ticket6", TICKET_PRICE)
).to.be.revertedWith("Wallet ticket limit reached");
```

#### Test 1.4: Batch Minting Enforcement

```javascript
// Batch mint 6 vé cùng lúc - FAIL
const tokenURIs = Array.from({ length: 6 }, (_, i) => `ipfs://ticket${i}`);
await expect(
  festivalNFT.batchMintTickets(buyer, tokenURIs, TICKET_PRICE)
).to.be.revertedWith("Batch would exceed wallet ticket limit");
```

#### Test 1.5: Update Max Tickets Per Wallet

```javascript
// Admin cập nhật giới hạn từ 5 lên 10
await festivalNFT.setMaxTicketsPerWallet(10);
expect(await festivalNFT.maxTicketsPerWallet()).to.equal(10);
```

#### Test 1.6: Unlimited When Set To Zero

```javascript
// Đặt giới hạn = 0 → không giới hạn
await festivalNFT.setMaxTicketsPerWallet(0);
// Có thể mint > 5 vé
```

### 2. Price Ceiling Tests

#### Test 2.1: Enforce Max Resale Percentage

```javascript
// Kiểm tra giới hạn 110% được thiết lập đúng
expect(await festivalNFT.maxResalePercentage()).to.equal(110);
```

#### Test 2.2: Allow Listing At Ceiling

```javascript
// List vé đúng 110% giá gốc - PASS
const maxPrice = (TICKET_PRICE * 110n) / 100n; // 110 FEST
await festivalNFT.setTicketForSale(tokenId, maxPrice);
```

#### Test 2.3: Prevent Listing Above Ceiling

```javascript
// List vé > 110% - FAIL
const overPrice = (TICKET_PRICE * 111n) / 100n; // 111 FEST
await expect(
  festivalNFT.setTicketForSale(tokenId, overPrice)
).to.be.revertedWith("Price exceeds resale limit");
```

#### Test 2.4: Calculate Max Resale Price

```javascript
// Tính giá tối đa được phép
const maxPrice = await festivalNFT.getMaxResalePrice(tokenId);
expect(maxPrice).to.equal((TICKET_PRICE * 110n) / 100n);
```

#### Test 2.5: Update Max Resale Percentage

```javascript
// Admin cập nhật từ 110% lên 120%
await festivalNFT.setMaxResalePercentage(120);
expect(await festivalNFT.maxResalePercentage()).to.equal(120);
```

### 3. Royalty Distribution Tests

#### Test 3.1: Correct Distribution On Resale

```javascript
// Vé gốc: 100 FEST, bán lại: 110 FEST
// Kết quả:
// - Người bán: 93.5 FEST (85%)
// - BTC (organiser): 5.5 FEST (5%)
// - Marketplace: 11 FEST (10%)
```

#### Test 3.2: Emit RoyaltyPaid Event

```javascript
await expect(marketplace.buyFromCustomer(...))
  .to.emit(marketplace, "RoyaltyPaid")
  .withArgs(nftAddress, organiser, expectedRoyalty);
```

#### Test 3.3: Calculate Resale Fees

```javascript
const [commission, royalty, sellerAmount] =
  await marketplace.calculateResaleFees(resalePrice);

expect(commission).to.equal(ethers.parseEther("11")); // 10%
expect(royalty).to.equal(ethers.parseEther("5.5")); // 5%
expect(sellerAmount).to.equal(ethers.parseEther("93.5")); // 85%
```

### 4. Integration Tests

#### Test 4.1: Complete Ticket Lifecycle

```javascript
// 1. Mint vé với giới hạn
// 2. Kiểm tra không thể mint quá giới hạn
// 3. List vé với giá hợp lệ
// 4. Kiểm tra không thể list quá giá trần
// 5. Bán lại và verify phân phối tiền
// 6. Verify chuyển ownership
```

#### Test 4.2: Prevent Scalping Across Wallets

```javascript
// Mỗi buyer chỉ được 5 vé
// Kiểm tra với 3 buyers khác nhau
// Tổng: 15 vé phân phối đều
```

#### Test 4.3: Price Ceiling After Transfer

```javascript
// Vé được bán lại vẫn giữ nguyên giá gốc làm cơ sở
// Buyer2 không thể bán > 110% giá gốc ban đầu
```

### 5. Edge Cases Tests

#### Test 5.1: Max Tickets = 1

```javascript
// Giới hạn cực tiểu: 1 vé/ví
await festivalNFT.setMaxTicketsPerWallet(1);
// Chỉ được mint 1 vé
```

#### Test 5.2: Max Resale = 100% (No Profit)

```javascript
// Không cho phép lợi nhuận
await festivalNFT.setMaxResalePercentage(100);
// Chỉ được bán đúng giá gốc
```

#### Test 5.3: Very High Percentage

```javascript
// Test với % rất cao
await festivalNFT.setMaxResalePercentage(1000); // 10x
// Vẫn hoạt động bình thường
```

## 📊 Expected Output

### Successful Test Run:

```
  Secondary Market Control
    1. Anti-Scalping: Max Tickets Per Wallet
      ✔ Should enforce maxTicketsPerWallet limit (156ms)
      ✔ Should allow minting up to the limit (1234ms)
      ✔ Should prevent minting beyond the limit (89ms)
      ✔ Should enforce limit on batch minting (78ms)
      ✔ Should allow batch minting within limit (567ms)
      ✔ Should allow admin to update maxTicketsPerWallet (234ms)
      ✔ Should emit MaxTicketsPerWalletUpdated event (67ms)
      ✔ Should allow unlimited tickets when set to 0 (890ms)
      ✔ Should prevent non-admin from updating limit (45ms)

    2. Price Ceiling: Max Resale Percentage
      ✔ Should enforce maxResalePercentage limit (34ms)
      ✔ Should allow listing at exactly the price ceiling (123ms)
      ✔ Should prevent listing above price ceiling (56ms)
      ✔ Should calculate max resale price correctly (23ms)
      ✔ Should allow admin to update maxResalePercentage (178ms)
      ✔ Should emit MaxResalePercentageUpdated event (45ms)
      ✔ Should reject percentage below 100% (34ms)
      ✔ Should prevent non-admin from updating percentage (28ms)

    3. Royalty Distribution
      ✔ Should distribute royalty correctly on resale (456ms)
      ✔ Should emit RoyaltyPaid event (234ms)
      ✔ Should calculate resale fees correctly (45ms)
      ✔ Should transfer NFT ownership after resale (234ms)
      ✔ Should remove ticket from sale after purchase (123ms)

    4. Integration Tests
      ✔ Should handle complete ticket lifecycle with limits (1890ms)
      ✔ Should prevent scalping across multiple wallets (2345ms)
      ✔ Should maintain price ceiling after ownership transfer (567ms)

    5. Edge Cases
      ✔ Should handle maxTicketsPerWallet = 1 (123ms)
      ✔ Should handle maxResalePercentage = 100 (234ms)
      ✔ Should handle very high maxResalePercentage (178ms)

  30 passing (15s)
```

### Manual Test Output:

```
🎭 Testing Secondary Market Control Features

======================================================================
📝 Accounts:
  Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  Organiser: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  Buyer 1: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
  Buyer 2: 0x90F79bf6EB2c4f870365E785982E1f101E93b906

🪙 Deploying FestToken...
  ✅ FestToken deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3

🎫 Deploying FestivalNFT with controls:
  - Max Tickets Per Wallet: 5
  - Max Resale Percentage: 110%
  ✅ FestivalNFT deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

🏪 Deploying Marketplace...
  ✅ Marketplace deployed at: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

======================================================================

📋 TEST 1: Max Tickets Per Wallet
----------------------------------------------------------------------
  Minting 5 tickets to buyer1 (at limit)...
    ✅ Ticket 1 minted
    ✅ Ticket 2 minted
    ✅ Ticket 3 minted
    ✅ Ticket 4 minted
    ✅ Ticket 5 minted
  📊 Buyer1 balance: 5 tickets

  Attempting to mint 6th ticket (should fail)...
    ✅ Correctly rejected: Wallet ticket limit reached

======================================================================

📋 TEST 2: Price Ceiling (Max Resale Percentage)
----------------------------------------------------------------------
  Max resale percentage: 110%
  Ticket price: 100.0 FEST
  Max resale price: 110.0 FEST

  Attempting to list ticket at max price (110 FEST)...
    ✅ Successfully listed at max price
    📊 Selling price: 110.0 FEST

  Attempting to list above ceiling (111 FEST, should fail)...
    ✅ Correctly rejected: Price exceeds resale limit

======================================================================

📋 TEST 3: Royalty Distribution on Resale
----------------------------------------------------------------------
  Ticket 1 listed for 110.0 FEST

  Balances before resale:
    Organiser: 100.0 FEST
    Seller (buyer1): 400.0 FEST
    Marketplace owner: 1000.0 FEST

  Buyer2 purchasing from buyer1...

  Balances after resale:
    Organiser gained: 5.5 FEST (5% royalty)
    Seller gained: 93.5 FEST (85%)
    Marketplace gained: 11.0 FEST (10% commission)

  Verification:
    Expected royalty: 5.5 FEST
    Expected commission: 11.0 FEST
    Expected seller: 93.5 FEST
    ✅ All distributions correct!

  New ticket owner: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
  ✅ Ownership transferred correctly

======================================================================

🎉 All manual tests completed!
======================================================================

📊 Summary:
  ✅ Anti-scalping (max tickets per wallet) - WORKING
  ✅ Price ceiling (max resale percentage) - WORKING
  ✅ Automatic royalty distribution - WORKING
  ✅ Admin configuration updates - WORKING
```

## 🐛 Troubleshooting

### Lỗi: "Wallet ticket limit reached"

- ✅ Đúng! Đây là tính năng hoạt động đúng
- Người dùng đã đạt giới hạn vé cho phép

### Lỗi: "Price exceeds resale limit"

- ✅ Đúng! Đây là tính năng hoạt động đúng
- Giá bán lại vượt quá % cho phép

### Lỗi: "Network is not running"

```bash
# Khởi động Hardhat node
npx hardhat node
```

### Lỗi: "Insufficient funds"

```bash
# Đảm bảo account có đủ token
# Check balance trong scripts/check-balance.js
```

## 📝 Notes

1. **Gas Costs:** Các transaction có thêm logic validation sẽ tốn nhiều gas hơn
2. **Event Logs:** Tất cả thay đổi cấu hình đều emit events để tracking
3. **Admin Only:** Chỉ organiser có thể cập nhật maxTicketsPerWallet và maxResalePercentage
4. **Immutable Purchase Price:** Giá mua gốc không thay đổi qua các lần chuyển nhượng

## 🚀 Next Steps

Sau khi tests pass:

1. Deploy to testnet:

   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

2. Verify contracts:

   ```bash
   npx hardhat verify <contract-address> --network sepolia
   ```

3. Update frontend với ABI mới

4. Test trên frontend UI
