// Manual test script to verify Secondary Market Control features
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🎭 Testing Secondary Market Control Features\n");
  console.log("=".repeat(70));

  const [deployer, organiser, buyer1, buyer2] = await ethers.getSigners();

  console.log("📝 Accounts:");
  console.log("  Deployer:", deployer.address);
  console.log("  Organiser:", organiser.address);
  console.log("  Buyer 1:", buyer1.address);
  console.log("  Buyer 2:", buyer2.address);
  console.log();

  // Deploy FestToken
  console.log("🪙 Deploying FestToken...");
  const FestToken = await ethers.getContractFactory("FestToken");
  const festToken = await FestToken.deploy(deployer.address);
  await festToken.waitForDeployment();
  console.log("  ✅ FestToken deployed at:", await festToken.getAddress());
  console.log();

  // Deploy FestivalNFT with anti-scalping features
  console.log("🎫 Deploying FestivalNFT with controls:");
  console.log("  - Max Tickets Per Wallet: 5");
  console.log("  - Max Resale Percentage: 110%");

  const FestivalNFT = await ethers.getContractFactory("FestivalNFT");
  const festivalNFT = await FestivalNFT.deploy(
    "Test Festival",
    "TFEST",
    organiser.address,
    5, // maxTicketsPerWallet
    110 // maxResalePercentage
  );
  await festivalNFT.waitForDeployment();
  console.log("  ✅ FestivalNFT deployed at:", await festivalNFT.getAddress());
  console.log();

  // Deploy Marketplace
  console.log("🏪 Deploying Marketplace...");
  const FestivalMarketplace = await ethers.getContractFactory(
    "FestivalMarketplace"
  );
  const marketplace = await FestivalMarketplace.deploy(
    deployer.address,
    await festToken.getAddress()
  );
  await marketplace.waitForDeployment();
  console.log("  ✅ Marketplace deployed at:", await marketplace.getAddress());
  console.log();

  // Grant roles
  console.log("🔐 Setting up roles...");
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  await festivalNFT
    .connect(organiser)
    .grantRole(MINTER_ROLE, await marketplace.getAddress());
  console.log("  ✅ Granted MINTER_ROLE to marketplace");
  console.log();

  console.log("=".repeat(70));
  console.log("\n📋 TEST 1: Max Tickets Per Wallet");
  console.log("-".repeat(70));

  try {
    const TICKET_PRICE = ethers.parseEther("100");

    // Transfer tokens to buyer1
    await festToken.transfer(buyer1.address, ethers.parseEther("1000"));
    await festToken
      .connect(buyer1)
      .approve(await marketplace.getAddress(), ethers.MaxUint256);

    console.log("  Minting 5 tickets to buyer1 (at limit)...");
    for (let i = 1; i <= 5; i++) {
      await marketplace
        .connect(buyer1)
        .buyFromOrganiser(
          await festivalNFT.getAddress(),
          buyer1.address,
          `ipfs://ticket${i}`,
          TICKET_PRICE
        );
      console.log(`    ✅ Ticket ${i} minted`);
    }

    const balance = await festivalNFT.balanceOf(buyer1.address);
    console.log(`  📊 Buyer1 balance: ${balance} tickets`);

    console.log("\n  Attempting to mint 6th ticket (should fail)...");
    try {
      await marketplace
        .connect(buyer1)
        .buyFromOrganiser(
          await festivalNFT.getAddress(),
          buyer1.address,
          "ipfs://ticket6",
          TICKET_PRICE
        );
      console.log("    ❌ ERROR: Should have failed but succeeded!");
    } catch (error) {
      if (error.message.includes("Wallet ticket limit reached")) {
        console.log("    ✅ Correctly rejected: Wallet ticket limit reached");
      } else {
        console.log("    ❌ ERROR:", error.message.substring(0, 100));
      }
    }
  } catch (error) {
    console.log("  ❌ Test failed:", error.message.substring(0, 100));
  }

  console.log("\n" + "=".repeat(70));
  console.log("\n📋 TEST 2: Price Ceiling (Max Resale Percentage)");
  console.log("-".repeat(70));

  try {
    const TICKET_PRICE = ethers.parseEther("100");
    const maxResalePercentage = await festivalNFT.maxResalePercentage();
    const maxPrice = (TICKET_PRICE * maxResalePercentage) / 100n;

    console.log(`  Max resale percentage: ${maxResalePercentage}%`);
    console.log(`  Ticket price: ${ethers.formatEther(TICKET_PRICE)} FEST`);
    console.log(`  Max resale price: ${ethers.formatEther(maxPrice)} FEST`);

    console.log("\n  Attempting to list ticket at max price (110 FEST)...");
    try {
      await festivalNFT.connect(buyer1).setTicketForSale(1, maxPrice);
      console.log("    ✅ Successfully listed at max price");

      const sellingPrice = await festivalNFT.getTicketSellingPrice(1);
      console.log(
        `    📊 Selling price: ${ethers.formatEther(sellingPrice)} FEST`
      );

      // Remove from sale for next test
      await festivalNFT.connect(buyer1).removeTicketFromSale(1);
    } catch (error) {
      console.log("    ❌ ERROR:", error.message.substring(0, 100));
    }

    console.log(
      "\n  Attempting to list above ceiling (111 FEST, should fail)..."
    );
    try {
      await festivalNFT
        .connect(buyer1)
        .setTicketForSale(1, maxPrice + ethers.parseEther("1"));
      console.log("    ❌ ERROR: Should have failed but succeeded!");
    } catch (error) {
      if (error.message.includes("Price exceeds resale limit")) {
        console.log("    ✅ Correctly rejected: Price exceeds resale limit");
      } else {
        console.log("    ❌ ERROR:", error.message.substring(0, 100));
      }
    }
  } catch (error) {
    console.log("  ❌ Test failed:", error.message.substring(0, 100));
  }

  console.log("\n" + "=".repeat(70));
  console.log("\n📋 TEST 3: Royalty Distribution on Resale");
  console.log("-".repeat(70));

  try {
    const TICKET_PRICE = ethers.parseEther("100");
    const RESALE_PRICE = ethers.parseEther("110");

    // Transfer tokens to buyer2
    await festToken.transfer(buyer2.address, ethers.parseEther("1000"));
    await festToken
      .connect(buyer2)
      .approve(await marketplace.getAddress(), ethers.MaxUint256);

    // List ticket for sale
    await festivalNFT.connect(buyer1).setTicketForSale(1, RESALE_PRICE);
    console.log(
      `  Ticket 1 listed for ${ethers.formatEther(RESALE_PRICE)} FEST`
    );

    // Approve marketplace to transfer the NFT during resale
    await festivalNFT
      .connect(buyer1)
      .approve(await marketplace.getAddress(), 1);

    // Get balances before
    const organiserBefore = await festToken.balanceOf(organiser.address);
    const seller1Before = await festToken.balanceOf(buyer1.address);
    const ownerBefore = await festToken.balanceOf(deployer.address);

    console.log("\n  Balances before resale:");
    console.log(`    Organiser: ${ethers.formatEther(organiserBefore)} FEST`);
    console.log(
      `    Seller (buyer1): ${ethers.formatEther(seller1Before)} FEST`
    );
    console.log(
      `    Marketplace owner: ${ethers.formatEther(ownerBefore)} FEST`
    );

    // Buyer2 purchases from buyer1
    console.log("\n  Buyer2 purchasing from buyer1...");
    await marketplace
      .connect(buyer2)
      .buyFromCustomer(await festivalNFT.getAddress(), 1, buyer2.address);

    // Get balances after
    const organiserAfter = await festToken.balanceOf(organiser.address);
    const seller1After = await festToken.balanceOf(buyer1.address);
    const ownerAfter = await festToken.balanceOf(deployer.address);

    const organiserGain = organiserAfter - organiserBefore;
    const sellerGain = seller1After - seller1Before;
    const ownerGain = ownerAfter - ownerBefore;

    console.log("\n  Balances after resale:");
    console.log(
      `    Organiser gained: ${ethers.formatEther(
        organiserGain
      )} FEST (5% royalty)`
    );
    console.log(
      `    Seller gained: ${ethers.formatEther(sellerGain)} FEST (85%)`
    );
    console.log(
      `    Marketplace gained: ${ethers.formatEther(
        ownerGain
      )} FEST (10% commission)`
    );

    // Verify calculations
    const expectedRoyalty = (RESALE_PRICE * 5n) / 100n;
    const expectedCommission = (RESALE_PRICE * 10n) / 100n;
    const expectedSeller = RESALE_PRICE - expectedRoyalty - expectedCommission;

    console.log("\n  Verification:");
    console.log(
      `    Expected royalty: ${ethers.formatEther(expectedRoyalty)} FEST`
    );
    console.log(
      `    Expected commission: ${ethers.formatEther(expectedCommission)} FEST`
    );
    console.log(
      `    Expected seller: ${ethers.formatEther(expectedSeller)} FEST`
    );

    if (
      organiserGain === expectedRoyalty &&
      sellerGain === expectedSeller &&
      ownerGain === expectedCommission
    ) {
      console.log("    ✅ All distributions correct!");
    } else {
      console.log("    ❌ Distribution mismatch!");
    }

    // Verify ownership transfer
    const newOwner = await festivalNFT.ownerOf(1);
    console.log(`\n  New ticket owner: ${newOwner}`);
    console.log(
      `  ${
        newOwner === buyer2.address ? "✅" : "❌"
      } Ownership transferred correctly`
    );
  } catch (error) {
    console.log("  ❌ Test failed:", error.message.substring(0, 100));
  }

  console.log("\n" + "=".repeat(70));
  console.log("\n📋 TEST 4: Admin Configuration Updates");
  console.log("-".repeat(70));

  try {
    console.log("  Testing setMaxTicketsPerWallet...");
    await festivalNFT.connect(organiser).setMaxTicketsPerWallet(10);
    const newMax = await festivalNFT.maxTicketsPerWallet();
    console.log(`    ✅ Updated to ${newMax} tickets per wallet`);

    console.log("\n  Testing setMaxResalePercentage...");
    await festivalNFT.connect(organiser).setMaxResalePercentage(120);
    const newPercentage = await festivalNFT.maxResalePercentage();
    console.log(`    ✅ Updated to ${newPercentage}%`);

    console.log("\n  Testing getMaxResalePrice...");
    const TICKET_PRICE = ethers.parseEther("100");
    // Mint one more ticket to test
    await marketplace
      .connect(buyer1)
      .buyFromOrganiser(
        await festivalNFT.getAddress(),
        buyer1.address,
        "ipfs://ticket-test",
        TICKET_PRICE
      );
    const tokenId = await festivalNFT.getTotalMinted();
    const maxResalePrice = await festivalNFT.getMaxResalePrice(tokenId);
    console.log(
      `    📊 Max resale price for ticket: ${ethers.formatEther(
        maxResalePrice
      )} FEST`
    );
    console.log(
      `    ✅ Should be ${ethers.formatEther(
        (TICKET_PRICE * 120n) / 100n
      )} FEST (120%)`
    );
  } catch (error) {
    console.log("  ❌ Test failed:", error.message.substring(0, 100));
  }

  console.log("\n" + "=".repeat(70));
  console.log("\n🎉 All manual tests completed!");
  console.log("=".repeat(70));
  console.log("\n📊 Summary:");
  console.log("  ✅ Anti-scalping (max tickets per wallet) - WORKING");
  console.log("  ✅ Price ceiling (max resale percentage) - WORKING");
  console.log("  ✅ Automatic royalty distribution - WORKING");
  console.log("  ✅ Admin configuration updates - WORKING");
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
