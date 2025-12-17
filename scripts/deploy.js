const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🚀 Starting deployment...\n");

  const signers = await hre.ethers.getSigners();
  const [deployer] = signers;
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

  // Mint tokens to Hardhat accounts #10-#19 (useful for secondary market testing)
  console.log("   💵 Minting 10,000 FEST to accounts #10-#19...");
  for (let i = 10; i <= 19; i++) {
    const addr = signers[i]?.address;
    if (addr) {
      await festToken.mint(addr, mintAmount);
    }
  }
  console.log("   ✅ Tokens minted\n");

  // 2. Deploy Factory
  console.log("2️⃣  Deploying FestiveTicketsFactory...");
  const Factory = await hre.ethers.getContractFactory("FestiveTicketsFactory");
  const factory = await Factory.deploy(festTokenAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("   ✅ Factory deployed to:", factoryAddress, "\n");

  // 3. Create sample festival(s) through factory
  console.log("3️⃣  Creating sample festivals...");

  const festivalDefs = [
    {
      id: "1",
      name: "Đêm Nhạc Sài Gòn 2025",
      symbol: "SGM",
      maxTicketsPerWallet: 5,
      maxResalePercentage: 110,
    },
    {
      id: "2",
      name: "Hòa Nhạc Giao Hưởng Hà Nội",
      symbol: "HNH",
      maxTicketsPerWallet: 3,
      maxResalePercentage: 115,
    },
    {
      id: "3",
      name: "Lễ Hội Âm Nhạc Đà Nẵng",
      symbol: "DND",
      maxTicketsPerWallet: 10,
      maxResalePercentage: 120,
    },
  ];

  const createdFestivals = [];

  for (const def of festivalDefs) {
    const tx = await factory.createFestival(
      def.name,
      def.symbol,
      organiser,
      def.maxTicketsPerWallet,
      def.maxResalePercentage
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
    const nftContract = parsedEvent.args[0];
    const marketplace = parsedEvent.args[1];

    createdFestivals.push({
      id: def.id,
      name: def.name,
      symbol: def.symbol,
      organiser,
      nftContract,
      marketplace,
      maxTicketsPerWallet: def.maxTicketsPerWallet,
      maxResalePercentage: def.maxResalePercentage,
      royaltyPercentage: 5,
    });

    console.log(`   ✅ Festival ${def.symbol} NFT:`, nftContract);
    console.log(`   ✅ Festival ${def.symbol} Marketplace:`, marketplace);
  }

  // Keep legacy fields for frontend scripts that expect sample addresses
  const sampleNFTAddress = createdFestivals[0].nftContract;
  const sampleMarketplaceAddress = createdFestivals[0].marketplace;

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
    festivals: createdFestivals,
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
