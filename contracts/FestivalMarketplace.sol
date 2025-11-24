// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./FestivalNFT.sol";

contract FestivalMarketplace is ReentrancyGuard, Ownable, Pausable {
    uint256 public constant COMMISSION_PERCENTAGE = 10; // 10% commission
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
        uint256 commission
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
    ) external nonReentrant whenNotPaused {
        require(nftContractAddress != address(0), "Invalid NFT contract");
        require(buyer != address(0), "Invalid buyer address");
        require(price > 0, "Price must be greater than 0");
        
        FestivalNFT nftContract = FestivalNFT(nftContractAddress);
        
        // 1. Transfer tokens from buyer to organiser (owner of marketplace)
        require(
            festToken.transferFrom(buyer, owner(), price), 
            "Token transfer failed"
        );
        
        // 2. Mint ticket to buyer
        uint256 tokenId = nftContract.mintTicket(buyer, tokenURI, price);
        
        emit TicketPurchasedFromOrganiser(buyer, nftContractAddress, tokenId, price);
    }
    
    /**
     * @dev Buy a ticket from another customer (secondary sale)
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
        
        FestivalNFT nftContract = FestivalNFT(nftContractAddress);
        
        // Verify ticket is for sale
        require(nftContract.isTicketForSale(ticketId), "Ticket not for sale");
        
        address seller = nftContract.ownerOf(ticketId);
        require(seller != buyer, "Cannot buy your own ticket");
        
        uint256 sellingPrice = nftContract.getTicketSellingPrice(ticketId);
        require(sellingPrice > 0, "Invalid selling price");
        
        // Calculate commission and seller amount
        uint256 commission = (sellingPrice * COMMISSION_PERCENTAGE) / 100;
        uint256 sellerAmount = sellingPrice - commission;
        
        // 1. Transfer tokens from buyer to this contract
        require(
            festToken.transferFrom(buyer, address(this), sellingPrice), 
            "Token transfer from buyer failed"
        );
        
        // 2. Transfer commission to organiser
        require(
            festToken.transfer(owner(), commission), 
            "Commission transfer failed"
        );
        
        // 3. Transfer remaining amount to seller
        require(
            festToken.transfer(seller, sellerAmount), 
            "Seller payment failed"
        );
        
        // 4. Transfer NFT from seller to buyer
        nftContract.safeTransferFrom(seller, buyer, ticketId);
        
        // 5. Mark ticket as sold
        nftContract.markTicketAsSold(ticketId);
        
        emit TicketPurchasedFromCustomer(buyer, seller, nftContractAddress, ticketId, sellingPrice, commission);
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
}