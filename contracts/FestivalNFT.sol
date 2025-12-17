// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title FestivalNFT
 * @dev NFT contract with event status, ticket transfer, and verification
 */
contract FestivalNFT is ERC721URIStorage, AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    // Event Status Enum
    enum EventStatus { ACTIVE, PAUSED, CANCELLED, COMPLETED }
    
    uint256 private _currentTokenId;
    EventStatus public eventStatus;
    address public organiser;
    
    // Anti-scalping: Maximum tickets per wallet (0 = unlimited)
    uint256 public maxTicketsPerWallet;
    
    // Resale price ceiling: Maximum percentage above purchase price (e.g., 110 = 110%)
    uint256 public maxResalePercentage;
    
    // Mapping from token ID to purchase price
    mapping(uint256 => uint256) private _ticketPurchasePrice;
    // Mapping from token ID to selling price
    mapping(uint256 => uint256) private _ticketSellingPrice;
    // Mapping from token ID to sale status
    mapping(uint256 => bool) private _isForSale;
    // Mapping from token ID to verification status (used at event entrance)
    mapping(uint256 => bool) private _isVerified;
    // Mapping from token ID to verification timestamp
    mapping(uint256 => uint256) private _verificationTime;
    // Mapping to track if ticket was transferred as gift
    mapping(uint256 => bool) private _isGifted;

    event TicketMinted(address indexed to, uint256 indexed tokenId, uint256 purchasePrice);
    event TicketListedForSale(uint256 indexed tokenId, uint256 sellingPrice);
    event TicketRemovedFromSale(uint256 indexed tokenId);
    event TicketVerified(uint256 indexed tokenId, address indexed verifier, uint256 timestamp);
    event TicketTransferred(uint256 indexed tokenId, address indexed from, address indexed to, bool isGift);
    event EventStatusChanged(EventStatus indexed oldStatus, EventStatus indexed newStatus);
    event RefundIssued(uint256 indexed tokenId, address indexed owner, uint256 amount);
    event MaxTicketsPerWalletUpdated(uint256 indexed oldMax, uint256 indexed newMax);
    event MaxResalePercentageUpdated(uint256 indexed oldPercentage, uint256 indexed newPercentage);

    constructor(
        string memory name, 
        string memory symbol, 
        address admin,
        uint256 _maxTicketsPerWallet,
        uint256 _maxResalePercentage
    ) ERC721(name, symbol) {
        require(admin != address(0), "Invalid admin address");
        require(_maxResalePercentage >= 100, "Max resale % must be >= 100");
        
        organiser = admin;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(VERIFIER_ROLE, admin);
        _currentTokenId = 0;
        eventStatus = EventStatus.ACTIVE;
        maxTicketsPerWallet = _maxTicketsPerWallet;
        maxResalePercentage = _maxResalePercentage;
    }
    
    /**
     * @dev Get the next token ID to be minted
     */
    function _nextTokenId() private returns (uint256) {
        _currentTokenId++;
        return _currentTokenId;
    }

    /**
     * @dev Mint a new ticket NFT
     * @param to Address to mint the ticket to
     * @param tokenURI Metadata URI for the ticket
     * @param purchasePrice Original purchase price of the ticket
     */
    function mintTicket(
        address to, 
        string memory tokenURI, 
        uint256 purchasePrice
    ) external nonReentrant onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(eventStatus == EventStatus.ACTIVE, "Event not active");
        
        // Check max tickets per wallet limit
        if (maxTicketsPerWallet > 0) {
            require(balanceOf(to) < maxTicketsPerWallet, "Wallet ticket limit reached");
        }
        
        uint256 tokenId = _nextTokenId();
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _ticketPurchasePrice[tokenId] = purchasePrice;
        
        emit TicketMinted(to, tokenId, purchasePrice);
        return tokenId;
    }

    /**
     * @dev Batch mint multiple tickets at once
     * @param to Address to mint tickets to
     * @param tokenURIs Array of metadata URIs
     * @param purchasePrice Purchase price for all tickets
     */
    function batchMintTickets(
        address to,
        string[] memory tokenURIs,
        uint256 purchasePrice
    ) external nonReentrant onlyRole(MINTER_ROLE) whenNotPaused returns (uint256[] memory) {
        require(eventStatus == EventStatus.ACTIVE, "Event not active");
        require(tokenURIs.length > 0 && tokenURIs.length <= 10, "Invalid batch size");
        
        // Check max tickets per wallet limit
        if (maxTicketsPerWallet > 0) {
            require(
                balanceOf(to) + tokenURIs.length <= maxTicketsPerWallet, 
                "Batch would exceed wallet ticket limit"
            );
        }
        
        uint256[] memory tokenIds = new uint256[](tokenURIs.length);
        
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            uint256 tokenId = _nextTokenId();
            _mint(to, tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);
            _ticketPurchasePrice[tokenId] = purchasePrice;
            tokenIds[i] = tokenId;
            
            emit TicketMinted(to, tokenId, purchasePrice);
        }
        
        return tokenIds;
    }
    
    /**
     * @dev Set a ticket for sale on secondary market
     * @param tokenId ID of the ticket to sell
     * @param sellingPrice Price to sell the ticket for
     */
    function setTicketForSale(uint256 tokenId, uint256 sellingPrice) external nonReentrant whenNotPaused {
        require(_isAuthorized(ownerOf(tokenId), msg.sender, tokenId), "Not authorized");
        require(eventStatus == EventStatus.ACTIVE, "Event not active");
        require(!_isVerified[tokenId], "Ticket already used");
        
        uint256 purchasePrice = _ticketPurchasePrice[tokenId];
        uint256 maxAllowed = (purchasePrice * maxResalePercentage) / 100;
        require(sellingPrice <= maxAllowed, "Price exceeds resale limit");
        
        _ticketSellingPrice[tokenId] = sellingPrice;
        _isForSale[tokenId] = true;
        
        emit TicketListedForSale(tokenId, sellingPrice);
    }

    /**
     * @dev Remove a ticket from sale
     * @param tokenId ID of the ticket to remove from sale
     */
    function removeTicketFromSale(uint256 tokenId) external nonReentrant whenNotPaused {
        require(_isAuthorized(ownerOf(tokenId), msg.sender, tokenId), "Not authorized");
        
        _isForSale[tokenId] = false;
        _ticketSellingPrice[tokenId] = 0;
        
        emit TicketRemovedFromSale(tokenId);
    }

    /**
     * @dev Transfer ticket as a gift (no sale)
     * @param to Recipient address
     * @param tokenId Token ID to transfer
     */
    function giftTicket(address to, uint256 tokenId) external nonReentrant whenNotPaused {
        require(_isAuthorized(ownerOf(tokenId), msg.sender, tokenId), "Not authorized");
        require(to != address(0), "Invalid recipient");
        require(eventStatus == EventStatus.ACTIVE, "Event not active");
        require(!_isVerified[tokenId], "Ticket already used");
        
        address from = ownerOf(tokenId);
        
        // Remove from sale if listed
        if (_isForSale[tokenId]) {
            _isForSale[tokenId] = false;
            _ticketSellingPrice[tokenId] = 0;
        }
        
        _isGifted[tokenId] = true;
        _transfer(from, to, tokenId);
        
        emit TicketTransferred(tokenId, from, to, true);
    }

    /**
     * @dev Verify ticket at event entrance (QR code scan)
     * @param tokenId Token ID to verify
     */
    function verifyTicket(uint256 tokenId) external onlyRole(VERIFIER_ROLE) returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(eventStatus == EventStatus.ACTIVE || eventStatus == EventStatus.COMPLETED, "Event not active");
        require(!_isVerified[tokenId], "Ticket already verified");
        
        _isVerified[tokenId] = true;
        _verificationTime[tokenId] = block.timestamp;
        
        emit TicketVerified(tokenId, msg.sender, block.timestamp);
        return true;
    }

    /**
     * @dev Check if ticket is verified
     */
    function isTicketVerified(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _isVerified[tokenId];
    }

    /**
     * @dev Get verification time of ticket
     */
    function getVerificationTime(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _verificationTime[tokenId];
    }

    /**
     * @dev Change event status
     */
    function setEventStatus(EventStatus newStatus) external onlyRole(DEFAULT_ADMIN_ROLE) {
        EventStatus oldStatus = eventStatus;
        eventStatus = newStatus;
        
        emit EventStatusChanged(oldStatus, newStatus);
    }

    /**
     * @dev Check if ticket was gifted
     */
    function isTicketGifted(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _isGifted[tokenId];
    }
    
    /**
     * @dev Get the purchase price of a ticket
     */
    function getTicketPurchasePrice(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _ticketPurchasePrice[tokenId];
    }
    
    /**
     * @dev Get the selling price of a ticket
     */
    function getTicketSellingPrice(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _ticketSellingPrice[tokenId];
    }

    /**
     * @dev Check if a ticket is for sale
     */
    function isTicketForSale(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _isForSale[tokenId];
    }

    /**
     * @dev Get all tickets owned by an address
     */
    function getTicketsOwnedBy(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory result = new uint256[](tokenCount);
        uint256 resultIndex = 0;

        for (uint256 tokenId = 1; tokenId <= _currentTokenId; tokenId++) {
            if (_ownerOf(tokenId) == owner) {
                result[resultIndex] = tokenId;
                resultIndex++;
            }
        }
        return result;
    }

    /**
     * @dev Get all tickets that are for sale
     */
    function getTicketsForSale() external view returns (uint256[] memory) {
        uint256 forSaleCount = 0;
        
        for (uint256 tokenId = 1; tokenId <= _currentTokenId; tokenId++) {
            if (_ownerOf(tokenId) != address(0) && _isForSale[tokenId]) {
                forSaleCount++;
            }
        }
        
        uint256[] memory result = new uint256[](forSaleCount);
        uint256 resultIndex = 0;
        
        for (uint256 tokenId = 1; tokenId <= _currentTokenId; tokenId++) {
            if (_ownerOf(tokenId) != address(0) && _isForSale[tokenId]) {
                result[resultIndex] = tokenId;
                resultIndex++;
            }
        }
        
        return result;
    }

    /**
     * @dev Mark a ticket as sold (called by marketplace)
     */
    function markTicketAsSold(uint256 tokenId) external onlyRole(MINTER_ROLE) {
        _isForSale[tokenId] = false;
        _ticketSellingPrice[tokenId] = 0;
    }

    /**
     * @dev Get total minted tickets
     */
    function getTotalMinted() external view returns (uint256) {
        return _currentTokenId;
    }

    /**
     * @dev Update maximum tickets per wallet (anti-scalping)
     * @param newMax New maximum (0 = unlimited)
     */
    function setMaxTicketsPerWallet(uint256 newMax) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 oldMax = maxTicketsPerWallet;
        maxTicketsPerWallet = newMax;
        emit MaxTicketsPerWalletUpdated(oldMax, newMax);
    }

    /**
     * @dev Update maximum resale percentage
     * @param newPercentage New percentage (e.g., 110 = 110%)
     */
    function setMaxResalePercentage(uint256 newPercentage) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newPercentage >= 100, "Percentage must be >= 100");
        uint256 oldPercentage = maxResalePercentage;
        maxResalePercentage = newPercentage;
        emit MaxResalePercentageUpdated(oldPercentage, newPercentage);
    }

    /**
     * @dev Get maximum allowed resale price for a ticket
     * @param tokenId Token ID to check
     * @return Maximum resale price allowed
     */
    function getMaxResalePrice(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        uint256 purchasePrice = _ticketPurchasePrice[tokenId];
        return (purchasePrice * maxResalePercentage) / 100;
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721URIStorage, AccessControl) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Override _update to include pause functionality and emit transfer event
     */
    function _update(address to, uint256 tokenId, address auth) 
        internal 
        override 
        whenNotPaused 
        returns (address) 
    {
        address from = _ownerOf(tokenId);
        
        // Emit custom transfer event if not minting/burning
        if (from != address(0) && to != address(0)) {
            emit TicketTransferred(tokenId, from, to, _isGifted[tokenId]);
        }
        
        return super._update(to, tokenId, auth);
    }
}
