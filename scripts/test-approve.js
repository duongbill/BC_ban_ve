const hre = require("hardhat");
const deployedAddresses = require("../deployedAddresses.json");

async function main() {
  const [deployer, organiser] = await hre.ethers.getSigners();

  console.log("\n🔧 Testing Approve Function...\n");

  const nftAddress = deployedAddresses.sampleNFT;
  const marketplaceAddress = deployedAddresses.sampleMarketplace;
  const tokenId = 2;

  console.log(`NFT Contract: ${nftAddress}`);
  console.log(`Marketplace: ${marketplaceAddress}`);
  console.log(`Token ID: ${tokenId}`);
  console.log(`Organiser (caller): ${organiser.address}\n`);

  const FestivalNFT = await hre.ethers.getContractAt("FestivalNFT", nftAddress);

  try {
    // Check ownership
    const owner = await FestivalNFT.ownerOf(tokenId);
    console.log(`✓ Token owner: ${owner}`);
    console.log(
      `✓ Is organiser the owner? ${
        owner.toLowerCase() === organiser.address.toLowerCase()
      }\n`
    );

    // Check current approval
    const approved = await FestivalNFT.getApproved(tokenId);
    console.log(`Current approved address: ${approved}`);

    if (approved.toLowerCase() === marketplaceAddress.toLowerCase()) {
      console.log(`✅ Already approved! No need to approve again.\n`);
      return;
    }

    // Try to approve
    console.log(`\nAttempting to approve marketplace...`);
    const tx = await FestivalNFT.connect(organiser).approve(
      marketplaceAddress,
      tokenId
    );
    console.log(`Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(
      `✅ Approve successful! Gas used: ${receipt.gasUsed.toString()}`
    );

    // Verify approval
    const newApproved = await FestivalNFT.getApproved(tokenId);
    console.log(`\nNew approved address: ${newApproved}`);
    console.log(
      `✅ Marketplace is now approved: ${
        newApproved.toLowerCase() === marketplaceAddress.toLowerCase()
      }`
    );
  } catch (error) {
    console.error("\n❌ Approve failed!");
    console.error("Error message:", error.message);

    if (error.data) {
      console.error("Error data:", error.data);
    }

    // Try to decode the error
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
