// scripts/cleanup-tickets.js
// Remove tickets with invalid tokenId (timestamp-based) and keep only real blockchain tickets
const axios = require("axios");

const BASE_URL = "http://localhost:4000";

async function cleanupTickets() {
  try {
    console.log("🧹 Cleaning up invalid tickets from MongoDB...\n");

    // Get all tickets
    const response = await axios.get(`${BASE_URL}/tickets`);
    const tickets = response.data;

    console.log(`Found ${tickets.length} total tickets\n`);

    // Separate valid and invalid tickets
    // Valid tokenIds are small numbers (1, 2, 3, etc.)
    // Invalid tokenIds are timestamps (very large numbers > 1000000)
    const validTickets = tickets.filter((t) => t.tokenId < 1000);
    const invalidTickets = tickets.filter((t) => t.tokenId >= 1000);

    console.log(`Valid tickets (blockchain): ${validTickets.length}`);
    console.log(`Invalid tickets (timestamp): ${invalidTickets.length}\n`);

    if (invalidTickets.length === 0) {
      console.log("✅ No invalid tickets to clean up!");
      return;
    }

    // Delete invalid tickets
    console.log("Deleting invalid tickets...\n");
    for (const ticket of invalidTickets) {
      try {
        await axios.delete(`${BASE_URL}/tickets/${ticket.tokenId}`);
        console.log(`✅ Deleted ticket with tokenId: ${ticket.tokenId}`);
      } catch (error) {
        console.log(
          `❌ Failed to delete ticket ${ticket.tokenId}: ${error.message}`
        );
      }
    }

    console.log("\n✨ Cleanup complete!");
    console.log("\nRemaining valid tickets:");
    validTickets.forEach((ticket) => {
      console.log(
        `  - Token #${ticket.tokenId}: festivalId=${ticket.festivalId}, owner=${ticket.owner}`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error("Response:", error.response.data);
    }
  }
}

cleanupTickets();
