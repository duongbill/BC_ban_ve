const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Secondary Market Control", function () {
  let festivalNFT;
  let festToken;
  let marketplace;
  let owner, admin, buyer1, buyer2, buyer3, organiser;
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));

  const TICKET_PRICE = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, admin, buyer1, buyer2, buyer3, organiser] =
      await ethers.getSigners();

    // Deploy FestToken
    const FestToken = await ethers.getContractFactory("FestToken");
    festToken = await FestToken.deploy(owner.address);
    await festToken.waitForDeployment();

    // Deploy FestivalNFT with anti-scalping features
    const FestivalNFT = await ethers.getContractFactory("FestivalNFT");
    festivalNFT = await FestivalNFT.deploy(
      "Festival Tickets",
      "FEST",
      organiser.address,
      5, // maxTicketsPerWallet = 5
      110 // maxResalePercentage = 110%
    );
    await festivalNFT.waitForDeployment();

    // Deploy Marketplace
    const FestivalMarketplace = await ethers.getContractFactory(
      "FestivalMarketplace"
    );
    marketplace = await FestivalMarketplace.deploy(
      owner.address,
      await festToken.getAddress()
    );
    await marketplace.waitForDeployment();

    // Grant roles
    await festivalNFT
      .connect(organiser)
      .grantRole(MINTER_ROLE, await marketplace.getAddress());
    await festivalNFT
      .connect(organiser)
      .grantRole(VERIFIER_ROLE, organiser.address);

    // Transfer tokens to buyers
    await festToken.transfer(buyer1.address, ethers.parseEther("10000"));
    await festToken.transfer(buyer2.address, ethers.parseEther("10000"));
    await festToken.transfer(buyer3.address, ethers.parseEther("10000"));

    // Approve marketplace
    await festToken
      .connect(buyer1)
      .approve(await marketplace.getAddress(), ethers.MaxUint256);
    await festToken
      .connect(buyer2)
      .approve(await marketplace.getAddress(), ethers.MaxUint256);
    await festToken
      .connect(buyer3)
      .approve(await marketplace.getAddress(), ethers.MaxUint256);
  });

  describe("1. Anti-Scalping: Max Tickets Per Wallet", function () {
    it("Should enforce maxTicketsPerWallet limit", async function () {
      const maxTickets = await festivalNFT.maxTicketsPerWallet();
      expect(maxTickets).to.equal(5);
    });

    it("Should allow minting up to the limit", async function () {
      // Mint 5 tickets (at the limit)
      for (let i = 0; i < 5; i++) {
        await festivalNFT
          .connect(organiser)
          .mintTicket(buyer1.address, `ipfs://ticket${i}`, TICKET_PRICE);
      }

      expect(await festivalNFT.balanceOf(buyer1.address)).to.equal(5);
    });

    it("Should prevent minting beyond the limit", async function () {
      // Mint 5 tickets
      for (let i = 0; i < 5; i++) {
        await festivalNFT
          .connect(organiser)
          .mintTicket(buyer1.address, `ipfs://ticket${i}`, TICKET_PRICE);
      }

      // Try to mint 6th ticket - should fail
      await expect(
        festivalNFT
          .connect(organiser)
          .mintTicket(buyer1.address, "ipfs://ticket6", TICKET_PRICE)
      ).to.be.revertedWith("Wallet ticket limit reached");
    });

    it("Should enforce limit on batch minting", async function () {
      // Try to mint 6 tickets at once - should fail
      const tokenURIs = Array.from(
        { length: 6 },
        (_, i) => `ipfs://ticket${i}`
      );

      await expect(
        festivalNFT
          .connect(organiser)
          .batchMintTickets(buyer1.address, tokenURIs, TICKET_PRICE)
      ).to.be.revertedWith("Batch would exceed wallet ticket limit");
    });

    it("Should allow batch minting within limit", async function () {
      const tokenURIs = Array.from(
        { length: 5 },
        (_, i) => `ipfs://ticket${i}`
      );

      await festivalNFT
        .connect(organiser)
        .batchMintTickets(buyer1.address, tokenURIs, TICKET_PRICE);

      expect(await festivalNFT.balanceOf(buyer1.address)).to.equal(5);
    });

    it("Should allow admin to update maxTicketsPerWallet", async function () {
      await festivalNFT.connect(organiser).setMaxTicketsPerWallet(10);
      expect(await festivalNFT.maxTicketsPerWallet()).to.equal(10);

      // Now should be able to mint up to 10
      for (let i = 0; i < 10; i++) {
        await festivalNFT
          .connect(organiser)
          .mintTicket(buyer2.address, `ipfs://ticket${i}`, TICKET_PRICE);
      }

      expect(await festivalNFT.balanceOf(buyer2.address)).to.equal(10);
    });

    it("Should emit MaxTicketsPerWalletUpdated event", async function () {
      await expect(festivalNFT.connect(organiser).setMaxTicketsPerWallet(10))
        .to.emit(festivalNFT, "MaxTicketsPerWalletUpdated")
        .withArgs(5, 10);
    });

    it("Should allow unlimited tickets when set to 0", async function () {
      await festivalNFT.connect(organiser).setMaxTicketsPerWallet(0);

      // Mint more than previous limit
      for (let i = 0; i < 10; i++) {
        await festivalNFT
          .connect(organiser)
          .mintTicket(buyer1.address, `ipfs://ticket${i}`, TICKET_PRICE);
      }

      expect(await festivalNFT.balanceOf(buyer1.address)).to.equal(10);
    });

    it("Should prevent non-admin from updating limit", async function () {
      await expect(festivalNFT.connect(buyer1).setMaxTicketsPerWallet(100)).to
        .be.reverted;
    });
  });

  describe("2. Price Ceiling: Max Resale Percentage", function () {
    beforeEach(async function () {
      // Mint a ticket to buyer1
      await festivalNFT
        .connect(organiser)
        .mintTicket(buyer1.address, "ipfs://ticket1", TICKET_PRICE);
    });

    it("Should enforce maxResalePercentage limit", async function () {
      const maxPercentage = await festivalNFT.maxResalePercentage();
      expect(maxPercentage).to.equal(110);
    });

    it("Should allow listing at exactly the price ceiling", async function () {
      const maxPrice = (TICKET_PRICE * 110n) / 100n; // 110 FEST

      await festivalNFT.connect(buyer1).setTicketForSale(1, maxPrice);

      expect(await festivalNFT.isTicketForSale(1)).to.be.true;
      expect(await festivalNFT.getTicketSellingPrice(1)).to.equal(maxPrice);
    });

    it("Should prevent listing above price ceiling", async function () {
      const overPrice = (TICKET_PRICE * 111n) / 100n; // 111 FEST - exceeds limit

      await expect(
        festivalNFT.connect(buyer1).setTicketForSale(1, overPrice)
      ).to.be.revertedWith("Price exceeds resale limit");
    });

    it("Should calculate max resale price correctly", async function () {
      const maxPrice = await festivalNFT.getMaxResalePrice(1);
      const expected = (TICKET_PRICE * 110n) / 100n;

      expect(maxPrice).to.equal(expected);
    });

    it("Should allow admin to update maxResalePercentage", async function () {
      await festivalNFT.connect(organiser).setMaxResalePercentage(120);
      expect(await festivalNFT.maxResalePercentage()).to.equal(120);

      // Now can list at 120%
      const newMaxPrice = (TICKET_PRICE * 120n) / 100n;
      await festivalNFT.connect(buyer1).setTicketForSale(1, newMaxPrice);

      expect(await festivalNFT.isTicketForSale(1)).to.be.true;
    });

    it("Should emit MaxResalePercentageUpdated event", async function () {
      await expect(festivalNFT.connect(organiser).setMaxResalePercentage(120))
        .to.emit(festivalNFT, "MaxResalePercentageUpdated")
        .withArgs(110, 120);
    });

    it("Should reject percentage below 100%", async function () {
      await expect(
        festivalNFT.connect(organiser).setMaxResalePercentage(99)
      ).to.be.revertedWith("Percentage must be >= 100");
    });

    it("Should prevent non-admin from updating percentage", async function () {
      await expect(festivalNFT.connect(buyer1).setMaxResalePercentage(200)).to
        .be.reverted;
    });

    it("Should work with different price ceilings for different festivals", async function () {
      // Deploy another festival with different ceiling
      const FestivalNFT2 = await ethers.getContractFactory("FestivalNFT");
      const festivalNFT2 = await FestivalNFT2.deploy(
        "Festival 2",
        "FEST2",
        organiser.address,
        5,
        105 // Only 105% ceiling
      );
      await festivalNFT2.waitForDeployment();

      expect(await festivalNFT2.maxResalePercentage()).to.equal(105);
      expect(await festivalNFT.maxResalePercentage()).to.equal(110);
    });
  });

  describe("3. Royalty Distribution", function () {
    let tokenId;

    beforeEach(async function () {
      // Buyer1 purchases ticket from organiser
      const tx = await marketplace
        .connect(buyer1)
        .buyFromOrganiser(
          await festivalNFT.getAddress(),
          buyer1.address,
          "ipfs://ticket1",
          TICKET_PRICE
        );
      const receipt = await tx.wait();

      // Get tokenId from event
      const event = receipt.logs.find(
        (log) =>
          log.fragment && log.fragment.name === "TicketPurchasedFromOrganiser"
      );
      tokenId = event.args.tokenId;

      // Buyer1 lists ticket for resale at 110 FEST
      const resalePrice = ethers.parseEther("110");
      await festivalNFT.connect(buyer1).setTicketForSale(tokenId, resalePrice);

      // Approve marketplace to transfer the NFT during resale
      await festivalNFT
        .connect(buyer1)
        .approve(await marketplace.getAddress(), tokenId);

      // Buyer2 approves tokens
      await festToken
        .connect(buyer2)
        .approve(await marketplace.getAddress(), ethers.MaxUint256);
    });

    it("Should distribute royalty correctly on resale", async function () {
      const resalePrice = ethers.parseEther("110");

      const organiserBalanceBefore = await festToken.balanceOf(
        organiser.address
      );
      const sellerBalanceBefore = await festToken.balanceOf(buyer1.address);
      const ownerBalanceBefore = await festToken.balanceOf(owner.address);

      // Buyer2 buys from buyer1
      await marketplace
        .connect(buyer2)
        .buyFromCustomer(
          await festivalNFT.getAddress(),
          tokenId,
          buyer2.address
        );

      const organiserBalanceAfter = await festToken.balanceOf(
        organiser.address
      );
      const sellerBalanceAfter = await festToken.balanceOf(buyer1.address);
      const ownerBalanceAfter = await festToken.balanceOf(owner.address);

      // Calculate expected amounts
      const expectedRoyalty = (resalePrice * 5n) / 100n; // 5% = 5.5 FEST
      const expectedCommission = (resalePrice * 10n) / 100n; // 10% = 11 FEST
      const expectedSellerAmount =
        resalePrice - expectedRoyalty - expectedCommission; // 93.5 FEST

      expect(organiserBalanceAfter - organiserBalanceBefore).to.equal(
        expectedRoyalty
      );
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(
        expectedCommission
      );
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(
        expectedSellerAmount
      );
    });

    it("Should emit RoyaltyPaid event", async function () {
      const resalePrice = ethers.parseEther("110");
      const expectedRoyalty = (resalePrice * 5n) / 100n;

      await expect(
        marketplace
          .connect(buyer2)
          .buyFromCustomer(
            await festivalNFT.getAddress(),
            tokenId,
            buyer2.address
          )
      )
        .to.emit(marketplace, "RoyaltyPaid")
        .withArgs(
          await festivalNFT.getAddress(),
          organiser.address,
          expectedRoyalty
        );
    });

    it("Should calculate resale fees correctly", async function () {
      const resalePrice = ethers.parseEther("110");

      const [commission, royalty, sellerAmount] =
        await marketplace.calculateResaleFees(resalePrice);

      expect(commission).to.equal(ethers.parseEther("11")); // 10%
      expect(royalty).to.equal(ethers.parseEther("5.5")); // 5%
      expect(sellerAmount).to.equal(ethers.parseEther("93.5")); // 85%
    });

    it("Should transfer NFT ownership after resale", async function () {
      await marketplace
        .connect(buyer2)
        .buyFromCustomer(
          await festivalNFT.getAddress(),
          tokenId,
          buyer2.address
        );

      expect(await festivalNFT.ownerOf(tokenId)).to.equal(buyer2.address);
    });

    it("Should remove ticket from sale after purchase", async function () {
      await marketplace
        .connect(buyer2)
        .buyFromCustomer(
          await festivalNFT.getAddress(),
          tokenId,
          buyer2.address
        );

      expect(await festivalNFT.isTicketForSale(tokenId)).to.be.false;
    });
  });

  describe("4. Integration Tests", function () {
    it("Should handle complete ticket lifecycle with limits", async function () {
      // 1. Mint tickets with limit check
      for (let i = 0; i < 5; i++) {
        await festivalNFT
          .connect(organiser)
          .mintTicket(buyer1.address, `ipfs://ticket${i}`, TICKET_PRICE);
      }

      // 2. Try to mint 6th - should fail
      await expect(
        festivalNFT
          .connect(organiser)
          .mintTicket(buyer1.address, "ipfs://ticket6", TICKET_PRICE)
      ).to.be.revertedWith("Wallet ticket limit reached");

      // 3. List ticket for resale at max price
      const maxPrice = (TICKET_PRICE * 110n) / 100n;
      await festivalNFT.connect(buyer1).setTicketForSale(1, maxPrice);

      // 4. Try to list above max - should fail
      await festivalNFT.connect(buyer1).removeTicketFromSale(1);
      await expect(
        festivalNFT.connect(buyer1).setTicketForSale(1, maxPrice + 1n)
      ).to.be.revertedWith("Price exceeds resale limit");

      // 5. List at valid price and sell
      await festivalNFT.connect(buyer1).setTicketForSale(1, maxPrice);

      // Approve marketplace to transfer the NFT during resale
      await festivalNFT
        .connect(buyer1)
        .approve(await marketplace.getAddress(), 1);

      await marketplace
        .connect(buyer2)
        .buyFromCustomer(await festivalNFT.getAddress(), 1, buyer2.address);

      // 6. Verify new ownership and buyer1 now has 4 tickets
      expect(await festivalNFT.ownerOf(1)).to.equal(buyer2.address);
      expect(await festivalNFT.balanceOf(buyer1.address)).to.equal(4);
      expect(await festivalNFT.balanceOf(buyer2.address)).to.equal(1);
    });

    it("Should prevent scalping across multiple wallets", async function () {
      // Each buyer can only get 5 tickets
      const buyers = [buyer1, buyer2, buyer3];

      for (const buyer of buyers) {
        for (let i = 0; i < 5; i++) {
          await festivalNFT
            .connect(organiser)
            .mintTicket(
              buyer.address,
              `ipfs://${buyer.address}-${i}`,
              TICKET_PRICE
            );
        }

        // Verify limit
        await expect(
          festivalNFT
            .connect(organiser)
            .mintTicket(
              buyer.address,
              `ipfs://${buyer.address}-extra`,
              TICKET_PRICE
            )
        ).to.be.revertedWith("Wallet ticket limit reached");
      }

      // Total distributed: 15 tickets across 3 wallets, each respecting the limit
      expect(await festivalNFT.getTotalMinted()).to.equal(15);
    });

    it("Should maintain price ceiling after ownership transfer", async function () {
      // Mint ticket to buyer1
      await festivalNFT
        .connect(organiser)
        .mintTicket(buyer1.address, "ipfs://ticket1", TICKET_PRICE);

      // List and sell to buyer2
      const resalePrice = ethers.parseEther("110");
      await festivalNFT.connect(buyer1).setTicketForSale(1, resalePrice);

      // Approve marketplace to transfer the NFT during resale
      await festivalNFT
        .connect(buyer1)
        .approve(await marketplace.getAddress(), 1);

      await marketplace
        .connect(buyer2)
        .buyFromCustomer(await festivalNFT.getAddress(), 1, buyer2.address);

      // Buyer2 tries to list above ceiling - should fail
      // Purchase price is still 100 FEST, so max is 110 FEST
      await expect(
        festivalNFT
          .connect(buyer2)
          .setTicketForSale(1, ethers.parseEther("111"))
      ).to.be.revertedWith("Price exceeds resale limit");

      // But can list at valid price
      await festivalNFT
        .connect(buyer2)
        .setTicketForSale(1, ethers.parseEther("110"));
      expect(await festivalNFT.isTicketForSale(1)).to.be.true;
    });
  });

  describe("5. Edge Cases", function () {
    it("Should handle maxTicketsPerWallet = 1", async function () {
      await festivalNFT.connect(organiser).setMaxTicketsPerWallet(1);

      await festivalNFT
        .connect(organiser)
        .mintTicket(buyer1.address, "ipfs://ticket1", TICKET_PRICE);

      await expect(
        festivalNFT
          .connect(organiser)
          .mintTicket(buyer1.address, "ipfs://ticket2", TICKET_PRICE)
      ).to.be.revertedWith("Wallet ticket limit reached");
    });

    it("Should handle maxResalePercentage = 100 (no profit)", async function () {
      await festivalNFT.connect(organiser).setMaxResalePercentage(100);

      await festivalNFT
        .connect(organiser)
        .mintTicket(buyer1.address, "ipfs://ticket1", TICKET_PRICE);

      // Can only list at exactly purchase price
      await festivalNFT.connect(buyer1).setTicketForSale(1, TICKET_PRICE);
      expect(await festivalNFT.getTicketSellingPrice(1)).to.equal(TICKET_PRICE);

      // Cannot list higher
      await festivalNFT.connect(buyer1).removeTicketFromSale(1);
      await expect(
        festivalNFT.connect(buyer1).setTicketForSale(1, TICKET_PRICE + 1n)
      ).to.be.revertedWith("Price exceeds resale limit");
    });

    it("Should handle very high maxResalePercentage", async function () {
      await festivalNFT.connect(organiser).setMaxResalePercentage(1000); // 10x

      await festivalNFT
        .connect(organiser)
        .mintTicket(buyer1.address, "ipfs://ticket1", TICKET_PRICE);

      const maxPrice = (TICKET_PRICE * 1000n) / 100n; // 1000 FEST
      await festivalNFT.connect(buyer1).setTicketForSale(1, maxPrice);

      expect(await festivalNFT.getTicketSellingPrice(1)).to.equal(maxPrice);
    });
  });
});
