const hre = require("hardhat");

async function main() {
  console.log("\n🔍 Debugging buyFromOrganiser...\n");

  const signers = await hre.ethers.getSigners();
  const buyer = signers[2]; // Account #2
  console.log("👤 Buyer:", buyer.address);

  // Load deployed addresses
  const deployedAddresses = require("../deployedAddresses.json");
  const festTokenAddress = deployedAddresses.festToken;
  const nftAddress = deployedAddresses.sampleNFT;
  const marketplaceAddress = deployedAddresses.sampleMarketplace;

  console.log("📍 Addresses:");
  console.log("   FestToken:", festTokenAddress);
  console.log("   NFT:", nftAddress);
  console.log("   Marketplace:", marketplaceAddress);

  // Get contracts
  const festToken = await hre.ethers.getContractAt(
    "FestToken",
    festTokenAddress
  );
  const marketplace = await hre.ethers.getContractAt(
    "FestivalMarketplace",
    marketplaceAddress
  );
  const nft = await hre.ethers.getContractAt("FestivalNFT", nftAddress);

  // Check buyer balance
  const balance = await festToken.balanceOf(buyer.address);
  console.log(
    "\n💰 Buyer FEST balance:",
    hre.ethers.formatEther(balance),
    "FEST"
  );

  // Check event status
  const eventStatus = await nft.eventStatus();
  console.log("📊 Event status:", eventStatus); // 0=ACTIVE, 1=PAUSED, 2=CANCELLED, 3=COMPLETED

  // Check if marketplace has MINTER_ROLE
  const MINTER_ROLE = hre.ethers.keccak256(
    hre.ethers.toUtf8Bytes("MINTER_ROLE")
  );
  const hasRole = await nft.hasRole(MINTER_ROLE, marketplaceAddress);
  console.log("🔑 Marketplace has MINTER_ROLE:", hasRole);

  // Try to buy ticket
  const price = hre.ethers.parseEther("160"); // 160 FEST
  const tokenURI = "ipfs://Qms1zrn6v2x5r9sm20tlei5";

  console.log("\n📝 Approving tokens...");
  const approveTx = await festToken
    .connect(buyer)
    .approve(marketplaceAddress, price);
  await approveTx.wait();
  console.log("   ✅ Approved");

  console.log("\n🛒 Buying ticket...");
  try {
    const tx = await marketplace
      .connect(buyer)
      .buyFromOrganiser(nftAddress, buyer.address, tokenURI, price);
    const receipt = await tx.wait();
    console.log("   ✅ Success! Token ID:", receipt.logs);
  } catch (error) {
    console.error("\n❌ Error buying ticket:");
    console.error(error);

    // Try to get the revert reason
    if (error.data) {
      console.error("\n📋 Revert data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
