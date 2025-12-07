const fs = require("fs");
const path = require("path");

// Read deployed addresses
const deployedAddresses = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../deployedAddresses.json"), "utf8")
);

// Read current .env file
const envPath = path.join(__dirname, "../frontend/.env");
let envContent = fs.readFileSync(envPath, "utf8");

// Update contract addresses
const updates = {
  VITE_FEST_TOKEN_ADDRESS:
    deployedAddresses.festToken || "0x0000000000000000000000000000000000000000",
  VITE_FACTORY_ADDRESS:
    deployedAddresses.factory || "0x0000000000000000000000000000000000000000",
  VITE_NFT_ADDRESS:
    deployedAddresses.sampleNFT || "0x0000000000000000000000000000000000000000",
  VITE_MARKETPLACE_ADDRESS:
    deployedAddresses.sampleMarketplace ||
    "0x0000000000000000000000000000000000000000",
  VITE_ORGANISER_ADDRESS:
    deployedAddresses.organiser || "0x0000000000000000000000000000000000000000",
};

// Apply updates
Object.entries(updates).forEach(([key, value]) => {
  const regex = new RegExp(`${key}=.*`, "g");
  if (envContent.match(regex)) {
    envContent = envContent.replace(regex, `${key}=${value}`);
  } else {
    envContent += `\n${key}=${value}`;
  }
});

// Write updated .env file
fs.writeFileSync(envPath, envContent);

console.log("✅ Updated frontend/.env with deployed contract addresses:");
console.log(`   FestToken: ${updates.VITE_FEST_TOKEN_ADDRESS}`);
console.log(`   Factory: ${updates.VITE_FACTORY_ADDRESS}`);
console.log(`   Sample NFT: ${updates.VITE_NFT_ADDRESS}`);
console.log(`   Sample Marketplace: ${updates.VITE_MARKETPLACE_ADDRESS}`);
console.log(`   Organiser: ${updates.VITE_ORGANISER_ADDRESS}`);
