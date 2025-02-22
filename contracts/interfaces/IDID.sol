// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDID {
    // Structs
    struct DIDDocument {
        bytes32 id;              // DID identifier
        address owner;           // DID owner address
        uint256 created;         // Creation timestamp
        uint256 updated;         // Last update timestamp
        bool active;             // Active status
        bytes32[] identifiers;   // Hashed identifiers (email, phone, etc)
    }

    struct Verification {
        address verifier;        // Address of the verifier
        uint256 level;          // Verification level
        uint256 timestamp;      // Verification timestamp
        uint256 expiration;     // Expiration timestamp
        bytes32 status;         // Verification status
        bytes metadata;         // Additional verification metadata
    }

    // Events
    event DIDCreated(bytes32 indexed didId, address indexed owner);
    event DIDUpdated(bytes32 indexed didId);
    event VerificationAdded(bytes32 indexed didId, address indexed verifier);
    event VerificationRevoked(bytes32 indexed didId, address indexed verifier);

    // Core DID functions
    function createDID(bytes32[] calldata identifiers) external returns (bytes32);
    function updateDID(bytes32 didId, bytes32[] calldata identifiers) external;
    function deactivateDID(bytes32 didId) external;
    
    // DID getters
    function getDIDOwner(bytes32 didId) external view returns (address);
    function getDIDIdentifiers(bytes32 didId) external view returns (bytes32[] memory);
    function getDIDMetadata(bytes32 didId) external view returns (
        uint256 created,
        uint256 updated,
        bool active
    );
    function getDIDByAddress(address owner) external view returns (bytes32);

    // Verification functions
    function addVerification(
        bytes32 didId,
        uint256 level,
        uint256 expiration,
        bytes calldata metadata
    ) external;
    
    function revokeVerification(bytes32 didId) external;
    function isVerified(bytes32 didId) external view returns (bool);
    function getVerification(bytes32 didId, address verifier) 
        external view returns (Verification memory);
} 