const hre = require("hardhat");
const deployedAddresses = require("../deployedAddresses.json");

async function main() {
  const [deployer, organiser, user1, user2] = await hre.ethers.getSigners();

  console.log("\n🔍 Checking Token Ownership...\n");

  // Get NFT contract
  const nftAddress = deployedAddresses.sampleNFT;
  console.log(`NFT Contract: ${nftAddress}`);

  const FestivalNFT = await hre.ethers.getContractAt("FestivalNFT", nftAddress);

  // Check token supply
  try {
    const tokenId = 2n; // Token #2 that's failing

    console.log(`\nChecking Token #${tokenId}:`);

    // Check owner
    try {
      const owner = await FestivalNFT.ownerOf(tokenId);
      console.log(`  Owner: ${owner}`);

      // Check if organiser owns it
      console.log(`\n  Organiser address: ${organiser.address}`);
      console.log(
        `  Does organiser own token #2? ${
          owner.toLowerCase() === organiser.address.toLowerCase()
        }`
      );

      // Check approved
      const approved = await FestivalNFT.getApproved(tokenId);
      console.log(`  Approved address: ${approved}`);

      // Check if already for sale
      const isForSale = await FestivalNFT.isTicketForSale(tokenId);
      console.log(`  Is for sale: ${isForSale}`);

      // Check selling price
      const sellingPrice = await FestivalNFT.getTicketSellingPrice(tokenId);
      console.log(
        `  Selling price: ${hre.ethers.formatEther(sellingPrice)} FEST`
      );

      // Check if verified (used)
      const isVerified = await FestivalNFT.isTicketVerified(tokenId);
      console.log(`  Is verified (used): ${isVerified}`);
    } catch (error) {
      console.log(`  ❌ Token does not exist or error: ${error.message}`);
    }

    // List all tokens owned by organiser
    console.log(`\n\nTokens owned by organiser (${organiser.address}):`);
    const balance = await FestivalNFT.balanceOf(organiser.address);
    console.log(`  Balance: ${balance} tokens`);

    if (balance > 0) {
      console.log(`  Token IDs:`);
      // Try to find owned tokens by checking tokenIds 1-10
      for (let i = 1; i <= 10; i++) {
        try {
          const owner = await FestivalNFT.ownerOf(i);
          if (owner.toLowerCase() === organiser.address.toLowerCase()) {
            console.log(`    - Token #${i}`);
          }
        } catch {
          // Token doesn't exist, skip
        }
      }
    }

    // Check other users
    console.log(`\n\nTokens owned by user1 (${user1.address}):`);
    const user1Balance = await FestivalNFT.balanceOf(user1.address);
    console.log(`  Balance: ${user1Balance} tokens`);
    if (user1Balance > 0) {
      for (let i = 1; i <= 10; i++) {
        try {
          const owner = await FestivalNFT.ownerOf(i);
          if (owner.toLowerCase() === user1.address.toLowerCase()) {
            console.log(`    - Token #${i}`);
          }
        } catch {}
      }
    }

    console.log(`\n\nTokens owned by user2 (${user2.address}):`);
    const user2Balance = await FestivalNFT.balanceOf(user2.address);
    console.log(`  Balance: ${user2Balance} tokens`);
    if (user2Balance > 0) {
      for (let i = 1; i <= 10; i++) {
        try {
          const owner = await FestivalNFT.ownerOf(i);
          if (owner.toLowerCase() === user2.address.toLowerCase()) {
            console.log(`    - Token #${i}`);
          }
        } catch {}
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
