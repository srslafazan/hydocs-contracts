// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDocument {
    // Structs
    struct Document {
        bytes32 id;              // Document identifier
        bytes32 contentHash;     // Hash of document content
        bytes32 didId;          // Owner's DID
        uint256 created;         // Creation timestamp
        uint256 expiration;      // Expiration timestamp
        bytes32 docType;         // Document type
        bytes metadata;          // Additional metadata
        bool active;             // Active status
    }

    struct SignatureRequest {
        bytes32 documentId;      // Document to sign
        bytes32 signerDid;      // Required signer's DID
        uint256 deadline;        // Signing deadline
        bytes32 role;           // Signer's role
        bool required;          // Is signature required
    }

    // Events
    event DocumentCreated(bytes32 indexed documentId, bytes32 indexed didId);
    event DocumentSigned(bytes32 indexed documentId, bytes32 indexed signerDid);
    event DocumentRevoked(bytes32 indexed documentId);
    event DocumentTransferred(
        bytes32 indexed documentId, 
        bytes32 indexed fromDid, 
        bytes32 indexed toDid
    );

    // Core document functions
    function createDocument(
        bytes32 contentHash,
        bytes32 docType,
        uint256 expiration,
        bytes calldata metadata
    ) external returns (bytes32);

    function revokeDocument(bytes32 documentId) external;
    function transferDocument(bytes32 documentId, bytes32 toDid) external;
    function getDocument(bytes32 documentId) 
        external view returns (Document memory);

    // Signature functions
    function requestSignature(
        bytes32 documentId,
        bytes32 signerDid,
        uint256 deadline,
        bytes32 role
    ) external;

    function signDocument(
        bytes32 documentId,
        bytes calldata signature,
        bytes calldata metadata
    ) external;
} 