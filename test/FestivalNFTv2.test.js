const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FestivalNFTv2", function () {
  let festivalNFT;
  let owner, admin, minter, verifier, buyer, recipient;
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));

  beforeEach(async function () {
    [owner, admin, minter, verifier, buyer, recipient] =
      await ethers.getSigners();

    const FestivalNFTv2 = await ethers.getContractFactory("FestivalNFTv2");
    festivalNFT = await FestivalNFTv2.deploy(
      "Festival Tickets",
      "FEST",
      admin.address
    );
    await festivalNFT.waitForDeployment();

    // Grant roles
    await festivalNFT.connect(admin).grantRole(MINTER_ROLE, minter.address);
    await festivalNFT.connect(admin).grantRole(VERIFIER_ROLE, verifier.address);
  });

  describe("Event Status Management", function () {
    it("Should start with ACTIVE status", async function () {
      expect(await festivalNFT.eventStatus()).to.equal(0); // 0 = ACTIVE
    });

    it("Should allow admin to change event status", async function () {
      await festivalNFT.connect(admin).setEventStatus(2); // 2 = CANCELLED
      expect(await festivalNFT.eventStatus()).to.equal(2);
    });

    it("Should emit EventStatusChanged event", async function () {
      await expect(festivalNFT.connect(admin).setEventStatus(1))
        .to.emit(festivalNFT, "EventStatusChanged")
        .withArgs(0, 1); // ACTIVE -> PAUSED
    });

    it("Should revert if non-admin tries to change status", async function () {
      await expect(festivalNFT.connect(buyer).setEventStatus(1)).to.be.reverted;
    });

    it("Should prevent minting when event is not ACTIVE", async function () {
      await festivalNFT.connect(admin).setEventStatus(2); // CANCELLED

      await expect(
        festivalNFT
          .connect(minter)
          .mintTicket(buyer.address, "ipfs://test", ethers.parseEther("50"))
      ).to.be.revertedWith("Event not active");
    });
  });

  describe("Ticket Minting", function () {
    it("Should mint a ticket successfully", async function () {
      const tx = await festivalNFT
        .connect(minter)
        .mintTicket(buyer.address, "ipfs://ticket1", ethers.parseEther("50"));

      await expect(tx)
        .to.emit(festivalNFT, "TicketMinted")
        .withArgs(buyer.address, 1, ethers.parseEther("50"));

      expect(await festivalNFT.ownerOf(1)).to.equal(buyer.address);
      expect(await festivalNFT.getTicketPurchasePrice(1)).to.equal(
        ethers.parseEther("50")
      );
    });

    it("Should revert if non-minter tries to mint", async function () {
      await expect(
        festivalNFT
          .connect(buyer)
          .mintTicket(buyer.address, "ipfs://test", ethers.parseEther("50"))
      ).to.be.reverted;
    });
  });

  describe("Batch Minting", function () {
    it("Should batch mint multiple tickets", async function () {
      const tokenURIs = ["ipfs://ticket1", "ipfs://ticket2", "ipfs://ticket3"];

      const tx = await festivalNFT
        .connect(minter)
        .batchMintTickets(buyer.address, tokenURIs, ethers.parseEther("50"));

      const receipt = await tx.wait();

      // Check all tickets were minted
      expect(await festivalNFT.balanceOf(buyer.address)).to.equal(3);
      expect(await festivalNFT.ownerOf(1)).to.equal(buyer.address);
      expect(await festivalNFT.ownerOf(2)).to.equal(buyer.address);
      expect(await festivalNFT.ownerOf(3)).to.equal(buyer.address);
    });

    it("Should revert if batch size exceeds limit", async function () {
      const tokenURIs = new Array(11).fill("ipfs://test");

      await expect(
        festivalNFT
          .connect(minter)
          .batchMintTickets(buyer.address, tokenURIs, ethers.parseEther("50"))
      ).to.be.revertedWith("Invalid batch size");
    });

    it("Should revert if batch is empty", async function () {
      await expect(
        festivalNFT
          .connect(minter)
          .batchMintTickets(buyer.address, [], ethers.parseEther("50"))
      ).to.be.revertedWith("Invalid batch size");
    });
  });

  describe("Ticket Verification", function () {
    beforeEach(async function () {
      await festivalNFT
        .connect(minter)
        .mintTicket(buyer.address, "ipfs://ticket1", ethers.parseEther("50"));
    });

    it("Should verify ticket successfully", async function () {
      const tx = await festivalNFT.connect(verifier).verifyTicket(1);

      await expect(tx)
        .to.emit(festivalNFT, "TicketVerified")
        .withArgs(
          1,
          verifier.address,
          await ethers.provider.getBlock("latest").then((b) => b.timestamp)
        );

      expect(await festivalNFT.isTicketVerified(1)).to.equal(true);
    });

    it("Should record verification time", async function () {
      await festivalNFT.connect(verifier).verifyTicket(1);

      const verificationTime = await festivalNFT.getVerificationTime(1);
      expect(verificationTime).to.be.gt(0);
    });

    it("Should revert if ticket already verified", async function () {
      await festivalNFT.connect(verifier).verifyTicket(1);

      await expect(
        festivalNFT.connect(verifier).verifyTicket(1)
      ).to.be.revertedWith("Ticket already verified");
    });

    it("Should revert if non-verifier tries to verify", async function () {
      await expect(festivalNFT.connect(buyer).verifyTicket(1)).to.be.reverted;
    });

    it("Should prevent selling verified tickets", async function () {
      await festivalNFT.connect(verifier).verifyTicket(1);

      await expect(
        festivalNFT.connect(buyer).setTicketForSale(1, ethers.parseEther("55"))
      ).to.be.revertedWith("Ticket already used");
    });
  });

  describe("Gift Transfer", function () {
    beforeEach(async function () {
      await festivalNFT
        .connect(minter)
        .mintTicket(buyer.address, "ipfs://ticket1", ethers.parseEther("50"));
    });

    it("Should gift ticket successfully", async function () {
      const tx = await festivalNFT
        .connect(buyer)
        .giftTicket(recipient.address, 1);

      await expect(tx)
        .to.emit(festivalNFT, "TicketTransferred")
        .withArgs(1, buyer.address, recipient.address, true);

      expect(await festivalNFT.ownerOf(1)).to.equal(recipient.address);
      expect(await festivalNFT.isTicketGifted(1)).to.equal(true);
    });

    it("Should remove ticket from sale when gifted", async function () {
      // List ticket for sale
      await festivalNFT
        .connect(buyer)
        .setTicketForSale(1, ethers.parseEther("55"));
      expect(await festivalNFT.isTicketForSale(1)).to.equal(true);

      // Gift the ticket
      await festivalNFT.connect(buyer).giftTicket(recipient.address, 1);

      // Should no longer be for sale
      expect(await festivalNFT.isTicketForSale(1)).to.equal(false);
    });

    it("Should revert if gifting verified ticket", async function () {
      await festivalNFT.connect(verifier).verifyTicket(1);

      await expect(
        festivalNFT.connect(buyer).giftTicket(recipient.address, 1)
      ).to.be.revertedWith("Ticket already used");
    });

    it("Should revert if non-owner tries to gift", async function () {
      await expect(
        festivalNFT.connect(recipient).giftTicket(recipient.address, 1)
      ).to.be.reverted;
    });

    it("Should revert if gifting to zero address", async function () {
      await expect(
        festivalNFT.connect(buyer).giftTicket(ethers.ZeroAddress, 1)
      ).to.be.revertedWith("Invalid recipient");
    });
  });

  describe("Ticket Sale", function () {
    beforeEach(async function () {
      await festivalNFT
        .connect(minter)
        .mintTicket(buyer.address, "ipfs://ticket1", ethers.parseEther("50"));
    });

    it("Should list ticket for sale", async function () {
      const sellingPrice = ethers.parseEther("55");

      await expect(festivalNFT.connect(buyer).setTicketForSale(1, sellingPrice))
        .to.emit(festivalNFT, "TicketListedForSale")
        .withArgs(1, sellingPrice);

      expect(await festivalNFT.isTicketForSale(1)).to.equal(true);
      expect(await festivalNFT.getTicketSellingPrice(1)).to.equal(sellingPrice);
    });

    it("Should enforce 110% price limit", async function () {
      const tooHighPrice = ethers.parseEther("56"); // More than 110%

      await expect(
        festivalNFT.connect(buyer).setTicketForSale(1, tooHighPrice)
      ).to.be.revertedWith("Price exceeds 110% limit");
    });

    it("Should remove ticket from sale", async function () {
      await festivalNFT
        .connect(buyer)
        .setTicketForSale(1, ethers.parseEther("55"));

      await expect(festivalNFT.connect(buyer).removeTicketFromSale(1))
        .to.emit(festivalNFT, "TicketRemovedFromSale")
        .withArgs(1);

      expect(await festivalNFT.isTicketForSale(1)).to.equal(false);
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      // Mint 3 tickets to buyer
      await festivalNFT
        .connect(minter)
        .mintTicket(buyer.address, "ipfs://ticket1", ethers.parseEther("50"));
      await festivalNFT
        .connect(minter)
        .mintTicket(buyer.address, "ipfs://ticket2", ethers.parseEther("50"));
      await festivalNFT
        .connect(minter)
        .mintTicket(
          recipient.address,
          "ipfs://ticket3",
          ethers.parseEther("50")
        );

      // List token 1 for sale
      await festivalNFT
        .connect(buyer)
        .setTicketForSale(1, ethers.parseEther("55"));
    });

    it("Should get tickets owned by address", async function () {
      const tickets = await festivalNFT.getTicketsOwnedBy(buyer.address);
      expect(tickets.length).to.equal(2);
      expect(tickets[0]).to.equal(1);
      expect(tickets[1]).to.equal(2);
    });

    it("Should get tickets for sale", async function () {
      const forSale = await festivalNFT.getTicketsForSale();
      expect(forSale.length).to.equal(1);
      expect(forSale[0]).to.equal(1);
    });

    it("Should get total minted", async function () {
      expect(await festivalNFT.getTotalMinted()).to.equal(3);
    });
  });

  describe("Pause Functionality", function () {
    it("Should pause and unpause", async function () {
      await festivalNFT.connect(admin).pause();

      await expect(
        festivalNFT
          .connect(minter)
          .mintTicket(buyer.address, "ipfs://test", ethers.parseEther("50"))
      ).to.be.reverted;

      await festivalNFT.connect(admin).unpause();

      await expect(
        festivalNFT
          .connect(minter)
          .mintTicket(buyer.address, "ipfs://test", ethers.parseEther("50"))
      ).to.not.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple gift transfers", async function () {
      await festivalNFT
        .connect(minter)
        .mintTicket(buyer.address, "ipfs://ticket1", ethers.parseEther("50"));

      // First gift
      await festivalNFT.connect(buyer).giftTicket(recipient.address, 1);
      expect(await festivalNFT.ownerOf(1)).to.equal(recipient.address);

      // Second gift
      await festivalNFT.connect(recipient).giftTicket(buyer.address, 1);
      expect(await festivalNFT.ownerOf(1)).to.equal(buyer.address);
    });

    it("Should handle verification in COMPLETED state", async function () {
      await festivalNFT
        .connect(minter)
        .mintTicket(buyer.address, "ipfs://ticket1", ethers.parseEther("50"));

      await festivalNFT.connect(admin).setEventStatus(3); // COMPLETED

      // Should still allow verification
      await expect(festivalNFT.connect(verifier).verifyTicket(1)).to.not.be
        .reverted;
    });

    it("Should revert queries for non-existent tokens", async function () {
      await expect(festivalNFT.getTicketPurchasePrice(999)).to.be.revertedWith(
        "Token does not exist"
      );

      await expect(festivalNFT.isTicketVerified(999)).to.be.revertedWith(
        "Token does not exist"
      );
    });
  });
});
