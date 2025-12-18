// scripts/update-ticket-festival.js
// Update festivalId for a specific ticket
const axios = require("axios");

const BASE_URL = "http://localhost:4000";

async function updateTicketFestival() {
  try {
    // Lấy thông tin từ command line arguments
    const tokenId = process.argv[2];
    const festivalId = process.argv[3];

    if (!tokenId || !festivalId) {
      console.log(
        "Usage: node update-ticket-festival.js <tokenId> <festivalId>"
      );
      console.log("Example: node update-ticket-festival.js 2 3");
      return;
    }

    console.log(
      `🔄 Updating ticket ${tokenId} to festivalId ${festivalId}...\n`
    );

    // Update ticket
    const response = await axios.put(`${BASE_URL}/tickets/${tokenId}`, {
      festivalId: parseInt(festivalId),
    });

    console.log("✅ Ticket updated successfully!");
    console.log(response.data);

    // Verify
    console.log("\n🔍 Verifying update...");
    const ticket = await axios.get(`${BASE_URL}/tickets/${tokenId}`);
    console.log(
      `Token #${ticket.data.tokenId}: festivalId = ${ticket.data.festivalId}`
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error("Response:", error.response.data);
    }
  }
}

updateTicketFestival();
