// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./FestivalNFT.sol";
import "./FestivalMarketplace.sol";

contract FestiveTicketsFactory is Ownable, ReentrancyGuard, Pausable {
    address public immutable festTokenAddress;
    
    // Mapping to track created festivals
    mapping(address => bool) public isValidFestival;
    
    // Arrays to keep track of all created festivals
    address[] public allFestivals;
    address[] public allMarketplaces;
    
    // Events
    event FestivalCreated(
        address indexed organiser,
        address indexed nftContract,
        address indexed marketplace,
        string name,
        string symbol
    );

    constructor(address tokenAddress) Ownable(msg.sender) {
        require(tokenAddress != address(0), "Invalid token address");
        festTokenAddress = tokenAddress;
    }

    /**
     * @dev Create a new festival with NFT contract and marketplace
     * @param name Name of the festival NFT collection
     * @param symbol Symbol of the festival NFT collection
     * @param organiser Address of the festival organiser
     * @return nftContract Address of the created NFT contract
     * @return marketplaceContract Address of the created marketplace contract
     */
    function createNewFest(
        string memory name, 
        string memory symbol,
        address organiser
    ) external onlyOwner nonReentrant whenNotPaused returns (address nftContract, address marketplaceContract) {
        require(organiser != address(0), "Invalid organiser address");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        
        // Deploy NFT contract
        FestivalNFT nft = new FestivalNFT(name, symbol, organiser);
        nftContract = address(nft);
        
        // Deploy Marketplace contract
        FestivalMarketplace marketplace = new FestivalMarketplace(organiser, festTokenAddress);
        marketplaceContract = address(marketplace);
        
        // Grant MINTER_ROLE to marketplace so it can mint tickets
        nft.grantRole(nft.MINTER_ROLE(), marketplaceContract);
        
        // Add to tracking
        isValidFestival[nftContract] = true;
        allFestivals.push(nftContract);
        allMarketplaces.push(marketplaceContract);
        
        emit FestivalCreated(organiser, nftContract, marketplaceContract, name, symbol);
        
        return (nftContract, marketplaceContract);
    }

    /**
     * @dev Get the total number of festivals created
     */
    function getTotalFestivals() external view returns (uint256) {
        return allFestivals.length;
    }

    /**
     * @dev Get festival NFT contract address by index
     */
    function getFestivalByIndex(uint256 index) external view returns (address) {
        require(index < allFestivals.length, "Index out of bounds");
        return allFestivals[index];
    }

    /**
     * @dev Get marketplace contract address by index
     */
    function getMarketplaceByIndex(uint256 index) external view returns (address) {
        require(index < allMarketplaces.length, "Index out of bounds");
        return allMarketplaces[index];
    }

    /**
     * @dev Get all festival contracts
     */
    function getAllFestivals() external view returns (address[] memory) {
        return allFestivals;
    }

    /**
     * @dev Get all marketplace contracts
     */
    function getAllMarketplaces() external view returns (address[] memory) {
        return allMarketplaces;
    }

    /**
     * @dev Check if a contract is a valid festival created by this factory
     */
    function checkValidFestival(address festivalAddress) external view returns (bool) {
        return isValidFestival[festivalAddress];
    }

    /**
     * @dev Get festival and marketplace pair by index
     */
    function getFestivalPair(uint256 index) external view returns (address festival, address marketplace) {
        require(index < allFestivals.length, "Index out of bounds");
        return (allFestivals[index], allMarketplaces[index]);
    }

    /**
     * @dev Pause the factory (prevents new festival creation)
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

    /**
     * @dev Update FEST token address (emergency function)
     */
    function updateFestTokenAddress(address newTokenAddress) external onlyOwner {
        require(newTokenAddress != address(0), "Invalid token address");
        // Note: This doesn't change existing marketplaces, only affects new ones
        // Consider if this function is needed or should be removed for immutability
    }
}