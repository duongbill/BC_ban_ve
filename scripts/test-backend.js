// scripts/test-backend.js
// Script to test backend API for festivals and tickets
const axios = require("axios");

const BASE_URL = "http://localhost:4000";

async function testBackend() {
  try {
    // 1. Create a festival
    const festivalRes = await axios
      .post(`${BASE_URL}/festivals`, {
        id: "testfest1",
        name: "Test Festival",
        symbol: "TEST",
        nftContract: "0x123",
        marketplace: "0x456",
        organiser: "0x789",
        totalTickets: 100,
        ticketsForSale: 50,
        maxTicketsPerWallet: 5,
        maxResalePercentage: 20,
        royaltyPercentage: 10,
      })
      .catch((e) => e.response);
    console.log("Create festival:", festivalRes.data);

    // 2. Get all festivals
    const allFests = await axios.get(`${BASE_URL}/festivals`);
    console.log("All festivals:", allFests.data);

    // 3. Get festival by id
    const festById = await axios.get(`${BASE_URL}/festivals/testfest1`);
    console.log("Festival by id:", festById.data);

    // 4. Create a ticket
    const ticketRes = await axios.post(`${BASE_URL}/tickets`, {
      tokenId: 1001,
      tokenURI: "ipfs://testuri",
      purchasePrice: "50",
      sellingPrice: "60",
      isForSale: true,
      owner: "0xabc",
      festivalId: "testfest1",
      isGifted: false,
      isVerified: false,
    });
    console.log("Create ticket:", ticketRes.data);

    // 5. Get tickets for festival
    const tickets = await axios.get(`${BASE_URL}/tickets?festivalId=testfest1`);
    console.log("Tickets for festival:", tickets.data);

    // 6. Update ticket (resale)
    const updateTicket = await axios.put(`${BASE_URL}/tickets/1001`, {
      sellingPrice: "70",
      isForSale: false,
      owner: "0xdef",
    });
    console.log("Update ticket:", updateTicket.data);

    // 7. Get tickets again
    const tickets2 = await axios.get(
      `${BASE_URL}/tickets?festivalId=testfest1`
    );
    console.log("Tickets after update:", tickets2.data);
  } catch (err) {
    console.error("Test failed:", err.response ? err.response.data : err);
  }
}

testBackend();
