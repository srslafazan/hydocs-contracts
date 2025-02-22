// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../interfaces/IDID.sol";
import "../interfaces/IDocument.sol";

/**
 * @title DocumentRegistry
 * @dev Manages document metadata and signatures on-chain while preserving privacy
 */
contract DocumentRegistry is Initializable, AccessControlUpgradeable, PausableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable, IDocument {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DOCUMENT_MANAGER_ROLE = keccak256("DOCUMENT_MANAGER_ROLE");

    // Document status constants
    bytes32 public constant ACTIVE = keccak256("ACTIVE");
    bytes32 public constant REVOKED = keccak256("REVOKED");
    bytes32 public constant EXPIRED = keccak256("EXPIRED");

    // Document type constants
    bytes32 public constant TYPE_GENERAL = keccak256("GENERAL");
    bytes32 public constant TYPE_LEGAL = keccak256("LEGAL");
    bytes32 public constant TYPE_FINANCIAL = keccak256("FINANCIAL");
    bytes32 public constant TYPE_IDENTITY = keccak256("IDENTITY");

    IDID public didRegistry;

    // Mapping from document ID to Document
    mapping(bytes32 => IDocument.Document) public documents;
    
    // Mapping from document ID to array of signatures
    mapping(bytes32 => IDocument.Signature[]) public signatures;

    // Mapping from document ID to required signers (DIDs)
    mapping(bytes32 => bytes32[]) public requiredSigners;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        // Empty constructor
    }

    function initialize(address _didRegistry) public virtual initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(DOCUMENT_MANAGER_ROLE, msg.sender);

        didRegistry = IDID(_didRegistry);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    function _createDocument(
        bytes32 contentHash,
        bytes32 documentType,
        uint256 expiresAt,
        string memory metadata,
        bytes32[] memory requiredSignerDids
    ) internal returns (bytes32) {
        bytes32 documentId = keccak256(abi.encodePacked(contentHash, block.timestamp, msg.sender));
        
        // Get owner's DID from the registry
        bytes32 ownerDidId = didRegistry.getDIDByAddress(msg.sender);
        require(ownerDidId != bytes32(0), "Owner must have an active DID");
        (, , bool active) = didRegistry.getDIDMetadata(ownerDidId);
        require(active, "Owner must have an active DID");

        // Create document
        documents[documentId] = IDocument.Document({
            contentHash: contentHash,
            documentType: documentType,
            owner: msg.sender,
            did: ownerDidId,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            status: ACTIVE,
            metadata: metadata,
            version: 1
        });

        // Store required signers
        if (requiredSignerDids.length > 0) {
            requiredSigners[documentId] = requiredSignerDids;
        }

        return documentId;
    }

    function registerDocument(
        bytes32 contentHash,
        bytes32 documentType,
        uint256 expiresAt,
        string memory metadata,
        bytes32[] memory requiredSignerDids
    ) external override whenNotPaused returns (bytes32) {
        require(contentHash != bytes32(0), "Content hash cannot be empty");
        require(documentType != bytes32(0), "Document type cannot be empty");
        
        bytes32 documentId = _createDocument(
            contentHash,
            documentType,
            expiresAt,
            metadata,
            requiredSignerDids
        );

        emit DocumentRegistered(
            documentId,
            contentHash,
            documentType,
            msg.sender,
            documents[documentId].did,
            expiresAt
        );
        return documentId;
    }

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
    ) external override whenNotPaused {
        require(documentId != bytes32(0), "DocumentRegistry: Invalid document ID");
        require(documents[documentId].contentHash != bytes32(0), "DocumentRegistry: Document does not exist");
        require(documents[documentId].status == ACTIVE, "DocumentRegistry: Document is not active");

        // Get signer's DID
        bytes32 signerDidId = didRegistry.getDIDByAddress(msg.sender);
        require(signerDidId != bytes32(0), "DocumentRegistry: Signer must have an active DID");
        
        // Check if signer has an active DID
        (, , bool active) = didRegistry.getDIDMetadata(signerDidId);
        require(active, "DocumentRegistry: Signer must have an active DID");

        // Check if document has expired
        if (documents[documentId].expiresAt > 0 && block.timestamp >= documents[documentId].expiresAt) {
            documents[documentId].status = EXPIRED;
            emit DocumentStatusChanged(documentId, ACTIVE, EXPIRED);
            revert("DocumentRegistry: Document has expired");
        }

        // Add signature
        signatures[documentId].push(IDocument.Signature({
            signerDid: signerDidId,
            timestamp: block.timestamp,
            signatureType: signatureType,
            metadata: metadata
        }));

        emit DocumentSigned(documentId, signerDidId, signatureType, block.timestamp);
    }

    /**
     * @dev Revokes a document
     * @param documentId ID of the document to revoke
     */
    function revokeDocument(bytes32 documentId) external override {
        require(documentId != bytes32(0), "DocumentRegistry: Invalid document ID");
        require(documents[documentId].contentHash != bytes32(0), "DocumentRegistry: Document does not exist");
        require(
            documents[documentId].owner == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "DocumentRegistry: Not authorized"
        );
        require(documents[documentId].status == ACTIVE, "DocumentRegistry: Document is not active");

        bytes32 oldStatus = documents[documentId].status;
        documents[documentId].status = REVOKED;
        
        emit DocumentStatusChanged(documentId, oldStatus, REVOKED);
    }

    /**
     * @dev Updates document metadata
     * @param documentId ID of the document to update
     * @param metadata New metadata
     */
    function updateMetadata(bytes32 documentId, string calldata metadata) external override {
        require(documentId != bytes32(0), "DocumentRegistry: Invalid document ID");
        require(documents[documentId].contentHash != bytes32(0), "DocumentRegistry: Document does not exist");
        require(documents[documentId].owner == msg.sender, "DocumentRegistry: Not authorized");
        require(documents[documentId].status == ACTIVE, "DocumentRegistry: Document is not active");

        documents[documentId].metadata = metadata;
        documents[documentId].version += 1;
    }

    /**
     * @dev Checks if a document has all required signatures
     * @param documentId ID of the document to check
     * @return boolean indicating if all required signatures are present
     */
    function hasAllRequiredSignatures(bytes32 documentId) external override view returns (bool) {
        bytes32[] memory required = requiredSigners[documentId];
        if (required.length == 0) return true;

        IDocument.Signature[] memory docSignatures = signatures[documentId];
        for (uint i = 0; i < required.length; i++) {
            bool found = false;
            for (uint j = 0; j < docSignatures.length; j++) {
                if (required[i] == docSignatures[j].signerDid) {
                    found = true;
                    break;
                }
            }
            if (!found) return false;
        }
        return true;
    }

    /**
     * @dev Gets all signatures for a document
     * @param documentId ID of the document
     * @return Array of signatures
     */
    function getSignatures(bytes32 documentId) external override view returns (IDocument.Signature[] memory) {
        return signatures[documentId];
    }

    /**
     * @dev Gets all required signers for a document
     * @param documentId ID of the document
     * @return Array of required signer DIDs
     */
    function getRequiredSigners(bytes32 documentId) external override view returns (bytes32[] memory) {
        return requiredSigners[documentId];
    }

    /**
     * @dev Pauses the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Converts a bytes32 to a string
     * @param _bytes32 The bytes32 to convert
     * @return string The converted string
     */
    function bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
        bytes memory bytesArray = new bytes(32);
        for (uint256 i = 0; i < 32; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }
} 