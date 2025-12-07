# 🔧 Hướng dẫn sửa lỗi mua vé

## Vấn đề đã khắc phục

### 1. Lỗi IPFS API Key

**Vấn đề:** `API Key is malformed or failed to parse`
**Nguyên nhân:** NFT.Storage API key không được cấu hình hoặc không hợp lệ

**Giải pháp:**

- ✅ Đã thêm **mock mode** cho IPFS
- Khi không có API key hợp lệ, hệ thống tự động sử dụng mock IPFS URIs
- Phù hợp để test local mà không cần API key thật

### 2. Lỗi thiếu buyer address

**Vấn đề:** Logic mua vé thiếu địa chỉ người mua
**Giải pháp:**

- ✅ Đã thêm `useAccount()` từ wagmi
- ✅ Truyền `buyerAddress` vào mutation

### 3. Đơn giản hóa logic mua vé

**Thay đổi:**

- ❌ Loại bỏ Biconomy Smart Account (phức tạp, cần cấu hình)
- ✅ Sử dụng wagmi trực tiếp với `writeContractAsync`
- ✅ Giao dịch tuần tự: Approve → Buy (dễ debug)

## Cách test

### Bước 1: Đảm bảo Hardhat node đang chạy

```bash
# Terminal 1
npx hardhat node
```

### Bước 2: Deploy contracts (nếu chưa)

```bash
# Terminal 2
npx hardhat run scripts/deploy.js --network localhost
```

### Bước 3: Cập nhật địa chỉ contracts vào .env

```bash
# Terminal 2 (tiếp)
node scripts/update-env.js
```

### Bước 4: Restart frontend

```bash
# Terminal 3
cd frontend
npm run dev
```

### Bước 5: Test mua vé

1. Kết nối ví MetaMask (đã import account từ Hardhat)
2. Truy cập trang sự kiện
3. Click "Mua vé sơ cấp"
4. Điền thông tin:
   - **Tên vé:** VIP Pass
   - **Mô tả:** VIP access to all areas
   - **Giá:** 50 (FEST tokens)
   - **Ảnh:** Upload một ảnh bất kỳ
5. Click "Mua vé"
6. Xác nhận 2 giao dịch trong MetaMask:
   - Transaction 1: Approve FEST tokens
   - Transaction 2: Buy ticket

## Lưu ý quan trọng

### Mock IPFS Mode

- Khi `VITE_NFT_STORAGE_API_KEY` không được set hoặc là placeholder
- Hệ thống tự động tạo mock IPFS URIs: `ipfs://Qm...`
- Phù hợp để test local
- Console sẽ hiển thị: `🔧 Using MOCK IPFS (no API key configured)`

### Token Balance

Đảm bảo account có đủ FEST tokens:

```bash
# Trong Hardhat console hoặc script
const festToken = await ethers.getContractAt("FestToken", FEST_TOKEN_ADDRESS);
await festToken.balanceOf(YOUR_ADDRESS);
```

### Gas Fees

- Local network: Không cần lo gas fees
- Account từ Hardhat có sẵn 10000 ETH

## Nếu vẫn gặp lỗi

### Lỗi: "execution reverted"

**Kiểm tra:**

1. Account có đủ FEST tokens?
2. Đã approve đủ tokens?
3. Contract addresses đúng?
4. Hardhat node có đang chạy?

### Lỗi: "user rejected transaction"

- Chấp nhận transaction trong MetaMask
- Kiểm tra MetaMask đang ở đúng network (Hardhat Local - Chain ID 31337)

### Lỗi: "nonce too high"

```
MetaMask → Settings → Advanced → Clear activity tab data
```

### Debug tips

```bash
# Xem logs của Hardhat node
# Terminal 1 (nơi chạy npx hardhat node)

# Xem console logs của frontend
# Browser DevTools (F12) → Console tab
```

## File đã thay đổi

1. **frontend/src/hooks/useFestivalMutations.ts**

   - Đơn giản hóa `useBuyTicket()` hook
   - Sử dụng wagmi thay vì Biconomy
   - Thêm loading toast messages

2. **frontend/src/services/ipfs.ts**

   - Thêm mock mode khi không có API key
   - Tạo fake IPFS URIs để test local

3. **frontend/src/pages/FestivalPage.tsx**

   - Thêm `useAccount()` từ wagmi
   - Truyền `buyerAddress` vào mutation
   - Kiểm tra wallet connected trước khi mua

4. **frontend/.env.example**

   - Template cho environment variables

5. **scripts/update-env.js**
   - Script tự động cập nhật contract addresses

## Tính năng đã implement

✅ Kết nối ví với RainbowKit
✅ Hiển thị danh sách sự kiện
✅ Xem chi tiết sự kiện
✅ Mock IPFS cho test local
✅ **Mua vé sơ cấp** (vừa sửa xong)
⏳ Mua vé thứ cấp (chưa test)
⏳ Đăng bán vé (chưa test)
⏳ Tạo sự kiện mới (chưa implement)

## Next Steps

1. Test mua vé thành công
2. Kiểm tra NFT đã được mint
3. Hiển thị vé trong "Vé của tôi"
4. Implement tính năng đăng bán vé thứ cấp
5. Test toàn bộ flow end-to-end
