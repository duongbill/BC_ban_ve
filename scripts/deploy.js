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

  // Use specific address for organiser
  const sampleOrganiser = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  console.log("Creating festival for organiser:", sampleOrganiser);

  const createTx = await factory.createNewFest(
    "Summer Music Fest",
    "SMF",
    sampleOrganiser
  );
  const receipt = await createTx.wait();

  // Get the created addresses from the event
  let sampleNFT = "";
  let sampleMarketplace = "";
  const event = receipt.logs.find(
    (log) => log.fragment && log.fragment.name === "FestivalCreated"
  );
  if (event) {
    const [organiser, nftContract, marketplace, name, symbol] = event.args;
    sampleNFT = nftContract;
    sampleMarketplace = marketplace;
    console.log("Sample Festival created:");
    console.log("  NFT Contract:", nftContract);
    console.log("  Marketplace:", marketplace);
    console.log("  Name:", name);
    console.log("  Symbol:", symbol);
  }

  // 4. Mint some FEST tokens for testing
  console.log("\n4. Minting FEST tokens for testing...");
  const mintAmount = ethers.parseEther("10000"); // 10,000 FEST tokens

  // Mint for deployer
  await festToken.mint(deployer.address, mintAmount);
  console.log(
    "Minted",
    ethers.formatEther(mintAmount),
    "FEST tokens to deployer:",
    deployer.address
  );

  // Mint for sample organiser
  await festToken.mint(sampleOrganiser, mintAmount);
  console.log(
    "Minted",
    ethers.formatEther(mintAmount),
    "FEST tokens to organiser:",
    sampleOrganiser
  );

  console.log("\n=== Deployment Summary ===");
  console.log("FestToken:", festTokenAddress);
  console.log("FestiveTicketsFactory:", factoryAddress);
  console.log("Sample NFT Contract:", sampleNFT);
  console.log("Sample Marketplace:", sampleMarketplace);
  console.log("Organiser:", sampleOrganiser);
  console.log("Network:", await ethers.provider.getNetwork());

  // Save addresses to a file for frontend
  const fs = require("fs");
  const addresses = {
    FestToken: festTokenAddress,
    FestiveTicketsFactory: factoryAddress,
    SampleNFT: sampleNFT,
    SampleMarketplace: sampleMarketplace,
    Organiser: sampleOrganiser,
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
