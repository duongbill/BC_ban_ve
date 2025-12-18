// scripts/delete-all-tickets.js
// Delete all tickets from MongoDB
const axios = require("axios");

const BASE_URL = "http://localhost:4000";

async function deleteAllTickets() {
  try {
    console.log("🗑️ Fetching all tickets...\n");

    const response = await axios.get(`${BASE_URL}/tickets`);
    const tickets = response.data;

    console.log(`Found ${tickets.length} tickets to delete\n`);

    if (tickets.length === 0) {
      console.log("✅ No tickets to delete");
      return;
    }

    // Delete each ticket
    for (const ticket of tickets) {
      try {
        await axios.delete(`${BASE_URL}/tickets/${ticket.tokenId}`);
        console.log(`✅ Deleted ticket ${ticket.tokenId}`);
      } catch (error) {
        console.log(
          `❌ Failed to delete ticket ${ticket.tokenId}: ${error.message}`
        );
      }
    }

    console.log("\n✨ All tickets deleted!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

deleteAllTickets();
