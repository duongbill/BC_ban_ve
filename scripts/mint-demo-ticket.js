/*
Mint a demo ticket with a data: tokenURI (no IPFS/CORS).

Prereqs:
  - Hardhat JSON-RPC node running on http://127.0.0.1:8545 (default)
  - deployedAddresses.json present and up-to-date (run scripts/deploy.js)

Usage (recommended):
  # Default is localhost (8545)
  $env:HARDHAT_NETWORK="localhost"; node scripts/mint-demo-ticket.js --price 50
  $env:HARDHAT_NETWORK="localhost"; node scripts/mint-demo-ticket.js --buyerIndex 10 --price 50

Note:
  Running via `npx hardhat run` will treat unknown flags (like --buyerIndex) as Hardhat params.
  Using HARDHAT_NETWORK avoids that and still uses your local node.
*/

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

const MARKET_ABI = [
  "function buyFromOrganiser(address nftContractAddress, address buyer, string tokenURI, uint256 price) external returns (uint256)",
];

const NFT_ABI = [
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
];

function parseArgs(argv) {
  const args = { buyerIndex: 10, price: "50" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--buyerIndex" || a === "--buyerindex")
      args.buyerIndex = Number(argv[++i]);
    else if (a === "--price") args.price = String(argv[++i]);
  }
  return args;
}

function toDataJsonUri(obj) {
  const json = JSON.stringify(obj);
  const b64 = Buffer.from(json, "utf8").toString("base64");
  return `data:application/json;base64,${b64}`;
}

async function main() {
  const args = parseArgs(process.argv);

  const deployedPath = path.join(__dirname, "..", "deployedAddresses.json");
  if (!fs.existsSync(deployedPath)) {
    throw new Error(
      "Missing deployedAddresses.json. Run: npx hardhat run scripts/deploy.js --network localhost8546"
    );
  }
  const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf8"));

  const nftAddress =
    deployed.sampleNFT ||
    (deployed.festivals &&
      deployed.festivals[0] &&
      deployed.festivals[0].nftContract);
  const marketplaceAddress =
    deployed.sampleMarketplace ||
    (deployed.festivals &&
      deployed.festivals[0] &&
      deployed.festivals[0].marketplace);
  const festTokenAddress = deployed.festToken;

  if (!nftAddress || !marketplaceAddress || !festTokenAddress) {
    throw new Error(
      "Missing addresses. Ensure deploy script writes sampleNFT, sampleMarketplace, festToken."
    );
  }

  const signers = await hre.ethers.getSigners();
  const buyer = signers[args.buyerIndex];
  if (!buyer) throw new Error(`No signer at index ${args.buyerIndex}`);
  const buyerAddress = await buyer.getAddress();

  const token = new hre.ethers.Contract(festTokenAddress, ERC20_ABI, buyer);
  const decimals = await token.decimals();
  const price = hre.ethers.parseUnits(args.price, decimals);

  const bal = await token.balanceOf(buyerAddress);
  if (bal < price) {
    throw new Error(
      `Buyer has insufficient FEST. balance=${hre.ethers.formatUnits(
        bal,
        decimals
      )} need=${args.price}`
    );
  }

  // Approve marketplace to spend FEST (spender must be marketplace contract)
  const allowance = await token.allowance(buyerAddress, marketplaceAddress);
  if (allowance < price) {
    const txApprove = await token.approve(marketplaceAddress, price);
    await txApprove.wait();
  }

  const metadata = {
    name: `Festival Ticket #${Date.now()}`,
    description: "Demo ticket metadata stored as data: URI (no IPFS/CORS).",
    // Optional: a tiny SVG as data URL so image always loads
    image:
      "data:image/svg+xml;base64," +
      Buffer.from(
        `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'>` +
          `<rect width='512' height='512' fill='#0f172a'/>` +
          `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#fff' font-size='28' font-family='Arial'>DEMO TICKET</text>` +
          `</svg>`,
        "utf8"
      ).toString("base64"),
    attributes: [
      { trait_type: "source", value: "local-mock" },
      { trait_type: "timestamp", value: Date.now() },
    ],
  };

  const tokenURI = toDataJsonUri(metadata);

  const market = new hre.ethers.Contract(marketplaceAddress, MARKET_ABI, buyer);
  const tx = await market.buyFromOrganiser(
    nftAddress,
    buyerAddress,
    tokenURI,
    price
  );
  const receipt = await tx.wait();

  // Parse tokenId from event TicketPurchasedFromOrganiser if possible; otherwise read latest tokenId by probing ownerOf sequentially.
  let tokenId = null;
  try {
    const iface = new hre.ethers.Interface([
      "event TicketPurchasedFromOrganiser(address indexed buyer, address indexed nftContract, uint256 indexed tokenId, uint256 price)",
    ]);
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed && parsed.name === "TicketPurchasedFromOrganiser") {
          tokenId = parsed.args.tokenId;
          break;
        }
      } catch {}
    }
  } catch {}

  const nft = new hre.ethers.Contract(nftAddress, NFT_ABI, buyer);
  if (tokenId == null) {
    // Fallback: try tokenId=1..50
    for (let i = 1n; i <= 50n; i++) {
      try {
        const owner = await nft.ownerOf(i);
        if (owner.toLowerCase() === buyerAddress.toLowerCase()) {
          tokenId = i;
        }
      } catch {}
    }
  }

  if (tokenId == null) {
    console.log("Minted, but could not determine tokenId from logs.");
    return;
  }

  const onChainUri = await nft.tokenURI(tokenId);
  console.log("✅ Minted ticket:");
  console.log("- buyer:", buyerAddress);
  console.log("- nft:", nftAddress);
  console.log("- marketplace:", marketplaceAddress);
  console.log("- tokenId:", tokenId.toString());
  console.log(
    "- tokenURI startsWith data:",
    String(onChainUri).startsWith("data:")
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
