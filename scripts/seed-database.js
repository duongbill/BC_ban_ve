// scripts/seed-database.js
// Script to seed initial festival and ticket data into MongoDB
const axios = require("axios");

const BASE_URL = "http://localhost:4000";

const festivals = [
  {
    id: "1",
    name: "Summer Music Festival",
    symbol: "SMF",
    nftContract: "0x32467b43BFa67273FC7dDda0999Ee9A12F2AaA08",
    marketplace: "0x4ABEaCA4b05d8fA4CED09D26aD28Ea298E8afaC8",
    organiser: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    totalTickets: 1000,
    ticketsForSale: 800,
    maxTicketsPerWallet: 10,
    maxResalePercentage: 50,
    royaltyPercentage: 5,
  },
  {
    id: "2",
    name: "Classical Music Night",
    symbol: "CMN",
    nftContract: "0x32467b43BFa67273FC7dDda0999Ee9A12F2AaA08",
    marketplace: "0x4ABEaCA4b05d8fA4CED09D26aD28Ea298E8afaC8",
    organiser: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    totalTickets: 500,
    ticketsForSale: 350,
    maxTicketsPerWallet: 5,
    maxResalePercentage: 30,
    royaltyPercentage: 10,
  },
  {
    id: "3",
    name: "Beach Festival 2025",
    symbol: "BF25",
    nftContract: "0x32467b43BFa67273FC7dDda0999Ee9A12F2AaA08",
    marketplace: "0x4ABEaCA4b05d8fA4CED09D26aD28Ea298E8afaC8",
    organiser: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    totalTickets: 1500,
    ticketsForSale: 1200,
    maxTicketsPerWallet: 15,
    maxResalePercentage: 40,
    royaltyPercentage: 5,
  },
  {
    id: "4",
    name: "Jazz Under The Stars",
    symbol: "JUTS",
    nftContract: "0x32467b43BFa67273FC7dDda0999Ee9A12F2AaA08",
    marketplace: "0x4ABEaCA4b05d8fA4CED09D26aD28Ea298E8afaC8",
    organiser: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    totalTickets: 300,
    ticketsForSale: 250,
    maxTicketsPerWallet: 4,
    maxResalePercentage: 25,
    royaltyPercentage: 8,
  },
  {
    id: "5",
    name: "Rock Revolution 2025",
    symbol: "RR25",
    nftContract: "0x32467b43BFa67273FC7dDda0999Ee9A12F2AaA08",
    marketplace: "0x4ABEaCA4b05d8fA4CED09D26aD28Ea298E8afaC8",
    organiser: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    totalTickets: 2000,
    ticketsForSale: 1800,
    maxTicketsPerWallet: 20,
    maxResalePercentage: 60,
    royaltyPercentage: 7,
  },
  {
    id: "6",
    name: "Electronic Wonderland",
    symbol: "EW",
    nftContract: "0x32467b43BFa67273FC7dDda0999Ee9A12F2AaA08",
    marketplace: "0x4ABEaCA4b05d8fA4CED09D26aD28Ea298E8afaC8",
    organiser: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    totalTickets: 3000,
    ticketsForSale: 2500,
    maxTicketsPerWallet: 25,
    maxResalePercentage: 70,
    royaltyPercentage: 6,
  },
  {
    id: "7",
    name: "Acoustic Winter Sessions",
    symbol: "AWS",
    nftContract: "0x32467b43BFa67273FC7dDda0999Ee9A12F2AaA08",
    marketplace: "0x4ABEaCA4b05d8fA4CED09D26aD28Ea298E8afaC8",
    organiser: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    totalTickets: 200,
    ticketsForSale: 150,
    maxTicketsPerWallet: 3,
    maxResalePercentage: 20,
    royaltyPercentage: 5,
  },
  {
    id: "8",
    name: "Urban Beats Festival",
    symbol: "UBF",
    nftContract: "0x32467b43BFa67273FC7dDda0999Ee9A12F2AaA08",
    marketplace: "0x4ABEaCA4b05d8fA4CED09D26aD28Ea298E8afaC8",
    organiser: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    totalTickets: 1200,
    ticketsForSale: 1000,
    maxTicketsPerWallet: 12,
    maxResalePercentage: 45,
    royaltyPercentage: 8,
  },
  {
    id: "9",
    name: "Đêm Nhạc Sài Gòn 2025",
    symbol: "SGM",
    nftContract: "0x32467b43BFa67273FC7dDda0999Ee9A12F2AaA08",
    marketplace: "0x4ABEaCA4b05d8fA4CED09D26aD28Ea298E8afaC8",
    organiser: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    totalTickets: 1000,
    ticketsForSale: 800,
    maxTicketsPerWallet: 10,
    maxResalePercentage: 50,
    royaltyPercentage: 5,
  },
];

const tickets = [
  {
    tokenId: 1,
    tokenURI: "ipfs://QmSampleURI1",
    purchasePrice: "50",
    sellingPrice: "60",
    isForSale: true,
    owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    festivalId: "1",
    isGifted: false,
    isVerified: true,
  },
  {
    tokenId: 2,
    tokenURI: "ipfs://QmSampleURI2",
    purchasePrice: "100",
    sellingPrice: "120",
    isForSale: true,
    owner: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    festivalId: "1",
    isGifted: false,
    isVerified: true,
  },
  {
    tokenId: 3,
    tokenURI: "ipfs://QmSampleURI3",
    purchasePrice: "80",
    sellingPrice: "95",
    isForSale: true,
    owner: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    festivalId: "2",
    isGifted: false,
    isVerified: true,
  },
];

async function seedDatabase() {
  console.log("🌱 Seeding database...\n");

  try {
    // Seed festivals
    console.log("📝 Creating festivals...");
    for (const festival of festivals) {
      try {
        const res = await axios.post(`${BASE_URL}/festivals`, festival);
        console.log(`✅ Created festival: ${festival.name}`);
      } catch (err) {
        if (err.response?.status === 400) {
          console.log(`⚠️  Festival ${festival.name} already exists`);
        } else {
          console.error(
            `❌ Failed to create festival ${festival.name}:`,
            err.message
          );
        }
      }
    }

    console.log("\n📝 Creating tickets...");
    // Seed tickets
    for (const ticket of tickets) {
      try {
        const res = await axios.post(`${BASE_URL}/tickets`, ticket);
        console.log(
          `✅ Created ticket #${ticket.tokenId} for festival ${ticket.festivalId}`
        );
      } catch (err) {
        if (err.response?.status === 400) {
          console.log(`⚠️  Ticket #${ticket.tokenId} already exists`);
        } else {
          console.error(
            `❌ Failed to create ticket #${ticket.tokenId}:`,
            err.message
          );
        }
      }
    }

    console.log("\n✅ Database seeding completed!");

    // Display summary
    const allFests = await axios.get(`${BASE_URL}/festivals`);
    const allTickets = await axios.get(`${BASE_URL}/tickets`);
    console.log(`\n📊 Summary:`);
    console.log(`   Festivals: ${allFests.data.length}`);
    console.log(`   Tickets: ${allTickets.data.length}`);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    console.error("Make sure MongoDB and backend server are running!");
  }
}

seedDatabase();
