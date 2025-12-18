const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Script phân phối FEST tokens cho TẤT CẢ 20 accounts Hardhat
 * Giải quyết vấn đề: Accounts #2-#9 không có FEST để test
 */
async function main() {
  console.log("\n💰 Phân phối FEST tokens cho tất cả accounts...\n");

  // Đọc địa chỉ FestToken
  const deployedAddressesPath = path.join(
    __dirname,
    "..",
    "deployedAddresses.json"
  );

  if (!fs.existsSync(deployedAddressesPath)) {
    console.error("❌ Không tìm thấy deployedAddresses.json!");
    console.log(
      "💡 Chạy: npx hardhat run scripts/deploy.js --network localhost"
    );
    return;
  }

  const deployedAddresses = JSON.parse(
    fs.readFileSync(deployedAddressesPath, "utf8")
  );
  const festTokenAddress = deployedAddresses.festToken;

  if (!festTokenAddress) {
    console.error("❌ Không tìm thấy địa chỉ FestToken!");
    return;
  }

  console.log("📍 FestToken address:", festTokenAddress);

  // Kết nối với contract
  const FestToken = await hre.ethers.getContractFactory("FestToken");
  const festToken = FestToken.attach(festTokenAddress);

  // Lấy tất cả 20 accounts
  const signers = await hre.ethers.getSigners();
  console.log(`\n📋 Tìm thấy ${signers.length} accounts\n`);

  // Số FEST để phân phối cho mỗi account (5000 FEST)
  const amountPerAccount = hre.ethers.parseEther("5000");

  console.log("💵 Phân phối 5,000 FEST cho mỗi account...\n");

  let successCount = 0;
  let skipCount = 0;

  // Phân phối cho TẤT CẢ accounts (0-19)
  for (let i = 0; i < Math.min(20, signers.length); i++) {
    const account = signers[i];
    const address = account.address;

    try {
      // Kiểm tra số dư hiện tại
      const currentBalance = await festToken.balanceOf(address);
      const balanceInEther = hre.ethers.formatEther(currentBalance);

      console.log(
        `Account #${i}: ${address.substring(0, 10)}...${address.substring(38)}`
      );
      console.log(`   Số dư hiện tại: ${balanceInEther} FEST`);

      // Nếu đã có >= 5000 FEST thì bỏ qua
      if (currentBalance >= amountPerAccount) {
        console.log(`   ⏭️  Đã có đủ FEST, bỏ qua\n`);
        skipCount++;
        continue;
      }

      // Mint thêm FEST
      const tx = await festToken.mint(address, amountPerAccount);
      await tx.wait();

      const newBalance = await festToken.balanceOf(address);
      const newBalanceInEther = hre.ethers.formatEther(newBalance);

      console.log(`   ✅ Mint thành công!`);
      console.log(`   Số dư mới: ${newBalanceInEther} FEST\n`);
      successCount++;
    } catch (error) {
      console.log(`   ❌ Lỗi: ${error.message}\n`);
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Hoàn thành!`);
  console.log(`   - Thành công: ${successCount} accounts`);
  console.log(`   - Bỏ qua: ${skipCount} accounts`);
  console.log(`   - Tổng: ${successCount + skipCount} accounts`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Hiển thị tổng số dư của tất cả accounts
  console.log("📊 Tổng số dư FEST của các accounts:\n");
  for (let i = 0; i < Math.min(20, signers.length); i++) {
    const account = signers[i];
    const balance = await festToken.balanceOf(account.address);
    const balanceInEther = hre.ethers.formatEther(balance);
    console.log(
      `Account #${i}: ${balanceInEther.padStart(10)} FEST (${account.address})`
    );
  }

  console.log("\n💡 Bây giờ tất cả accounts đều có thể test mua vé!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
