/contracts
/core
DIDRegistry.sol # Core DID management contract
DocumentRegistry.sol # Document management contract
SignatureManager.sol # Handles document signatures
/interfaces
IDID.sol # DID interface definitions
IDocument.sol # Document interface definitions
ISignature.sol # Signature interface definitions
/utils
AccessControl.sol # Role-based access control
ZKProofValidator.sol # ZK proof validation utilities

/lib
/zk
prover.js # ZK proof generation
verifier.js # ZK proof verification
/crypto
hashing.js # Cryptographic utilities
signatures.js # Signature utilities

/api
/routes
did.js # DID management endpoints
documents.js # Document management endpoints
signatures.js # Signature management endpoints
/middleware
auth.js # Authentication middleware
validation.js # Request validation

/services
/identity
DIDService.js # DID business logic
VerifierService.js # Identity verification logic
/documents
DocumentService.js # Document management logic
SignatureService.js # Signature processing logic

/db
/models
DID.js # DID data model
Document.js # Document data model
Signature.js # Signature data model

/test
/contracts # Smart contract tests
/api # API endpoint tests
/services # Service layer tests
/integration # End-to-end tests

/scripts
deploy.js # Deployment scripts
setup.js # Initial setup scripts

/config
default.json # Default configuration
test.json # Test configuration
