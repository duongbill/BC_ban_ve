// scripts/check-token-details.js
// Check token details from blockchain
const hre = require("hardhat");
const deployedAddresses = require("../deployedAddresses.json");

async function main() {
  const [deployer, organiser] = await hre.ethers.getSigners();

  console.log("\n🔍 Checking Token Details from Blockchain...\n");

  // Get NFT contract
  const nftAddress = deployedAddresses.sampleNFT;
  console.log(`NFT Contract: ${nftAddress}\n`);

  const FestivalNFT = await hre.ethers.getContractAt("FestivalNFT", nftAddress);

  // Check tokens 1, 2, 3
  for (let tokenId = 1; tokenId <= 3; tokenId++) {
    try {
      console.log(`\n━━━ Token #${tokenId} ━━━`);

      const owner = await FestivalNFT.ownerOf(tokenId);
      console.log(`Owner: ${owner}`);

      const tokenURI = await FestivalNFT.tokenURI(tokenId);
      console.log(`TokenURI: ${tokenURI}`);

      const isForSale = await FestivalNFT.isTicketForSale(tokenId);
      console.log(`Is For Sale: ${isForSale}`);

      if (isForSale) {
        const sellingPrice = await FestivalNFT.getTicketSellingPrice(tokenId);
        console.log(
          `Selling Price: ${hre.ethers.formatEther(sellingPrice)} FEST`
        );
      }

      const isVerified = await FestivalNFT.isTicketVerified(tokenId);
      console.log(`Is Verified: ${isVerified}`);
    } catch (error) {
      console.log(`❌ Token #${tokenId} does not exist`);
    }
  }

  console.log("\n✅ Check complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
