const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  // Read deployed addresses
  const addresses = JSON.parse(
    fs.readFileSync("./deployedAddresses.json", "utf8")
  );

  const festTokenAddress = addresses.FestToken;
  const organiser = addresses.Organiser;

  console.log("\n=== Checking FEST Token Balances ===");
  console.log("FestToken Address:", festTokenAddress);

  // Get FestToken contract
  const FestToken = await ethers.getContractAt("FestToken", festTokenAddress);

  // Check organiser balance
  console.log("\nOrganiser:", organiser);
  const organiserBalance = await FestToken.balanceOf(organiser);
  console.log("FEST Balance:", ethers.formatEther(organiserBalance), "FEST");

  // Check deployer balance
  const [deployer] = await ethers.getSigners();
  console.log("\nDeployer:", deployer.address);
  const deployerBalance = await FestToken.balanceOf(deployer.address);
  console.log("FEST Balance:", ethers.formatEther(deployerBalance), "FEST");

  // Check total supply
  const totalSupply = await FestToken.totalSupply();
  console.log("\nTotal Supply:", ethers.formatEther(totalSupply), "FEST");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
