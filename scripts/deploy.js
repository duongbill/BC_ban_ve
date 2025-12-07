const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🚀 Starting deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log(
    "💰 Account balance:",
    hre.ethers.formatEther(
      await hre.ethers.provider.getBalance(deployer.address)
    ),
    "ETH\n"
  );

  // Use second hardhat account as organiser
  const organiser = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  console.log("🎭 Organiser address:", organiser, "\n");

  // 1. Deploy FestToken
  console.log("1️⃣  Deploying FestToken...");
  const FestToken = await hre.ethers.getContractFactory("FestToken");
  const festToken = await FestToken.deploy(deployer.address);
  await festToken.waitForDeployment();
  const festTokenAddress = await festToken.getAddress();
  console.log("   ✅ FestToken deployed to:", festTokenAddress);

  // Mint tokens to deployer and organiser
  const mintAmount = hre.ethers.parseEther("10000");
  console.log("   💵 Minting 10,000 FEST to deployer...");
  await festToken.mint(deployer.address, mintAmount);
  console.log("   💵 Minting 10,000 FEST to organiser...");
  await festToken.mint(organiser, mintAmount);
  console.log("   ✅ Tokens minted\n");

  // 2. Deploy Factory
  console.log("2️⃣  Deploying FestiveTicketsFactory...");
  const Factory = await hre.ethers.getContractFactory("FestiveTicketsFactory");
  const factory = await Factory.deploy(festTokenAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("   ✅ Factory deployed to:", factoryAddress, "\n");

  // 3. Create sample festival through factory (uses FestivalNFTv2)
  console.log("3️⃣  Creating sample festival...");
  const tx = await factory.createFestival(
    "Summer Music Festival",
    "SUMMER",
    organiser
  );
  const receipt = await tx.wait();

  // Find FestivalCreated event
  const event = receipt.logs.find((log) => {
    try {
      const parsed = factory.interface.parseLog(log);
      return parsed && parsed.name === "FestivalCreated";
    } catch {
      return false;
    }
  });

  if (!event) {
    throw new Error("FestivalCreated event not found");
  }

  const parsedEvent = factory.interface.parseLog(event);
  const sampleNFTAddress = parsedEvent.args[0];
  const sampleMarketplaceAddress = parsedEvent.args[1];

  console.log("   ✅ Sample NFT deployed to:", sampleNFTAddress);
  console.log(
    "   ✅ Sample Marketplace deployed to:",
    sampleMarketplaceAddress
  );

  console.log(
    "   ℹ️  VERIFIER_ROLE already granted to organiser (admin) by default\n"
  );

  // Save deployment addresses
  const deploymentData = {
    network: hre.network.name,
    festToken: festTokenAddress,
    factory: factoryAddress,
    sampleNFT: sampleNFTAddress,
    sampleMarketplace: sampleMarketplaceAddress,
    organiser: organiser,
    version: "v2",
  };

  const deploymentPath = path.join(__dirname, "..", "deployedAddresses.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));

  console.log("=".repeat(60));
  console.log("✅ DEPLOYMENT COMPLETE - VERSION 2");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   🪙 FestToken:", festTokenAddress);
  console.log("   🏭 Factory:", factoryAddress);
  console.log("   🎫 Sample NFT (v2):", sampleNFTAddress);
  console.log("   🏪 Sample Marketplace (v2):", sampleMarketplaceAddress);
  console.log("   🎭 Organiser:", organiser);
  console.log("\n💡 Next steps:");
  console.log("   1. Run: node scripts/update-env.js");
  console.log("   2. Import FEST token in MetaMask");
  console.log("   3. Test ticket purchase with Account #1");
  console.log("   4. Test new v2 features (batch buy, gift, verify)");
  console.log("\n🆕 New v2 Features:");
  console.log(
    "   ✨ Event status management (ACTIVE/PAUSED/CANCELLED/COMPLETED)"
  );
  console.log("   ✨ Ticket verification at entrance");
  console.log("   ✨ Gift transfer (free ticket transfers)");
  console.log("   ✨ Batch minting (up to 10 tickets at once)");
  console.log("   ✨ Royalty system (5% to organiser on resales)");
  console.log("   ✨ Used ticket tracking\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
