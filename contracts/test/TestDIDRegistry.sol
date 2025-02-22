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

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    // Add any test-specific functions here if needed
    // For now, we just need the contract to exist for testing
} 