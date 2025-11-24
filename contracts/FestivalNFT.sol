// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract FestivalNFT is ERC721URIStorage, AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 private _currentTokenId;
    
    // Mapping from token ID to purchase price
    mapping(uint256 => uint256) private _ticketPurchasePrice;
    // Mapping from token ID to selling price
    mapping(uint256 => uint256) private _ticketSellingPrice;
    // Mapping from token ID to sale status
    mapping(uint256 => bool) private _isForSale;

    event TicketMinted(address indexed to, uint256 indexed tokenId, uint256 purchasePrice);
    event TicketListedForSale(uint256 indexed tokenId, uint256 sellingPrice);
    event TicketRemovedFromSale(uint256 indexed tokenId);

    constructor(string memory name, string memory symbol, address admin) 
        ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin); // Cấp quyền Admin cho người deploy (bạn)
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender); // CẤP THÊM quyền Admin cho Factory (để nó có thể cấp Minter_Role)
        _grantRole(MINTER_ROLE, admin);
        _currentTokenId = 0;
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
        uint256 tokenId = _nextTokenId();
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _ticketPurchasePrice[tokenId] = purchasePrice;
        
        emit TicketMinted(to, tokenId, purchasePrice);
        return tokenId;
    }
    
    /**
     * @dev Set a ticket for sale on secondary market
     * @param tokenId ID of the ticket to sell
     * @param sellingPrice Price to sell the ticket for
     */
    function setTicketForSale(uint256 tokenId, uint256 sellingPrice) external nonReentrant whenNotPaused {
        require(_isAuthorized(ownerOf(tokenId), msg.sender, tokenId), "Not authorized");
        
        uint256 purchasePrice = _ticketPurchasePrice[tokenId];
        uint256 maxAllowed = (purchasePrice * 110) / 100; // 110% of purchase price
        require(sellingPrice <= maxAllowed, "Price exceeds 110% limit");
        
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
        
        // First, count how many are for sale
        for (uint256 tokenId = 1; tokenId <= _currentTokenId; tokenId++) {
            if (_ownerOf(tokenId) != address(0) && _isForSale[tokenId]) {
                forSaleCount++;
            }
        }
        
        // Then, create array and populate it
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
     * @dev Override _update to include pause functionality
     */
    function _update(address to, uint256 tokenId, address auth) 
        internal 
        override 
        whenNotPaused 
        returns (address) 
    {
        return super._update(to, tokenId, auth);
    }
}