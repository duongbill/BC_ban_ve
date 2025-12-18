# 🔐 EIP-712 Implementation Guide

## 📖 Tổng quan

Dự án đã được nâng cấp với **EIP-712 Typed Data Signing** để cải thiện trải nghiệm người dùng khi tương tác với các sự kiện cụ thể trên blockchain.

## 🎯 Vấn đề đã giải quyết

### Trước khi implement:

- ❌ MetaMask chỉ hiển thị thông tin contract chung chung
- ❌ Người dùng không biết đang tương tác với sự kiện nào
- ❌ Không có cách nào để phân biệt giữa các sự kiện khác nhau
- ❌ Transaction signature không chứa thông tin sự kiện

### Sau khi implement:

- ✅ MetaMask hiển thị rõ ràng tên sự kiện, địa điểm, ngày tổ chức
- ✅ Người dùng phải ký xác nhận tham gia sự kiện trước khi mua vé
- ✅ Mỗi transaction mua vé chứa đầy đủ metadata về sự kiện
- ✅ Signature request hiển thị cấu trúc dữ liệu rõ ràng theo chuẩn EIP-712

## 🏗️ Kiến trúc Implementation

### 1. Hook `useEventSignature`

**File:** `frontend/src/hooks/useEventSignature.ts`

Cung cấp 2 hooks chính:

#### A. `useEventSignature()` - Ký xác nhận tham gia sự kiện

```typescript
const signEventConnection = useEventSignature();

await signEventConnection.mutateAsync({
  eventId: "1",
  eventName: "Jazz Festival Hà Nội",
  eventDate: 1735689600000, // timestamp
  location: "Nhà hát Tuổi Trẻ, Hà Nội",
  nftContract: "0x...",
  userAddress: "0x...",
  timestamp: Date.now(),
});
```

**EIP-712 Domain:**

```typescript
{
  name: "Festival Ticket Marketplace",
  version: "1.0",
  chainId: 31337,
  verifyingContract: nftContract
}
```

**EIP-712 Types:**

```typescript
{
  EventConnect: [
    { name: "eventName", type: "string" },
    { name: "eventId", type: "string" },
    { name: "location", type: "string" },
    { name: "eventDate", type: "uint256" },
    { name: "userAddress", type: "address" },
    { name: "timestamp", type: "uint256" },
  ];
}
```

**Hiển thị trong MetaMask:**

```
🔐 Signature Request
Festival Ticket Marketplace

eventName: Jazz Festival Hà Nội
eventId: 4
location: Nhà hát Tuổi Trẻ, Hà Nội
eventDate: 1735689600000
userAddress: 0x70997970...
timestamp: 1734521234567
```

#### B. `useTicketPurchaseSignature()` - Ký xác nhận mua vé

```typescript
const signTicketPurchase = useTicketPurchaseSignature();

await signTicketPurchase.mutateAsync({
  eventName: "Jazz Festival Hà Nội",
  eventId: "4",
  ticketType: "VIP Jazz Lounge",
  price: "130",
  location: "Nhà hát Tuổi Trẻ, Hà Nội",
  eventDate: 1735689600000,
  nftContract: "0x...",
});
```

**EIP-712 Types:**

```typescript
{
  TicketPurchase: [
    { name: "eventName", type: "string" },
    { name: "eventId", type: "string" },
    { name: "ticketType", type: "string" },
    { name: "price", type: "string" },
    { name: "location", type: "string" },
    { name: "eventDate", type: "uint256" },
    { name: "buyer", type: "address" },
    { name: "timestamp", type: "uint256" },
  ];
}
```

**Hiển thị trong MetaMask:**

```
🎫 Signature Request
Festival Ticket Purchase

eventName: Jazz Festival Hà Nội
ticketType: VIP Jazz Lounge
price: 130 FEST
location: Nhà hát Tuổi Trẻ, Hà Nội
eventDate: 1735689600000
buyer: 0x70997970...
```

### 2. Enhanced `useBuyTicket` Hook

**File:** `frontend/src/hooks/useFestivalMutations.ts`

**Thay đổi chính:**

```typescript
// BEFORE: No event metadata
useBuyTicket({
  nftAddress,
  marketplaceAddress,
  tokenAddress,
  price,
  buyerAddress,
  ticketData: { name, description, image },
});

// AFTER: With event metadata
useBuyTicket({
  nftAddress,
  marketplaceAddress,
  tokenAddress,
  price,
  buyerAddress,
  ticketData: { name, description, image },
  // NEW: Event metadata
  eventMetadata: {
    eventId: "4",
    eventName: "Jazz Festival Hà Nội",
    eventDate: 1735689600000,
    location: "Nhà hát Tuổi Trẻ, Hà Nội",
    ticketType: "VIP Jazz Lounge",
  },
});
```

**Event metadata được embed vào ticket description:**

```typescript
const enrichedTicketData = {
  ...ticketData,
  description: `${ticketData.description}

Event: Jazz Festival Hà Nội
Event ID: 4
Location: Nhà hát Tuổi Trẻ, Hà Nội
Ticket Type: VIP Jazz Lounge`,
};
```

### 3. FestivalPage Updates

**File:** `frontend/src/pages/FestivalPage.tsx`

#### A. State Management

```typescript
// Track if user has signed event connection
const [hasSignedEventConnection, setHasSignedEventConnection] = useState(false);
const signEventConnection = useEventSignature();
```

#### B. Sign Event Connection Handler

```typescript
const handleSignEventConnection = async () => {
  if (!buyerAddress || !festival) {
    toast.error("Vui lòng kết nối ví trước");
    return;
  }

  const eventDetails = FESTIVAL_DETAILS[id || "1"];

  // Parse date string to timestamp
  const dateParts = eventDetails.date.split(".");
  const eventDate = new Date(
    parseInt(`20${dateParts[2]}`),
    parseInt(dateParts[1]) - 1,
    parseInt(dateParts[0])
  ).getTime();

  await signEventConnection.mutateAsync({
    eventId: id || "1",
    eventName: festival.name,
    eventDate: eventDate,
    location: eventDetails.location,
    nftContract: festival.nftContract,
    userAddress: buyerAddress,
    timestamp: Date.now(),
  });

  setHasSignedEventConnection(true);
  toast.success("✅ Bạn đã được xác nhận tham gia sự kiện!");
};
```

#### C. UI Flow

```typescript
{
  !hasSignedEventConnection ? (
    // Show "Sign Event Connection" button
    <button onClick={handleSignEventConnection}>
      🔐 Ký xác nhận tham gia sự kiện
    </button>
  ) : (
    <>
      {/* Show confirmation badge */}
      <div>✅ Đã xác nhận tham gia sự kiện</div>

      {/* Show ticket purchase button */}
      <button onClick={() => setShowBuyModal(true)}>🎟️ Chọn hạng vé</button>
    </>
  );
}
```

#### D. Buy Ticket with Event Metadata

```typescript
const result = await buyTicketMutation.mutateAsync({
  nftAddress: festival.nftContract,
  marketplaceAddress: festival.marketplace,
  tokenAddress: DEPLOYED_FEST_TOKEN_ADDRESS,
  price: ticketData.price,
  buyerAddress: buyerAddress,
  ticketData: {
    name: ticketData.name,
    description: ticketData.description,
    image: imageFile,
  },
  // NEW: Event metadata
  eventMetadata: {
    eventId: id || "1",
    eventName: festival.name,
    eventDate: eventDate,
    location: eventDetails.location,
    ticketType: selectedTicketType,
  },
});
```

## 🔄 User Flow

### Trước đây:

```
1. Connect Wallet → MetaMask shows generic connection
2. Buy Ticket → MetaMask shows generic transaction
3. Done
```

### Bây giờ:

```
1. Connect Wallet → MetaMask shows generic connection
2. Navigate to Event Page
3. Click "Ký xác nhận tham gia sự kiện"
   → MetaMask shows EIP-712 signature with event details:
      - Event Name: Jazz Festival Hà Nội
      - Location: Nhà hát Tuổi Trẻ, Hà Nội
      - Event Date: 10.03.2026
4. Sign the event connection
5. See confirmation badge: ✅ Đã xác nhận tham gia sự kiện
6. Click "Chọn hạng vé"
7. Select ticket type (e.g., VIP Jazz Lounge)
8. Confirm purchase
   → Transaction includes event metadata in ticket description
9. Done - Ticket NFT minted with full event information
```

## 📊 Benefits

### 1. User Experience

- ✅ **Transparency**: Người dùng biết chính xác đang tương tác với sự kiện nào
- ✅ **Trust**: Signature request hiển thị đầy đủ thông tin sự kiện
- ✅ **Security**: EIP-712 chuẩn hóa, khó bị phishing

### 2. Data Integrity

- ✅ **Event Tracking**: Mỗi ticket chứa đầy đủ thông tin sự kiện
- ✅ **Metadata Rich**: Description chứa Event ID, Name, Location
- ✅ **Auditable**: Signature có thể verify off-chain

### 3. Developer Experience

- ✅ **Type Safety**: TypeScript interfaces cho EventConnectData
- ✅ **Reusable Hooks**: useEventSignature, useTicketPurchaseSignature
- ✅ **Clear Separation**: Event connection vs Ticket purchase

## 🧪 Testing

### 1. Test Event Connection Signature

```bash
# Terminal 1: Start Hardhat
npx hardhat node

# Terminal 2: Deploy
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: Start Frontend
cd frontend
npm run dev
```

**Test Steps:**

1. Mở http://localhost:5173
2. Kết nối MetaMask với Account #1
3. Click vào một sự kiện (e.g., Jazz Festival Hà Nội)
4. Click "🔐 Ký xác nhận tham gia sự kiện"
5. **Kiểm tra MetaMask popup:**
   - Phải hiển thị "Signature Request"
   - Phải show tên sự kiện: "Jazz Festival Hà Nội"
   - Phải show location: "Nhà hát Tuổi Trẻ, Hà Nội"
   - Phải show eventDate (timestamp)
6. Click "Sign"
7. Thấy toast: "✅ Bạn đã được xác nhận tham gia sự kiện!"
8. Thấy badge: "✅ Đã xác nhận tham gia sự kiện"
9. Button "🎟️ Chọn hạng vé" xuất hiện

### 2. Test Ticket Purchase with Metadata

1. Sau khi sign event connection
2. Click "🎟️ Chọn hạng vé"
3. Chọn loại vé (e.g., VIP Jazz Lounge - 130 FEST)
4. Click "Mua vé"
5. **Transaction 1: Approve FEST**
   - Confirm trong MetaMask
6. **Transaction 2: Buy Ticket**
   - Confirm trong MetaMask
7. Đợi confirmation
8. Thấy toast: "🎉 Vé đã được mua thành công!"
9. **Verify metadata:**
   - Open DevTools Console
   - Tìm log: "🎫 Event metadata embedded in ticket:"
   - Kiểm tra có đầy đủ: eventId, eventName, ticketType, location, eventDate

## 🔍 Debug

### Check EIP-712 Signature

```typescript
// In useEventSignature.ts
console.log("🔐 Signing EIP-712 typed data:", {
  domain,
  types,
  message,
});
```

### Check Event Metadata Embedding

```typescript
// In useFestivalMutations.ts
console.log("🎫 Event metadata embedded in ticket:", {
  eventId: eventMetadata.eventId,
  eventName: eventMetadata.eventName,
  ticketType: eventMetadata.ticketType,
  location: eventMetadata.location,
  eventDate: new Date(eventMetadata.eventDate).toLocaleString(),
});
```

## 📝 Best Practices

### 1. Always Sign Event Connection First

```typescript
// WRONG: Buy ticket without signing event connection
onClick={() => setShowBuyModal(true)}

// RIGHT: Check if signed first
{hasSignedEventConnection && (
  <button onClick={() => setShowBuyModal(true)}>
    🎟️ Chọn hạng vé
  </button>
)}
```

### 2. Use Type-Safe Event Metadata

```typescript
interface EventMetadata {
  eventId: string;
  eventName: string;
  eventDate: number; // timestamp in milliseconds
  location: string;
  ticketType: string;
}
```

### 3. Handle Signature Rejection

```typescript
try {
  await signEventConnection.mutateAsync({ ... });
} catch (error: any) {
  if (error?.message?.includes("User rejected")) {
    toast.error("Bạn đã từ chối ký xác nhận");
  }
}
```

## 🚀 Future Enhancements

### 1. On-Chain Event Verification

Lưu signature on-chain để verify người dùng đã sign event connection:

```solidity
mapping(address => mapping(bytes32 => bool)) public eventConnections;

function verifyEventConnection(
    address user,
    bytes32 eventId,
    bytes memory signature
) external {
    // Verify EIP-712 signature
    // Store in eventConnections mapping
}
```

### 2. Event-Specific NFT Contracts

Mỗi sự kiện có NFT contract riêng thay vì dùng chung:

```typescript
// Current: All events use same NFT contract
const nftContract = DEPLOYED_NFT_ADDRESS;

// Future: Each event has its own NFT contract
const nftContract = festival.nftContract; // Unique per event
```

### 3. Signature Replay Protection

Thêm nonce để prevent replay attacks:

```typescript
{
  EventConnect: [
    { name: "eventName", type: "string" },
    { name: "nonce", type: "uint256" }, // NEW
    // ...
  ];
}
```

## 📚 References

- [EIP-712: Typed structured data hashing and signing](https://eips.ethereum.org/EIPS/eip-712)
- [Wagmi useSignTypedData](https://wagmi.sh/react/api/hooks/useSignTypedData)
- [MetaMask Signature Request](https://docs.metamask.io/wallet/how-to/sign-data/)
- [Viem signTypedData](https://viem.sh/docs/actions/wallet/signTypedData.html)

---

**Implemented by:** Nguyễn Hải Dương, Phạm Ngọc Khánh Duy, Vũ Hoàng Anh  
**Date:** December 18, 2025  
**Version:** 1.0.0
