# 🔍 Debug Guide - Check Event Metadata

## Kiểm tra Metadata trong LocalStorage

Mở Browser Console (F12) và chạy các lệnh sau:

### 1. Xem tất cả metadata đã lưu

```javascript
// List all IPFS metadata keys
Object.keys(localStorage)
  .filter((k) => k.startsWith("ipfs_metadata_"))
  .forEach((k) => {
    const data = JSON.parse(localStorage.getItem(k));
    console.log("Key:", k);
    console.log("Name:", data.name);
    console.log("Description:", data.description);
    console.log("---");
  });
```

### 2. Kiểm tra metadata của một tokenURI cụ thể

```javascript
// Giả sử tokenURI = "ipfs://QmXXXXX"
const tokenURI = "ipfs://QmXXXXX"; // Thay bằng tokenURI thật từ console log
const hash = tokenURI.replace("ipfs://", "");
const key = `ipfs_metadata_${hash}`;
const metadata = localStorage.getItem(key);

if (metadata) {
  const data = JSON.parse(metadata);
  console.log("✅ Metadata found:", data);

  // Parse event info
  const eventIdMatch = data.description?.match(/Event ID: (\d+)/);
  const eventNameMatch = data.description?.match(/Event: ([^\n]+)/);
  console.log("Event ID:", eventIdMatch?.[1]);
  console.log("Event Name:", eventNameMatch?.[1]);
} else {
  console.log("❌ No metadata found for key:", key);
}
```

### 3. Clear tất cả metadata (để test lại)

```javascript
// Remove all IPFS metadata
Object.keys(localStorage)
  .filter((k) => k.startsWith("ipfs_metadata_"))
  .forEach((k) => localStorage.removeItem(k));

console.log("✅ Cleared all IPFS metadata");
```

## Test Flow Đầy Đủ

### Bước 1: Clear cache và reset

```javascript
localStorage.clear();
console.log("✅ Cleared localStorage");
```

### Bước 2: Mua vé từ sự kiện cụ thể

1. Navigate to Festival Detail page (e.g., Jazz Festival Hà Nội - ID 4)
2. Click "🔐 Ký xác nhận tham gia sự kiện"
3. Sign the EIP-712 message
4. Click "🎟️ Chọn hạng vé"
5. Select ticket type (e.g., VIP Jazz Lounge)
6. Click "Mua vé"
7. Approve FEST tokens (Transaction 1)
8. Buy ticket (Transaction 2)

### Bước 3: Kiểm tra metadata đã lưu

```javascript
// Check metadata saved after purchase
Object.keys(localStorage)
  .filter((k) => k.startsWith("ipfs_metadata_"))
  .forEach((k) => {
    const data = JSON.parse(localStorage.getItem(k));
    console.log("\n🎫 Ticket Metadata:");
    console.log("Key:", k);
    console.log("Name:", data.name);
    console.log("Description preview:", data.description?.substring(0, 200));

    // Check if event metadata is embedded
    if (data.description?.includes("Event:")) {
      console.log("✅ Event metadata found in description");
    } else {
      console.log("❌ No event metadata in description");
    }
  });
```

### Bước 4: List vé để bán

1. Go to "Vé của tôi"
2. Find the ticket you just bought
3. Click "Bán vé"
4. Enter price (≤ 110% of purchase price)
5. Approve NFT for marketplace
6. Confirm listing

### Bước 5: Check Secondary Market

1. Navigate to "Chuyển nhượng"
2. Check console logs:
   - `🔍 Fetching metadata for secondary ticket`
   - `📦 Metadata retrieved`
   - `✅ Parsed Event ID` and `✅ Parsed Event Name`
3. Verify ticket shows correct event name

## Troubleshooting

### Issue 1: "No metadata found in localStorage"

**Cause:** Metadata không được lưu khi mua vé

**Solution:**

```javascript
// Check if uploadMetadata is storing data
// In useFestivalMutations.ts, after uploadMetadata:
console.log("✅ Stored metadata in localStorage");
```

### Issue 2: "Event metadata not in description"

**Cause:** Event metadata không được embed vào description

**Solution:**

- Check useFestivalMutations.ts line ~200
- Verify `enrichedTicketData` contains event metadata in description

### Issue 3: "Metadata found but event name is wrong"

**Cause:** Regex không parse đúng

**Solution:**

```javascript
// Test regex
const description = `VIP access...

Event: Jazz Festival Hà Nội
Event ID: 4
Location: Nhà hát Tuổi Trẻ, Hà Nội`;

const eventIdMatch = description.match(/Event ID: (\d+)/);
const eventNameMatch = description.match(/Event: ([^\n]+)/);

console.log("Event ID:", eventIdMatch?.[1]); // Should be "4"
console.log("Event Name:", eventNameMatch?.[1]); // Should be "Jazz Festival Hà Nội"
```

## Expected Console Output

### When buying ticket:

```
🔧 Using MOCK IPFS (no API key configured)
Metadata: {name: "VIP Jazz Lounge", description: "VIP access..."}
Mock IPFS URI: ipfs://QmXXXXX
✅ Stored metadata in localStorage for: QmXXXXX
🎫 Event metadata embedded in ticket: {
  eventId: "4",
  eventName: "Jazz Festival Hà Nội",
  ticketType: "VIP Jazz Lounge",
  location: "Nhà hát Tuổi Trẻ, Hà Nội"
}
```

### When viewing Secondary Market:

```
🔍 Fetching metadata for secondary ticket 1 tokenURI: ipfs://QmXXXXX
📦 Retrieved metadata from localStorage for: QmXXXXX
📦 Metadata retrieved: {name: "VIP Jazz Lounge", description: "VIP access...\n\nEvent: Jazz Festival Hà Nội\n..."}
📝 Description: VIP access...\n\nEvent: Jazz Festival Hà Nội\nEvent ID: 4\n...
✅ Parsed Event ID: 4
✅ Parsed Event Name: Jazz Festival Hà Nội
🎫 Final ticket info: {eventId: "4", eventName: "Jazz Festival Hà Nội", tokenId: 1}
```

---

**Tip:** Mở Console trước khi test để xem tất cả logs real-time!
