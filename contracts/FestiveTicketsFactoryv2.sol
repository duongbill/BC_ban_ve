// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./FestivalNFTv2.sol";
import "./FestivalMarketplacev2.sol";

/**
 * @title FestiveTicketsFactoryv2
 * @dev Factory contract for creating festival NFT v2 and marketplace v2 instances
 */
contract FestiveTicketsFactoryv2 is Ownable, ReentrancyGuard, Pausable {
    address public immutable festTokenAddress;
    
    // Mapping to track created festivals
    mapping(address => bool) public isValidFestival;
    
    // Arrays to keep track of all created festivals
    address[] public allFestivals;
    address[] public allMarketplaces;
    
    // Events
    event FestivalCreated(
        address indexed nftContract,
        address indexed marketplace,
        address indexed organiser,
        string name,
        string symbol
    );

    constructor(address tokenAddress) Ownable(msg.sender) {
        require(tokenAddress != address(0), "Invalid token address");
        festTokenAddress = tokenAddress;
    }

    /**
     * @dev Create a new festival with NFT v2 contract and marketplace v2
     * @param name Name of the festival NFT collection
     * @param symbol Symbol of the festival NFT collection
     * @param organiser Address of the festival organiser
     * @return nftContract Address of the created NFT v2 contract
     * @return marketplaceContract Address of the created marketplace v2 contract
     */
    function createFestival(
        string memory name, 
        string memory symbol,
        address organiser
    ) external nonReentrant whenNotPaused returns (address nftContract, address marketplaceContract) {
        require(organiser != address(0), "Invalid organiser address");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        
        // Create NFT v2 contract
        FestivalNFTv2 newNFT = new FestivalNFTv2(name, symbol, organiser);
        nftContract = address(newNFT);
        
        // Create Marketplace v2 contract
        FestivalMarketplacev2 newMarketplace = new FestivalMarketplacev2(organiser, festTokenAddress);
        marketplaceContract = address(newMarketplace);
        
        // Grant MINTER_ROLE to marketplace
        bytes32 MINTER_ROLE = keccak256("MINTER_ROLE");
        newNFT.grantRole(MINTER_ROLE, marketplaceContract);
        
        // Track the festival
        isValidFestival[nftContract] = true;
        allFestivals.push(nftContract);
        allMarketplaces.push(marketplaceContract);
        
        emit FestivalCreated(nftContract, marketplaceContract, organiser, name, symbol);
        
        return (nftContract, marketplaceContract);
    }

    /**
     * @dev Get total number of festivals created
     */
    function getFestivalCount() external view returns (uint256) {
        return allFestivals.length;
    }

    /**
     * @dev Get festival and marketplace addresses by index
     */
    function getFestivalByIndex(uint256 index) 
        external 
        view 
        returns (address nftContract, address marketplace) 
    {
        require(index < allFestivals.length, "Index out of bounds");
        return (allFestivals[index], allMarketplaces[index]);
    }

    /**
     * @dev Get all festival addresses
     */
    function getAllFestivals() external view returns (address[] memory) {
        return allFestivals;
    }

    /**
     * @dev Get all marketplace addresses
     */
    function getAllMarketplaces() external view returns (address[] memory) {
        return allMarketplaces;
    }

    /**
     * @dev Pause the factory
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the factory
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
