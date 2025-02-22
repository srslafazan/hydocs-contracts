// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "../core/DocumentRegistry.sol";

contract TestDocumentRegistry is DocumentRegistry {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() DocumentRegistry() {
        // Skip initialization in constructor for testing
    }

    function initialize(address _didRegistry) public override initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(DOCUMENT_MANAGER_ROLE, msg.sender);

        didRegistry = IDID(_didRegistry);
    }
} 