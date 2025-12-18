const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("\n🔍 Debug Secondary Market Sale...\n");

  // Read deployed addresses
  const addresses = JSON.parse(
    fs.readFileSync("./deployedAddresses.json", "utf8")
  );

  const festTokenAddress = addresses.festToken;
  const nftAddress = addresses.sampleNFT;
  const marketplaceAddress = addresses.sampleMarketplace;

  console.log("📍 Addresses:");
  console.log("  FEST Token:", festTokenAddress);
  console.log("  NFT:", nftAddress);
  console.log("  Marketplace:", marketplaceAddress);

  // Get contracts
  const FestToken = await ethers.getContractAt("FestToken", festTokenAddress);
  const NFT = await ethers.getContractAt("FestivalNFT", nftAddress);

  // Get accounts
  const signers = await ethers.getSigners();
  const [deployer, organiser, user1, user2] = signers;

  console.log("\n👥 Accounts:");
  console.log("  Deployer:", deployer.address);
  console.log("  Organiser:", organiser.address);
  console.log("  User1:", user1.address);
  console.log("  User2:", user2.address);

  // Check balances
  console.log("\n💰 Current FEST Balances:");
  const balances = await Promise.all([
    FestToken.balanceOf(deployer.address),
    FestToken.balanceOf(organiser.address),
    FestToken.balanceOf(user1.address),
    FestToken.balanceOf(user2.address),
    FestToken.balanceOf(marketplaceAddress),
  ]);

  console.log("  Deployer:", ethers.formatEther(balances[0]), "FEST");
  console.log("  Organiser:", ethers.formatEther(balances[1]), "FEST");
  console.log("  User1:", ethers.formatEther(balances[2]), "FEST");
  console.log("  User2:", ethers.formatEther(balances[3]), "FEST");
  console.log("  Marketplace:", ethers.formatEther(balances[4]), "FEST");

  // Find tickets for sale
  console.log("\n🎫 Checking Tickets For Sale:");

  let foundTickets = [];
  for (let tokenId = 1; tokenId <= 10; tokenId++) {
    try {
      const owner = await NFT.ownerOf(tokenId);
      const isForSale = await NFT.isTicketForSale(tokenId);
      const price = await NFT.getTicketSellingPrice(tokenId);

      if (isForSale) {
        foundTickets.push({ tokenId, owner, price });
        console.log(`  Token #${tokenId}:`);
        console.log(`    Owner: ${owner}`);
        console.log(`    Price: ${ethers.formatEther(price)} FEST`);

        // Check if this is user2's ticket (the one shown as sold)
        if (owner.toLowerCase() === user2.address.toLowerCase()) {
          console.log(`    ⚠️  This is User2's ticket!`);
        }
      }
    } catch (e) {
      // Token doesn't exist
    }
  }

  if (foundTickets.length === 0) {
    console.log("  ❌ No tickets found for sale");
  }

  // Check transaction history
  console.log("\n📜 Checking Recent Marketplace Events:");
  const marketplace = await ethers.getContractAt(
    "FestivalMarketplace",
    marketplaceAddress
  );

  // Get past events
  const filter = marketplace.filters.TicketPurchasedFromCustomer();
  const events = await marketplace.queryFilter(filter, -1000, "latest");

  if (events.length > 0) {
    console.log(`  Found ${events.length} secondary sales:`);
    events.forEach((event, idx) => {
      console.log(`\n  Sale #${idx + 1}:`);
      console.log(`    Buyer: ${event.args.buyer}`);
      console.log(`    Seller: ${event.args.seller}`);
      console.log(`    Token ID: ${event.args.tokenId}`);
      console.log(`    Price: ${ethers.formatEther(event.args.price)} FEST`);
      console.log(
        `    Commission: ${ethers.formatEther(event.args.commission)} FEST`
      );
      console.log(
        `    Royalty: ${ethers.formatEther(event.args.royalty)} FEST`
      );
      console.log(
        `    Seller Got: ${ethers.formatEther(
          event.args.price - event.args.commission - event.args.royalty
        )} FEST`
      );
    });
  } else {
    console.log("  ℹ️  No secondary sales found");
  }

  console.log("\n✅ Debug complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
