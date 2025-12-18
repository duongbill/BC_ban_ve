# 🎫 Fix: Display Correct Event Names in My Tickets

## 🐛 Problem

Tất cả các vé trong trang "Vé của tôi" đều hiển thị cùng tên "Summer Music Festival" thay vì tên sự kiện thực tế mà người dùng đã mua vé.

## ✅ Solution

### 1. **Store Metadata in localStorage (Mock IPFS)**

**File:** `frontend/src/services/ipfs.ts`

Khi upload metadata trong mock mode, lưu vào localStorage để có thể retrieve sau:

```typescript
// Store metadata in localStorage for retrieval (mock IPFS storage)
const metadata = {
  name: data.name,
  description: data.description,
  image: "mock-image-url",
  attributes: data.attributes || [],
};
localStorage.setItem(`ipfs_metadata_${mockHash}`, JSON.stringify(metadata));
```

### 2. **Fetch Metadata from localStorage**

Thêm logic fetch metadata từ localStorage trong `fetchMetadata()`:

```typescript
export async function fetchMetadata(uri: string): Promise<TicketMetadata> {
  // Mock mode - try to fetch from localStorage first
  if (USE_MOCK && uri.startsWith("ipfs://")) {
    const hash = uri.replace("ipfs://", "");
    const stored = localStorage.getItem(`ipfs_metadata_${hash}`);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  // ... existing IPFS gateway fetch
}
```

### 3. **Parse Event Metadata in MyTicketsPage**

**File:** `frontend/src/pages/MyTicketsPage.tsx`

Fetch metadata cho mỗi vé và parse event info từ description:

```typescript
useEffect(() => {
  async function loadMetadata() {
    const ticketsWithMeta = await Promise.all(
      blockchainTickets.map(async (ticket) => {
        // Fetch metadata from IPFS/localStorage
        const metadata = await fetchMetadata(ticket.tokenURI);

        // Parse event info from description
        // Format: "...\n\nEvent: Jazz Festival Hà Nội\nEvent ID: 4\n..."
        const eventIdMatch = metadata.description.match(/Event ID: (\d+)/);
        const eventNameMatch = metadata.description.match(/Event: ([^\n]+)/);

        let eventId = eventIdMatch?.[1] || "1";
        let eventName = eventNameMatch?.[1]?.trim() || "Summer Music Festival";

        return {
          ...ticket,
          festival: {
            id: eventId,
            name: eventName,
            // ...
          },
        };
      })
    );

    setTicketsWithMetadata(ticketsWithMeta);
  }

  loadMetadata();
}, [blockchainTickets]);
```

## 🔄 Flow

### Before Fix:

```
1. Mua vé Jazz Festival Hà Nội
2. Metadata uploaded to mock IPFS → tokenURI: ipfs://QmXXX
3. Metadata bị mất (không lưu đâu cả)
4. MyTicketsPage fetch tokenURI → Không có cách nào retrieve metadata
5. Hardcode name: "Summer Music Festival" ❌
```

### After Fix:

```
1. Mua vé Jazz Festival Hà Nội
2. Metadata uploaded to mock IPFS → tokenURI: ipfs://QmXXX
3. ✅ Metadata stored in localStorage: ipfs_metadata_QmXXX
4. MyTicketsPage fetch tokenURI
5. fetchMetadata() retrieves from localStorage
6. Parse event info from description:
   - Event ID: 4
   - Event: Jazz Festival Hà Nội
7. Display correct event name: "Jazz Festival Hà Nội" ✅
```

## 📝 Event Metadata Format

When buying a ticket, event metadata is embedded in the description:

```typescript
const enrichedTicketData = {
  name: "VIP Jazz Lounge",
  description: `VIP access with backstage pass...

Event: Jazz Festival Hà Nội
Event ID: 4
Location: Nhà hát Tuổi Trẻ, Hà Nội
Ticket Type: VIP Jazz Lounge`,
};
```

This allows us to parse and extract:

- Event Name: "Jazz Festival Hà Nội"
- Event ID: "4"
- Location: "Nhà hát Tuổi Trẻ, Hà Nội"
- Ticket Type: "VIP Jazz Lounge"

## 🧪 Testing

### Test Steps:

1. **Reset localStorage (optional):**

   ```javascript
   // In browser console
   localStorage.clear();
   ```

2. **Buy tickets from different events:**

   - Navigate to Festival #1 (Đêm Nhạc Sài Gòn)
   - Click "Ký xác nhận tham gia sự kiện"
   - Buy VIP ticket
   - Navigate to Festival #4 (Jazz Festival Hà Nội)
   - Click "Ký xác nhận tham gia sự kiện"
   - Buy Standard ticket

3. **Check My Tickets page:**

   - Navigate to "Vé của tôi"
   - **Expected**: See 2 tickets with different event names:
     - Token #1: "Đêm Nhạc Sài Gòn 2025"
     - Token #2: "Jazz Festival Hà Nội"

4. **Verify localStorage:**
   ```javascript
   // In browser console
   Object.keys(localStorage)
     .filter((k) => k.startsWith("ipfs_metadata_"))
     .forEach((k) => {
       console.log(k, JSON.parse(localStorage.getItem(k)));
     });
   ```

## 🎯 Benefits

1. ✅ **Correct Event Names**: Each ticket displays its actual event
2. ✅ **Persistent Metadata**: Metadata survives page refresh
3. ✅ **No External API**: Works without NFT.Storage API key
4. ✅ **Event Context**: Full event info available for each ticket
5. ✅ **Better UX**: Users can distinguish between tickets easily

## ⚠️ Limitations

### Mock IPFS Mode:

- Metadata chỉ lưu trong localStorage của browser
- Clear cache = mất metadata
- Không sync across devices

### Solution for Production:

- Use real NFT.Storage with API key
- Metadata được lưu trên IPFS thật
- Có thể access từ bất kỳ đâu

## 🚀 Future Improvements

### 1. Fallback Chain

```typescript
// Try multiple sources
1. localStorage (mock mode)
2. IPFS gateway (real mode)
3. On-chain event registry (if implemented)
4. Backend API cache (if available)
```

### 2. Event Registry Contract

```solidity
contract EventRegistry {
    struct EventInfo {
        string name;
        string location;
        uint256 date;
        address nftContract;
    }

    mapping(address => EventInfo) public events;

    function registerEvent(address nftContract, EventInfo memory info) external;
}
```

### 3. Backend Indexer

- Listen to `TicketPurchasedFromOrganiser` events
- Parse event metadata from transaction
- Store in database for fast query
- Provide REST API: `GET /api/tickets/:tokenId/event`

---

**Fixed by:** Nguyễn Hải Dương, Phạm Ngọc Khánh Duy, Vũ Hoàng Anh  
**Date:** December 18, 2025  
**Version:** 1.1.0
