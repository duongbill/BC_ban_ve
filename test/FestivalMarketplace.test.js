const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Festival Marketplace", function () {
  let festToken, factory, nftContract, marketplace;
  let owner, organiser, buyer, seller;
  let nftAddress, marketplaceAddress;

  beforeEach(async function () {
    [owner, organiser, buyer, seller] = await ethers.getSigners();

    // Deploy FestToken
    const FestToken = await ethers.getContractFactory("FestToken");
    festToken = await FestToken.deploy(owner.address);
    await festToken.waitForDeployment();

    // Deploy Factory
    const Factory = await ethers.getContractFactory("FestiveTicketsFactory");
    factory = await Factory.deploy(await festToken.getAddress());
    await factory.waitForDeployment();

    // Create a festival
    const tx = await factory.createFestival(
      "Test Festival",
      "TF",
      organiser.address
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (log) => log.fragment && log.fragment.name === "FestivalCreated"
    );
    [, nftAddress, marketplaceAddress] = event.args;

    // Get contract instances
    nftContract = await ethers.getContractAt("FestivalNFT", nftAddress);
    marketplace = await ethers.getContractAt(
      "FestivalMarketplace",
      marketplaceAddress
    );

    // Mint some FEST tokens to buyers
    await festToken.mint(buyer.address, ethers.parseEther("1000"));
    await festToken.mint(seller.address, ethers.parseEther("1000"));
  });

  describe("FestToken", function () {
    it("Should have correct initial supply", async function () {
      const totalSupply = await festToken.totalSupply();
      expect(totalSupply).to.equal(ethers.parseEther("1002000"));
    });

    it("Should mint tokens to specified address", async function () {
      const mintAmount = ethers.parseEther("100");
      await festToken.mint(buyer.address, mintAmount);
      expect(await festToken.balanceOf(buyer.address)).to.equal(
        ethers.parseEther("1100")
      );
    });
  });

  describe("FestiveTicketsFactory", function () {
    it("Should create festival with correct parameters", async function () {
      expect(await factory.getFestivalCount()).to.equal(1);
      const [festivalAddress, marketAddress] = await factory.getFestivalByIndex(
        0
      );
      expect(festivalAddress).to.equal(nftAddress);
      expect(marketAddress).to.equal(marketplaceAddress);
    });

    it("Should only allow owner to create festivals", async function () {
      await expect(
        factory
          .connect(buyer)
          .createFestival("Unauthorized Festival", "UF", buyer.address)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });
  });

  describe("Primary Ticket Sales", function () {
    it("Should buy ticket from organiser", async function () {
      const price = ethers.parseEther("50");
      const tokenURI = "ipfs://test-metadata";

      // Approve marketplace to spend buyer's tokens
      await festToken.connect(buyer).approve(marketplaceAddress, price);

      // Buy ticket
      await marketplace
        .connect(buyer)
        .buyFromOrganiser(nftAddress, buyer.address, tokenURI, price);

      // Check ticket was minted
      expect(await nftContract.balanceOf(buyer.address)).to.equal(1);
      expect(await nftContract.tokenURI(1)).to.equal(tokenURI);
      expect(await nftContract.getTicketPurchasePrice(1)).to.equal(price);

      // Check organiser received payment
      expect(await festToken.balanceOf(organiser.address)).to.equal(price);
    });
  });

  describe("Secondary Ticket Sales", function () {
    let tokenId;
    const originalPrice = ethers.parseEther("50");
    const resalePrice = ethers.parseEther("55"); // 110% of original

    beforeEach(async function () {
      // First, buy a ticket from organiser
      await festToken
        .connect(seller)
        .approve(marketplaceAddress, originalPrice);
      await marketplace
        .connect(seller)
        .buyFromOrganiser(
          nftAddress,
          seller.address,
          "ipfs://test-metadata",
          originalPrice
        );
      tokenId = 1;

      // List ticket for sale
      await nftContract.connect(seller).setTicketForSale(tokenId, resalePrice);
    });

    it("Should list ticket for sale within price limit", async function () {
      expect(await nftContract.isTicketForSale(tokenId)).to.be.true;
      expect(await nftContract.getTicketSellingPrice(tokenId)).to.equal(
        resalePrice
      );
    });

    it("Should reject listing above 110% of original price", async function () {
      const excessivePrice = ethers.parseEther("60"); // 120% of original
      await expect(
        nftContract.connect(seller).setTicketForSale(tokenId, excessivePrice)
      ).to.be.revertedWith("Price exceeds 110% limit");
    });

    it("Should buy ticket from customer", async function () {
      // Approve buyer to spend tokens
      await festToken.connect(buyer).approve(marketplaceAddress, resalePrice);
      await nftContract.connect(seller).approve(marketplaceAddress, tokenId);
      const sellerBalanceBefore = await festToken.balanceOf(seller.address);
      const organiserBalanceBefore = await festToken.balanceOf(
        organiser.address
      );

      // Buy from customer
      await marketplace
        .connect(buyer)
        .buyFromCustomer(nftAddress, tokenId, buyer.address);

      // Check NFT transferred
      expect(await nftContract.ownerOf(tokenId)).to.equal(buyer.address);

      // Check payments
      const commission = (resalePrice * 10n) / 100n; // 10%
      const sellerAmount = resalePrice - commission;

      expect(await festToken.balanceOf(seller.address)).to.equal(
        sellerBalanceBefore + sellerAmount
      );
      expect(await festToken.balanceOf(organiser.address)).to.equal(
        organiserBalanceBefore + commission
      );

      // Check ticket removed from sale
      expect(await nftContract.isTicketForSale(tokenId)).to.be.false;
    });
  });

  describe("Access Control", function () {
    it("Should only allow minter to mint tickets", async function () {
      await expect(
        nftContract
          .connect(buyer)
          .mintTicket(buyer.address, "ipfs://test", ethers.parseEther("50"))
      ).to.be.revertedWithCustomError(
        nftContract,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("Should only allow token owner to list for sale", async function () {
      // Buy a ticket first
      const price = ethers.parseEther("50");
      await festToken.connect(buyer).approve(marketplaceAddress, price);
      await marketplace
        .connect(buyer)
        .buyFromOrganiser(
          nftAddress,
          buyer.address,
          "ipfs://test-metadata",
          price
        );

      // Try to list someone else's ticket
      await expect(
        nftContract.connect(seller).setTicketForSale(1, ethers.parseEther("55"))
      ).to.be.revertedWith("Not authorized");
    });
  });
});
