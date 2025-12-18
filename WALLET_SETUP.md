# 🔐 Hướng Dẫn Connect Ví MetaMask Đúng Account

## ❌ Vấn Đề

Lỗi "approve reverted" xảy ra vì:

- **Frontend đang connect ví MetaMask sai account**
- Các tickets được mint cho địa chỉ: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (Hardhat Account #1)
- Nhưng MetaMask đang connect account khác

## ✅ Giải Pháp: Import Hardhat Account vào MetaMask

### Bước 1: Lấy Private Key của Hardhat Account #1

Hardhat test accounts có private keys mặc định:

**Account #1 (Organiser)**

- Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

### Bước 2: Import vào MetaMask

1. Mở **MetaMask extension**
2. Click vào **icon account** (góc trên bên phải)
3. Chọn **"Import Account"**
4. Paste private key:
   ```
   0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   ```
5. Click **"Import"**

### Bước 3: Kết Nối MetaMask với Website

1. Trên website Festival Marketplace
2. Click **"Connect Wallet"** ở góc trên
3. Chọn **MetaMask**
4. **Đảm bảo đang chọn account đúng**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
5. Click **"Connect"**

### Bước 4: Kiểm Tra

Sau khi connect, bạn sẽ thấy:

- Địa chỉ hiển thị: `0x7099...79C8`
- Banner màu tím hiển thị full address
- Có 3 tickets trong "Vé của tôi"

## 🎫 Test Bán Vé

Bây giờ bạn có thể:

1. Vào **"Vé của tôi"**
2. Click vào ticket bất kỳ
3. Click **"Bán vé"**
4. Nhập giá (tối đa 110% giá gốc)
5. Confirm trong MetaMask

Approve sẽ thành công! ✅

## 📝 Lưu Ý Quan Trọng

⚠️ **Chỉ dùng private key này trên local testnet!**

- Đây là test account, KHÔNG dùng trên mainnet
- KHÔNG gửi tiền thật vào account này
- Private key này là public knowledge

## 🔄 Hardhat Test Accounts Khác

Nếu muốn test với nhiều users:

**Account #0 (Deployer)**

- Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

**Account #2 (User 1)**

- Address: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- Private Key: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

**Account #3 (User 2)**

- Address: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- Private Key: `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`

## 🚀 Workflow Đúng

1. **Mua vé**: Connect bất kỳ account nào
2. **Bán vé**: Connect account sở hữu vé đó
3. **Kiểm tra ownership**: Xem banner địa chỉ trong "Vé của tôi"

---

✅ Sau khi làm theo hướng dẫn, approve sẽ work perfectly!
