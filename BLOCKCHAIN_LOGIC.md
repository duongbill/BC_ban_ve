# 🔗 Blockchain Logic - Cách Vé Được Lưu Trữ

> **Giải thích chi tiết logic blockchain để hiểu cách vé được lưu và quản lý**

---

## 🎯 Điểm Quan Trọng Nhất

### ✅ **VÉ = NFT = LƯU VÀO BLOCKCHAIN VĨNH VIỄN**

Khi bạn mua vé:
1. Smart contract `FestivalNFT.sol` **mint một NFT token**
2. NFT này được **ghi vào blockchain** (block được mine)
3. Token **thuộc sở hữu của địa chỉ ví** của bạn
4. **Không ai có thể xóa hoặc sửa** - immutable

```
Blockchain = Database phân tán không thể thay đổi
    ↓
NFT Token ID #42 = Vé của bạn
    ↓
Owner = Địa chỉ ví 0xabcd...
    ↓
✅ TỒN TẠI VĨNH VIỄN
```

---

## 📝 Flow Chi Tiết: Mua Vé Như Thế Nào?

### **Step 1: User Click "Mua Vé"**

Frontend gọi hook `useBuyTicket`:

```typescript
// frontend/src/hooks/useFestivalMutations.ts
const { write: buyTicket } = useContractWrite({
  address: marketplaceContract,
  functionName: 'buyTicketFromOrganiser',
  args: [ticketType, 1], // Mua 1 vé loại VIP
});
```

### **Step 2: MetaMask Confirm Transaction**

```
User xác nhận 2 transactions:
┌─────────────────────────────────┐
│ Transaction 1: Approve FEST     │
│ Gas: ~50,000                    │
│ → Cho phép marketplace xài token│
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ Transaction 2: Buy Ticket       │
│ Gas: ~200,000                   │
│ → Gọi smart contract mint vé    │
└─────────────────────────────────┘
```

### **Step 3: Smart Contract Xử Lý**

```solidity
// contracts/FestivalMarketplace.sol
function buyTicketFromOrganiser(
    TicketType ticketType,
    uint256 quantity
) external nonReentrant whenNotPaused {
    
    // 1. Kiểm tra điều kiện
    require(quantity > 0, "Invalid quantity");
    uint256 totalPrice = ticketPrices[ticketType] * quantity;
    
    // 2. Chuyển FEST tokens từ buyer → marketplace
    require(
        festToken.transferFrom(msg.sender, address(this), totalPrice),
        "Payment failed"
    );
    
    // 3. MINT NFT VÉ - GHI VÀO BLOCKCHAIN
    for (uint256 i = 0; i < quantity; i++) {
        uint256 tokenId = festivalNFT.mintTicket(
            msg.sender,           // Owner = buyer
            ticketTypeString,     // "VIP"
            ticketPrices[ticketType]
        );
        
        // 4. Emit event (được indexer lắng nghe)
        emit TicketPurchased(
            msg.sender,
            organiser,
            tokenId,
            ticketPrices[ticketType],
            true  // isPrimary = true
        );
    }
}
```

### **Step 4: NFT Contract Mint Token**

```solidity
// contracts/FestivalNFT.sol
function mintTicket(
    address buyer,
    string memory ticketType,
    uint256 price
) external onlyMarketplace returns (uint256) {
    
    // 1. Tăng tokenId counter
    _tokenIdCounter++;
    uint256 newTokenId = _tokenIdCounter;
    
    // 2. MINT NFT - GHI VÀO BLOCKCHAIN
    _safeMint(buyer, newTokenId);  // ← VÉ ĐƯỢC TẠO Ở ĐÂY
    
    // 3. Lưu metadata
    _ticketTypes[newTokenId] = ticketType;
    _ticketPrices[newTokenId] = price;
    
    // 4. Emit event
    emit TicketMinted(buyer, newTokenId, ticketType);
    
    return newTokenId;
}
```

### **Step 5: Blockchain Ghi Nhận**

```
Block #12345 được mine:
┌────────────────────────────────────┐
│ Transaction Hash: 0xabcd1234...    │
│ From: 0x7099... (buyer)            │
│ To: 0xd805... (NFT contract)       │
│ Function: mintTicket()             │
│ Gas Used: 187,432                  │
│                                    │
│ ✅ NFT Token #42 CREATED           │
│    Owner: 0x7099...                │
│    Type: VIP                       │
│    Price: 100 FEST                 │
└────────────────────────────────────┘
         ↓
   LƯU VÀO BLOCKCHAIN VĨNH VIỄN
```

---

## 🔍 Làm Sao Frontend Hiển Thị Vé?

### **MyTicketsPage Query Blockchain**

```typescript
// frontend/src/hooks/useTicketManagement.ts
export function useMyTickets() {
  const { address } = useAccount();
  
  // 1. Query blockchain: Lấy tất cả tokenIds của user
  const { data: tokenIds } = useReadContract({
    address: nftContract,
    abi: NFT_ABI,
    functionName: 'tokensOfOwner',  // Hàm trong smart contract
    args: [address],
  });
  
  // 2. Query details của từng token
  const ticketsPromises = tokenIds?.map(async (tokenId) => {
    // Gọi smart contract view functions
    const type = await nftContract.read.getTicketType([tokenId]);
    const price = await nftContract.read.getTicketPrice([tokenId]);
    const isUsed = await nftContract.read.isTicketUsed([tokenId]);
    
    return {
      tokenId,
      type,
      price,
      isUsed,
      owner: address,
    };
  });
  
  return Promise.all(ticketsPromises);
}
```

### **Smart Contract View Function**

```solidity
// contracts/FestivalNFT.sol

// Trả về tất cả tokenIds của một owner
function tokensOfOwner(address owner) 
    external view returns (uint256[] memory) 
{
    uint256 tokenCount = balanceOf(owner);
    uint256[] memory tokenIds = new uint256[](tokenCount);
    uint256 index = 0;
    
    for (uint256 i = 1; i <= _tokenIdCounter; i++) {
        if (_ownerOf(i) == owner) {
            tokenIds[index] = i;
            index++;
        }
    }
    
    return tokenIds;
}

// View functions - KHÔNG TỐN GAS
function getTicketType(uint256 tokenId) 
    external view returns (string memory) 
{
    return _ticketTypes[tokenId];
}

function getTicketPrice(uint256 tokenId) 
    external view returns (uint256) 
{
    return _ticketPrices[tokenId];
}
```

---

## 💾 Dữ Liệu Được Lưu Ở Đâu?

### **1. Blockchain Storage (On-chain)**

```solidity
contract FestivalNFT {
    // ✅ LƯU TRÊN BLOCKCHAIN
    mapping(uint256 => address) private _owners;           // Token → Owner
    mapping(uint256 => string) private _ticketTypes;       // Token → "VIP"
    mapping(uint256 => uint256) private _ticketPrices;     // Token → Price
    mapping(uint256 => bool) private _usedTickets;         // Token → Used?
    
    uint256 private _tokenIdCounter;  // Đếm số vé đã mint
}
```

**Đặc điểm:**
- ✅ Immutable - không thể sửa
- ✅ Decentralized - không có server trung tâm
- ✅ Vĩnh viễn - tồn tại mãi mãi
- 💰 Tốn gas mỗi lần ghi

### **2. Frontend Local State (Off-chain)**

```typescript
// ❌ KHÔNG LƯU BLOCKCHAIN - Chỉ UI
const mockFestivals = [
  {
    name: "Summer Music Fest",
    location: "Hanoi",
    // ... data tĩnh để demo
  }
];
```

**Đặc điểm:**
- ❌ Mất khi refresh
- ❌ Chỉ local
- ✅ Không tốn gas
- ✅ Nhanh

---

## 🔄 So Sánh: Mock Data vs Blockchain Data

| Khía cạnh | Mock Data (HomePage) | Blockchain Data (MyTicketsPage) |
|-----------|---------------------|--------------------------------|
| **Lưu trữ** | ❌ JavaScript variable | ✅ Blockchain storage |
| **Tồn tại** | ❌ Mất khi refresh | ✅ Vĩnh viễn |
| **Có thật không?** | ❌ Fake data | ✅ NFT thật 100% |
| **Tốn gas?** | ❌ Không | ✅ Có (khi mint) |
| **Query** | ⚡ Instant | 🐢 RPC call ~1-2s |
| **Có thể sửa?** | ✅ Edit code | ❌ Immutable |
| **Cross-device?** | ❌ Local only | ✅ Bất kỳ device nào |

---

## 🎫 Ví Dụ Thực Tế

### **Tình huống: Bạn mua 1 vé VIP**

```
1. Frontend gọi: buyTicket("VIP", 1)
        ↓
2. MetaMask confirm 2 transactions
        ↓
3. Smart contract mint NFT Token #42
        ↓
4. Blockchain ghi:
   {
     tokenId: 42,
     owner: "0x7099970C51812dc3A010C7d01b50e0d17dc79C8",
     ticketType: "VIP",
     price: 100000000000000000000,  // 100 FEST
     isUsed: false
   }
        ↓
5. MyTicketsPage query blockchain:
   tokensOfOwner(0x7099...) → [42]
   getTicketType(42) → "VIP"
   getTicketPrice(42) → 100 FEST
        ↓
6. Hiển thị vé với QR code
```

### **Bạn tắt máy, mở lại sau 1 tuần:**

```
1. Connect MetaMask với cùng địa chỉ
        ↓
2. MyTicketsPage query blockchain
        ↓
3. ✅ VÉ VẪN CÒN ĐÓ!
   Token #42 vẫn thuộc sở hữu của bạn
        ↓
4. Có thể:
   - Xem QR code
   - Resell trên marketplace
   - Gift cho bạn bè
   - Check-in tại sự kiện
```

---

## 🔐 Bảo Mật & Ownership

### **Làm sao đảm bảo vé là của tôi?**

```solidity
// Mỗi transaction phải ký bằng private key
function _safeMint(address to, uint256 tokenId) internal {
    require(to != address(0), "Invalid address");
    require(_owners[tokenId] == address(0), "Token exists");
    
    // ✅ GHI OWNER VÀO BLOCKCHAIN
    _owners[tokenId] = to;
    _balances[to] += 1;
}

// Chỉ owner mới transfer được
function transferFrom(address from, address to, uint256 tokenId) public {
    require(_isApprovedOrOwner(msg.sender, tokenId));
    require(_owners[tokenId] == from);
    
    _transfer(from, to, tokenId);
}
```

**Tại sao an toàn?**
- ✅ Cần private key để ký transaction
- ✅ Blockchain verify signature
- ✅ Không ai có thể giả mạo
- ✅ Smart contract enforce rules

---

## 📊 Test Local vs Production

### **Hardhat Local (Test):**

```
Blockchain: Hardhat Network
RPC: http://127.0.0.1:8545
Chain ID: 31337

✅ VÉ VẪN LƯU BLOCKCHAIN (local blockchain)
✅ Logic giống hệt production
❌ Dữ liệu mất khi restart node
💰 Gas free (ETH fake)
```

### **Testnet (Sepolia):**

```
Blockchain: Ethereum Sepolia
RPC: https://sepolia.infura.io/...
Chain ID: 11155111

✅ VÉ LƯU BLOCKCHAIN THẬT
✅ Dữ liệu vĩnh viễn (public testnet)
💰 Gas với ETH testnet (free faucet)
```

### **Mainnet (Production):**

```
Blockchain: Ethereum / Polygon
RPC: https://mainnet.infura.io/...
Chain ID: 1 / 137

✅ VÉ LƯU BLOCKCHAIN THẬT
✅ Dữ liệu vĩnh viễn (decentralized)
💰 Gas với ETH/MATIC thật ($$$)
```

---

## 🎓 Kết Luận

### **Logic Blockchain Quan Trọng:**

1. **Vé = NFT Token**
   - Mỗi vé là 1 ERC721 token unique

2. **Mint = Tạo vé trên blockchain**
   - `_safeMint(buyer, tokenId)` ghi owner vào blockchain

3. **Query = Đọc từ blockchain**
   - `tokensOfOwner()` trả về tokenIds
   - View functions không tốn gas

4. **Transfer = Chuyển ownership**
   - Resell, gift đều thay đổi `_owners[tokenId]`

5. **Immutable = Không thể sửa**
   - Một khi mint, token tồn tại mãi mãi
   - Chỉ có thể transfer ownership

### **Mock Data Chỉ Là UI:**

- ❌ Không ảnh hưởng blockchain logic
- ✅ Vé mua = Vé thật từ smart contract
- ✅ Test local = Test logic blockchain thật

### **Quan Trọng Nhất:**

```
MUA VÉ = MINT NFT = GHI BLOCKCHAIN = VÉ THẬT 100%
```

Không quan trọng data festivals từ đâu (mock hay API), 
**quan trọng là transaction mint NFT được ghi vào blockchain!**
