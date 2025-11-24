const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Festival Marketplace 2.0 contracts...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    (await ethers.provider.getBalance(deployer.address)).toString()
  );

  // 1. Deploy FestToken
  console.log("\n1. Deploying FestToken...");
  const FestToken = await ethers.getContractFactory("FestToken");
  const festToken = await FestToken.deploy(deployer.address);
  await festToken.waitForDeployment();
  const festTokenAddress = await festToken.getAddress();
  console.log("FestToken deployed to:", festTokenAddress);

  // 2. Deploy Factory
  console.log("\n2. Deploying FestiveTicketsFactory...");
  const Factory = await ethers.getContractFactory("FestiveTicketsFactory");
  const factory = await Factory.deploy(festTokenAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("FestiveTicketsFactory deployed to:", factoryAddress);

  // 3. Create a sample festival for testing
  console.log("\n3. Creating sample festival...");
  const createTx = await factory.createNewFest(
    "Summer Music Fest",
    "SMF",
    deployer.address
  );
  const receipt = await createTx.wait();

  // Get the created addresses from the event
  const event = receipt.logs.find(
    (log) => log.fragment && log.fragment.name === "FestivalCreated"
  );
  if (event) {
    const [organiser, nftContract, marketplace, name, symbol] = event.args;
    console.log("Sample Festival created:");
    console.log("  NFT Contract:", nftContract);
    console.log("  Marketplace:", marketplace);
    console.log("  Name:", name);
    console.log("  Symbol:", symbol);
  }

  // 4. Mint some FEST tokens for testing
  console.log("\n4. Minting FEST tokens for testing...");
  const mintAmount = ethers.parseEther("10000"); // 10,000 FEST tokens
  await festToken.mint(deployer.address, mintAmount);
  console.log(
    "Minted",
    ethers.formatEther(mintAmount),
    "FEST tokens to deployer"
  );

  console.log("\n=== Deployment Summary ===");
  console.log("FestToken:", festTokenAddress);
  console.log("FestiveTicketsFactory:", factoryAddress);
  console.log("Network:", await ethers.provider.getNetwork());

  // Save addresses to a file for frontend
  const fs = require("fs");
  const addresses = {
    FestToken: festTokenAddress,
    FestiveTicketsFactory: factoryAddress,
    network: (await ethers.provider.getNetwork()).name,
  };

  fs.writeFileSync(
    "./deployedAddresses.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("\nAddresses saved to deployedAddresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
