// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title IDocument
 * @dev Interface for the Document Registry contract
 */
interface IDocument {
    struct Document {
        bytes32 contentHash;      // SHA-256 hash of document content
        bytes32 documentType;     // Type of document
        address owner;            // Document owner's address
        bytes32 did;             // Document owner's DID
        uint256 createdAt;       // Creation timestamp
        uint256 expiresAt;       // Expiration timestamp (0 for no expiration)
        bytes32 status;          // Document status
        string metadata;         // Additional metadata (JSON string)
        uint256 version;         // Document version
    }

    struct Signature {
        bytes32 signerDid;       // Signer's DID
        uint256 timestamp;       // Signature timestamp
        bytes32 signatureType;   // Type of signature (approve, reject, acknowledge)
        string metadata;         // Additional metadata (comments, notes)
    }

    event DocumentRegistered(
        bytes32 indexed documentId,
        bytes32 contentHash,
        bytes32 documentType,
        address indexed owner,
        bytes32 indexed did,
        uint256 createdAt,
        uint256 expiresAt
    );

    event DocumentSigned(
        bytes32 indexed documentId,
        bytes32 indexed signerDid,
        bytes32 signatureType,
        uint256 timestamp
    );

    event DocumentStatusChanged(
        bytes32 indexed documentId,
        bytes32 oldStatus,
        bytes32 newStatus
    );

    /**
     * @dev Registers a new document in the registry
     * @param contentHash SHA-256 hash of document content
     * @param documentType Type of document
     * @param expiresAt Expiration timestamp (0 for no expiration)
     * @param metadata Additional metadata (JSON string)
     * @param requiredSignerDids Array of DIDs required to sign the document
     * @return documentId Unique identifier for the document
     */
    function registerDocument(
        bytes32 contentHash,
        bytes32 documentType,
        uint256 expiresAt,
        string calldata metadata,
        bytes32[] calldata requiredSignerDids
    ) external returns (bytes32);

    /**
     * @dev Signs a document
     * @param documentId ID of the document to sign
     * @param signatureType Type of signature
     * @param metadata Additional metadata (comments, notes)
     */
    function signDocument(
        bytes32 documentId,
        bytes32 signatureType,
        string calldata metadata
    ) external;

    /**
     * @dev Revokes a document
     * @param documentId ID of the document to revoke
     */
    function revokeDocument(bytes32 documentId) external;

    /**
     * @dev Updates document metadata
     * @param documentId ID of the document to update
     * @param metadata New metadata
     */
    function updateMetadata(bytes32 documentId, string calldata metadata) external;

    /**
     * @dev Checks if a document has all required signatures
     * @param documentId ID of the document to check
     * @return boolean indicating if all required signatures are present
     */
    function hasAllRequiredSignatures(bytes32 documentId) external view returns (bool);

    /**
     * @dev Gets all signatures for a document
     * @param documentId ID of the document
     * @return Array of signatures
     */
    function getSignatures(bytes32 documentId) external view returns (Signature[] memory);

    /**
     * @dev Gets all required signers for a document
     * @param documentId ID of the document
     * @return Array of required signer DIDs
     */
    function getRequiredSigners(bytes32 documentId) external view returns (bytes32[] memory);
} 