// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./FestivalNFTv2.sol";

/**
 * @title FestivalMarketplacev2
 * @dev Enhanced marketplace with event status checks and verification support
 */
contract FestivalMarketplacev2 is ReentrancyGuard, Ownable, Pausable {
    uint256 public constant COMMISSION_PERCENTAGE = 10; // 10% commission
    uint256 public constant ROYALTY_PERCENTAGE = 5; // 5% royalty to organiser on resales
    IERC20 public immutable festToken;
    
    // Events
    event TicketPurchasedFromOrganiser(
        address indexed buyer, 
        address indexed nftContract, 
        uint256 indexed tokenId, 
        uint256 price
    );
    
    event TicketPurchasedFromCustomer(
        address indexed buyer,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 commission,
        uint256 royalty
    );

    event RoyaltyPaid(
        address indexed nftContract,
        address indexed organiser,
        uint256 amount
    );

    constructor(address initialOwner, address tokenAddress) Ownable(initialOwner) {
        require(tokenAddress != address(0), "Invalid token address");
        festToken = IERC20(tokenAddress);
    }

    /**
     * @dev Buy a ticket from the organiser (primary sale)
     * @param nftContractAddress Address of the festival NFT contract
     * @param buyer Address of the buyer
     * @param tokenURI Metadata URI for the ticket
     * @param price Price of the ticket in FEST tokens
     */
    function buyFromOrganiser(
        address nftContractAddress, 
        address buyer, 
        string memory tokenURI, 
        uint256 price
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(nftContractAddress != address(0), "Invalid NFT contract");
        require(buyer != address(0), "Invalid buyer address");
        require(price > 0, "Price must be greater than 0");
        
        FestivalNFTv2 nftContract = FestivalNFTv2(nftContractAddress);
        
        // Check event is active
        require(
            nftContract.eventStatus() == FestivalNFTv2.EventStatus.ACTIVE,
            "Event not active"
        );
        
        // 1. Transfer tokens from buyer to organiser (owner of marketplace)
        require(
            festToken.transferFrom(buyer, owner(), price), 
            "Token transfer failed"
        );
        
        // 2. Mint ticket to buyer
        uint256 tokenId = nftContract.mintTicket(buyer, tokenURI, price);
        
        emit TicketPurchasedFromOrganiser(buyer, nftContractAddress, tokenId, price);
        return tokenId;
    }

    /**
     * @dev Buy multiple tickets at once (batch purchase)
     * @param nftContractAddress Address of the festival NFT contract
     * @param buyer Address of the buyer
     * @param tokenURIs Array of metadata URIs
     * @param pricePerTicket Price per ticket in FEST tokens
     */
    function batchBuyFromOrganiser(
        address nftContractAddress,
        address buyer,
        string[] memory tokenURIs,
        uint256 pricePerTicket
    ) external nonReentrant whenNotPaused returns (uint256[] memory) {
        require(nftContractAddress != address(0), "Invalid NFT contract");
        require(buyer != address(0), "Invalid buyer address");
        require(pricePerTicket > 0, "Price must be greater than 0");
        require(tokenURIs.length > 0 && tokenURIs.length <= 10, "Invalid batch size");
        
        FestivalNFTv2 nftContract = FestivalNFTv2(nftContractAddress);
        
        // Check event is active
        require(
            nftContract.eventStatus() == FestivalNFTv2.EventStatus.ACTIVE,
            "Event not active"
        );
        
        uint256 totalPrice = pricePerTicket * tokenURIs.length;
        
        // 1. Transfer total tokens from buyer to organiser
        require(
            festToken.transferFrom(buyer, owner(), totalPrice),
            "Token transfer failed"
        );
        
        // 2. Batch mint tickets
        uint256[] memory tokenIds = nftContract.batchMintTickets(buyer, tokenURIs, pricePerTicket);
        
        // Emit events for each ticket
        for (uint256 i = 0; i < tokenIds.length; i++) {
            emit TicketPurchasedFromOrganiser(buyer, nftContractAddress, tokenIds[i], pricePerTicket);
        }
        
        return tokenIds;
    }
    
    /**
     * @dev Buy a ticket from another customer (secondary sale with royalty)
     * @param nftContractAddress Address of the festival NFT contract
     * @param ticketId ID of the ticket to buy
     * @param buyer Address of the buyer
     */
    function buyFromCustomer(
        address nftContractAddress, 
        uint256 ticketId,
        address buyer
    ) external nonReentrant whenNotPaused {
        require(nftContractAddress != address(0), "Invalid NFT contract");
        require(buyer != address(0), "Invalid buyer address");
        
        FestivalNFTv2 nftContract = FestivalNFTv2(nftContractAddress);
        
        // Check event is active
        require(
            nftContract.eventStatus() == FestivalNFTv2.EventStatus.ACTIVE,
            "Event not active"
        );
        
        // Verify ticket is for sale
        require(nftContract.isTicketForSale(ticketId), "Ticket not for sale");
        
        // Verify ticket hasn't been used
        require(!nftContract.isTicketVerified(ticketId), "Ticket already used");
        
        address seller = nftContract.ownerOf(ticketId);
        require(seller != buyer, "Cannot buy your own ticket");
        
        uint256 sellingPrice = nftContract.getTicketSellingPrice(ticketId);
        require(sellingPrice > 0, "Invalid selling price");
        
        // Calculate commission, royalty and seller amount
        uint256 commission = (sellingPrice * COMMISSION_PERCENTAGE) / 100;
        uint256 royalty = (sellingPrice * ROYALTY_PERCENTAGE) / 100;
        uint256 sellerAmount = sellingPrice - commission - royalty;
        
        // 1. Transfer tokens from buyer to this contract
        require(
            festToken.transferFrom(buyer, address(this), sellingPrice), 
            "Token transfer from buyer failed"
        );
        
        // 2. Transfer commission to marketplace owner
        require(
            festToken.transfer(owner(), commission), 
            "Commission transfer failed"
        );
        
        // 3. Transfer royalty to organiser
        address organiser = nftContract.organiser();
        require(
            festToken.transfer(organiser, royalty),
            "Royalty transfer failed"
        );
        
        emit RoyaltyPaid(nftContractAddress, organiser, royalty);
        
        // 4. Transfer remaining amount to seller
        require(
            festToken.transfer(seller, sellerAmount), 
            "Seller payment failed"
        );
        
        // 5. Transfer NFT from seller to buyer
        nftContract.safeTransferFrom(seller, buyer, ticketId);
        
        // 6. Mark ticket as sold
        nftContract.markTicketAsSold(ticketId);
        
        emit TicketPurchasedFromCustomer(
            buyer, 
            seller, 
            nftContractAddress, 
            ticketId, 
            sellingPrice, 
            commission,
            royalty
        );
    }

    /**
     * @dev Calculate fees for a resale
     * @param sellingPrice The selling price
     * @return commission The marketplace commission
     * @return royalty The organiser royalty
     * @return sellerAmount The amount seller receives
     */
    function calculateResaleFees(uint256 sellingPrice) 
        external 
        pure 
        returns (uint256 commission, uint256 royalty, uint256 sellerAmount) 
    {
        commission = (sellingPrice * COMMISSION_PERCENTAGE) / 100;
        royalty = (sellingPrice * ROYALTY_PERCENTAGE) / 100;
        sellerAmount = sellingPrice - commission - royalty;
        return (commission, royalty, sellerAmount);
    }

    /**
     * @dev Emergency function to withdraw tokens (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = festToken.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        require(festToken.transfer(owner(), balance), "Withdrawal failed");
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get commission rate
     */
    function getCommissionRate() external pure returns (uint256) {
        return COMMISSION_PERCENTAGE;
    }

    /**
     * @dev Get royalty rate
     */
    function getRoyaltyRate() external pure returns (uint256) {
        return ROYALTY_PERCENTAGE;
    }
}
