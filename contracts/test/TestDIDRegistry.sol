// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "../core/DIDRegistry.sol";

contract TestDIDRegistry is DIDRegistry {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() DIDRegistry() {
        // Skip initialization in constructor for testing
    }

    function initialize() public override initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        // Grant all required roles to the deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);

        // Set up role hierarchy
        _setRoleAdmin(VERIFIER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
    }

    // Helper function for testing
    function getDIDDocument(bytes32 didId) public view returns (
        address owner,
        uint256 created,
        uint256 updated,
        bool active,
        bytes32[] memory identifiers
    ) {
        owner = this.getDIDOwner(didId);
        (created, updated, active) = this.getDIDMetadata(didId);
        identifiers = this.getDIDIdentifiers(didId);
    }

    // Helper function for testing
    function calculateDIDId(address owner, uint256 timestamp, bytes32[] memory identifiers) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(owner, timestamp, identifiers));
    }

    // Helper function to get the actual DID ID for an address
    function getActualDID(address owner) external returns (bytes32) {
        // Create a DID with a known identifier to check if it exists
        bytes32[] memory identifiers = new bytes32[](1);
        identifiers[0] = keccak256(abi.encodePacked("test"));
        
        // Try to create a DID - this will fail if one already exists
        try this.createDID(identifiers) returns (bytes32 newDid) {
            // If successful, deactivate it and return zero
            this.deactivateDID(newDid);
            return bytes32(0);
        } catch {
            // If it fails because a DID already exists, try to find it
            // We'll use the owner's address as a way to find their DID
            bytes32[] memory testIdentifiers = new bytes32[](1);
            testIdentifiers[0] = keccak256(abi.encodePacked(owner));
            bytes32 possibleDid = keccak256(abi.encodePacked(owner, block.timestamp, testIdentifiers));
            
            // Check if this DID belongs to the owner
            if (this.getDIDOwner(possibleDid) == owner) {
                return possibleDid;
            }
            return bytes32(0);
        }
    }

    // Add any test-specific functions here if needed
    // For now, we just need the contract to exist for testing
} 