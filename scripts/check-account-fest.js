const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  // Địa chỉ account cần check (copy từ MetaMask)
  const accountToCheck = process.argv[2];

  if (!accountToCheck) {
    console.log("\n❌ Vui lòng cung cấp địa chỉ account!");
    console.log(
      "Cách dùng: node scripts/check-account-fest.js 0xYourAddress\n"
    );
    return;
  }

  // Read deployed addresses
  const addresses = JSON.parse(
    fs.readFileSync("./deployedAddresses.json", "utf8")
  );

  const festTokenAddress = addresses.festToken;

  console.log("\n=== Kiểm Tra Số Dư FEST ===");
  console.log("FestToken Address:", festTokenAddress);
  console.log("Account Address:", accountToCheck);

  // Get FestToken contract
  const FestToken = await ethers.getContractAt("FestToken", festTokenAddress);

  // Check balance
  try {
    const balance = await FestToken.balanceOf(accountToCheck);
    const balanceFormatted = ethers.formatEther(balance);

    console.log("\n📊 Số dư FEST:", balanceFormatted, "FEST");

    if (balance === 0n) {
      console.log("\n⚠️  Account này CHƯA CÓ FEST token!");
      console.log("💡 Giải pháp:");
      console.log(
        "   1. Mint FEST cho account này: npx hardhat run scripts/distribute-fest-to-all.js --network localhost"
      );
      console.log("   2. Hoặc import account khác có FEST:");

      const signers = await ethers.getSigners();
      console.log("\n📋 Các account có 10,000 FEST:");
      for (let i = 0; i < 2; i++) {
        const addr = signers[i].address;
        const bal = await FestToken.balanceOf(addr);
        console.log(
          `   Account #${i}: ${addr} - ${ethers.formatEther(bal)} FEST`
        );
      }
    } else {
      console.log("\n✅ Account có FEST token!");
      console.log("💡 Nếu không thấy trong MetaMask:");
      console.log("   1. Scroll xuống dưới cùng trong tab Tokens");
      console.log("   2. Click 'Refresh list' hoặc");
      console.log("   3. Đóng mở lại MetaMask");
    }
  } catch (error) {
    console.error("\n❌ Lỗi:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
