// scripts/check-tickets-db.js
// Check all tickets in MongoDB database
const axios = require("axios");

const BASE_URL = "http://localhost:4000";

async function checkTickets() {
  try {
    console.log("🎫 Fetching all tickets from MongoDB...\n");

    const response = await axios.get(`${BASE_URL}/tickets`);
    const tickets = response.data;

    console.log(`Found ${tickets.length} tickets:\n`);

    tickets.forEach((ticket, index) => {
      console.log(`Ticket ${index + 1}:`);
      console.log(`  - tokenId: ${ticket.tokenId}`);
      console.log(`  - festivalId: ${ticket.festivalId}`);
      console.log(`  - owner: ${ticket.owner}`);
      console.log(`  - purchasePrice: ${ticket.purchasePrice}`);
      console.log(`  - isForSale: ${ticket.isForSale}`);
      console.log("");
    });

    // Also fetch all festivals to see mapping
    console.log("\n🎪 Fetching all festivals from MongoDB...\n");
    const festivalsRes = await axios.get(`${BASE_URL}/festivals`);
    const festivals = festivalsRes.data;

    console.log(`Found ${festivals.length} festivals:\n`);
    festivals.forEach((fest) => {
      console.log(`Festival ${fest.id}: ${fest.name}`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error("Response:", error.response.data);
    }
  }
}

checkTickets();
