// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "../core/DIDRegistry.sol";

contract TestDIDRegistry is DIDRegistry {
    // Concrete implementation of the abstract contract for testing
    constructor() DIDRegistry() {}
} 