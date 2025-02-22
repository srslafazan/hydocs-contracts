// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "../interfaces/IDID.sol";

/**
 * @title DIDRegistry
 * @dev Implementation of the DID (Decentralized Identity) registry
 */
contract DIDRegistry is Initializable, AccessControlUpgradeable, PausableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable, IDID {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;
    
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // DID storage
    mapping(bytes32 => DIDDocument) private _dids;
    mapping(bytes32 => mapping(address => Verification)) private _verifications;
    mapping(address => bytes32) private _addressToDID;
    
    // Verification levels
    uint256 public constant NO_VERIFICATION = 0;
    uint256 public constant ACCOUNT_VERIFICATION = 1;
    uint256 public constant ID_VERIFICATION = 2;
    uint256 public constant KYC_VERIFICATION = 3;

    // Keep track of verifiers in a set
    EnumerableSetUpgradeable.AddressSet private _verifierSet;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        // Empty constructor
    }

    function initialize() initializer public virtual {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
     * @dev Creates a new DID with the given identifiers
     * @param identifiers Array of hashed identifiers (email, phone, etc)
     * @return didId The created DID identifier
     */
    function createDID(bytes32[] calldata identifiers) 
        external 
        override 
        whenNotPaused 
        nonReentrant 
        returns (bytes32) 
    {
        require(identifiers.length > 0, "DIDRegistry: No identifiers provided");
        require(_addressToDID[msg.sender] == bytes32(0), "DIDRegistry: Address already has a DID");

        // Generate DID identifier
        bytes32 didId = keccak256(abi.encodePacked(msg.sender, block.timestamp, identifiers));
        
        // Create DID document
        DIDDocument storage doc = _dids[didId];
        doc.id = didId;
        doc.owner = msg.sender;
        doc.created = block.timestamp;
        doc.updated = block.timestamp;
        doc.active = true;

        // Store identifiers
        for (uint i = 0; i < identifiers.length; i++) {
            doc.identifiers.push(identifiers[i]);
        }

        // Map address to DID
        _addressToDID[msg.sender] = didId;

        emit DIDCreated(didId, msg.sender);
        return didId;
    }

    /**
     * @dev Updates an existing DID's identifiers
     * @param didId The DID to update
     * @param identifiers New array of hashed identifiers
     */
    function updateDID(bytes32 didId, bytes32[] calldata identifiers) 
        external 
        override 
        whenNotPaused 
    {
        require(_isOwner(didId), "DIDRegistry: Not DID owner");
        require(_dids[didId].active, "DIDRegistry: DID not active");

        DIDDocument storage doc = _dids[didId];
        
        // Clear existing identifiers
        delete doc.identifiers;
        
        // Add new identifiers
        for (uint i = 0; i < identifiers.length; i++) {
            doc.identifiers.push(identifiers[i]);
        }

        doc.updated = block.timestamp;
        
        emit DIDUpdated(didId);
    }

    /**
     * @dev Deactivates a DID
     * @param didId The DID to deactivate
     */
    function deactivateDID(bytes32 didId) 
        external 
        override 
        whenNotPaused 
    {
        require(_isOwner(didId), "DIDRegistry: Not DID owner");
        require(_dids[didId].active, "DIDRegistry: DID already inactive");

        _dids[didId].active = false;
        _dids[didId].updated = block.timestamp;

        emit DIDUpdated(didId);
    }

    /**
     * @dev Adds a verification to a DID
     * @param didId The DID to verify
     * @param level Verification level
     * @param expiration Expiration timestamp
     * @param metadata Additional verification metadata
     */
    function addVerification(
        bytes32 didId,
        uint256 level,
        uint256 expiration,
        bytes calldata metadata
    ) 
        external 
        override 
        whenNotPaused 
    {
        require(hasRole(VERIFIER_ROLE, msg.sender), "DIDRegistry: Not a verifier");
        require(_dids[didId].active, "DIDRegistry: DID not active");
        require(level <= KYC_VERIFICATION, "DIDRegistry: Invalid verification level");
        require(expiration > block.timestamp, "DIDRegistry: Invalid expiration");

        Verification storage verification = _verifications[didId][msg.sender];
        verification.verifier = msg.sender;
        verification.level = level;
        verification.timestamp = block.timestamp;
        verification.expiration = expiration;
        verification.status = keccak256("ACTIVE");
        verification.metadata = metadata;

        emit VerificationAdded(didId, msg.sender);
    }

    /**
     * @dev Revokes a verification
     * @param didId The DID whose verification to revoke
     */
    function revokeVerification(bytes32 didId) 
        external 
        override 
        whenNotPaused 
    {
        require(
            hasRole(VERIFIER_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender),
            "DIDRegistry: Not authorized"
        );
        require(_verifications[didId][msg.sender].verifier == msg.sender, "DIDRegistry: No verification exists");

        _verifications[didId][msg.sender].status = keccak256("REVOKED");
        _verifications[didId][msg.sender].expiration = block.timestamp;

        emit VerificationRevoked(didId, msg.sender);
    }

    /**
     * @dev Checks if a DID is verified
     * @param didId The DID to check
     * @return bool True if the DID has any valid verification
     */
    function isVerified(bytes32 didId) 
        external 
        view 
        override 
        returns (bool) 
    {
        return _hasValidVerification(didId);
    }

    /**
     * @dev Gets verification details
     * @param didId The DID to check
     * @param verifier The verifier address
     * @return Verification The verification details
     */
    function getVerification(bytes32 didId, address verifier) 
        external 
        view 
        override 
        returns (Verification memory) 
    {
        return _verifications[didId][verifier];
    }

    /**
     * @dev Gets DID document owner
     * @param didId The DID to retrieve
     * @return The DID document owner
     */
    function getDIDOwner(bytes32 didId) 
        external 
        view 
        returns (address) 
    {
        return _dids[didId].owner;
    }

    /**
     * @dev Gets DID document identifiers
     * @param didId The DID to retrieve
     * @return The DID document identifiers
     */
    function getDIDIdentifiers(bytes32 didId) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return _dids[didId].identifiers;
    }

    /**
     * @dev Gets DID document metadata
     * @param didId The DID to retrieve
     * @return created The DID document creation timestamp
     * @return updated The DID document last update timestamp
     * @return active The DID document active status
     */
    function getDIDMetadata(bytes32 didId) 
        external 
        view 
        returns (
            uint256 created,
            uint256 updated,
            bool active
        ) 
    {
        DIDDocument storage doc = _dids[didId];
        return (doc.created, doc.updated, doc.active);
    }

    function getDIDByAddress(address owner) external view returns (bytes32) {
        return _addressToDID[owner];
    }

    // Internal functions

    function _isOwner(bytes32 didId) internal view returns (bool) {
        return _dids[didId].owner == msg.sender;
    }

    function _hasValidVerification(bytes32 didId) internal view returns (bool) {
        address[] memory verifiers = _getVerifierRoleMembers();
        
        for (uint i = 0; i < verifiers.length; i++) {
            Verification storage verification = _verifications[didId][verifiers[i]];
            if (verification.verifier != address(0) &&
                verification.expiration > block.timestamp &&
                verification.status == keccak256("ACTIVE")) {
                return true;
            }
        }
        return false;
    }

    // Internal helper function to get verifier role members
    function _getVerifierRoleMembers() internal view returns (address[] memory) {
        uint256 length = _verifierSet.length();
        address[] memory members = new address[](length);
        
        for (uint256 i = 0; i < length; i++) {
            members[i] = _verifierSet.at(i);
        }
        
        return members;
    }

    // External helper function to get role members array
    function getRoleMemberArray(bytes32 role) external view returns (address[] memory) {
        require(role == VERIFIER_ROLE, "DIDRegistry: Only verifier role supported");
        return _getVerifierRoleMembers();
    }

    // Override the grantRole function to maintain the verifier set
    function grantRole(bytes32 role, address account) public override {
        super.grantRole(role, account);
        if (role == VERIFIER_ROLE) {
            _verifierSet.add(account);
        }
    }

    // Override the revokeRole function to maintain the verifier set
    function revokeRole(bytes32 role, address account) public override {
        super.revokeRole(role, account);
        if (role == VERIFIER_ROLE) {
            _verifierSet.remove(account);
        }
    }

    // Admin functions

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
} 