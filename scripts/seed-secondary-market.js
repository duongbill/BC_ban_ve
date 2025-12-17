const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

function loadDeployment() {
  const deploymentPath = path.join(__dirname, "..", "deployedAddresses.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(
      "deployedAddresses.json not found. Deploy first: npx hardhat run scripts/deploy.js --network localhost"
    );
  }
  return JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
}

function toIpfsUri(seed) {
  return `ipfs://seed-${seed}`;
}

async function extractMintedTokenIdsFromReceipt(nft, receipt) {
  const tokenIds = [];

  for (const log of receipt.logs) {
    try {
      const parsed = nft.interface.parseLog(log);
      if (parsed?.name === "Transfer") {
        const from = parsed.args[0];
        const tokenId = parsed.args[2];
        if (from === hre.ethers.ZeroAddress) {
          tokenIds.push(Number(tokenId));
        }
      }
    } catch (_) {
      // ignore logs not belonging to this contract interface
    }
  }

  return tokenIds;
}

async function main() {
  console.log("\n🌱 Seeding secondary market listings...\n");

  const deployment = loadDeployment();
  const festivals =
    Array.isArray(deployment.festivals) && deployment.festivals.length > 0
      ? deployment.festivals
      : [
          {
            id: "1",
            name: "Sample",
            symbol: "SAMPLE",
            organiser: deployment.organiser,
            nftContract: deployment.sampleNFT,
            marketplace: deployment.sampleMarketplace,
          },
        ];

  const signers = await hre.ethers.getSigners();
  const sellers = signers.slice(10, 20);

  const FestToken = await hre.ethers.getContractFactory("FestToken");
  const festToken = FestToken.attach(deployment.festToken);

  // Round-robin: each account #10-#19 creates 1 listing in one of the festivals
  for (let idx = 0; idx < sellers.length; idx++) {
    const seller = sellers[idx];
    const fest = festivals[idx % festivals.length];

    console.log(
      `🎪 Listing by account #${idx + 10} on ${fest.symbol} (${fest.id})`
    );

    const Marketplace = await hre.ethers.getContractFactory(
      "FestivalMarketplace"
    );
    const marketplace = Marketplace.attach(fest.marketplace);

    const NFT = await hre.ethers.getContractFactory("FestivalNFT");
    const nft = NFT.attach(fest.nftContract);

    // Purchase price: 100 + idx*5 FEST (unique per seller)
    const purchasePriceFEST = 100 + idx * 5;
    const purchasePriceWei = hre.ethers.parseEther(
      purchasePriceFEST.toString()
    );

    // Selling price: +5% markup (keeps within common caps)
    const sellingPriceFEST = Math.round(purchasePriceFEST * 1.05 * 100) / 100;
    const sellingPriceWei = hre.ethers.parseEther(sellingPriceFEST.toString());

    // 1) Approve FEST for primary purchase
    await festToken.connect(seller).approve(fest.marketplace, purchasePriceWei);

    // 2) Buy from organiser (mints NFT)
    const tokenURI = toIpfsUri(
      `${fest.id}-${seller.address.slice(2, 8)}-${Date.now()}`
    );
    const buyTx = await marketplace
      .connect(seller)
      .buyFromOrganiser(
        fest.nftContract,
        seller.address,
        tokenURI,
        purchasePriceWei
      );
    const buyReceipt = await buyTx.wait();

    const mintedIds = await extractMintedTokenIdsFromReceipt(nft, buyReceipt);
    if (mintedIds.length === 0) {
      throw new Error("Could not detect minted tokenId from receipt");
    }
    const tokenId = mintedIds[mintedIds.length - 1];

    // 3) List ticket for sale
    await nft.connect(seller).setTicketForSale(tokenId, sellingPriceWei);

    // 4) Approve marketplace for transfer during resale
    await nft.connect(seller).approve(fest.marketplace, tokenId);

    console.log(
      `   ✅ Token #${tokenId} listed at ${sellingPriceFEST} FEST (owner ${seller.address})\n`
    );
  }

  console.log("✅ Secondary market seeding complete.\n");
  console.log(
    "💡 Next: open the frontend and visit the secondary market page."
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
