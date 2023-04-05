// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

library Roles {
    // Reserved roles (0-64)
    uint8 internal constant OPERATOR = 1;
    uint8 internal constant STRATEGIST = 2;
    uint8 internal constant HARVESTER = 3;
    uint8 internal constant BRIDGE_ADMIN = 4;
    uint8 internal constant BRIDGE_OPERATOR = 5;

    // Free to grab (65-255)
}
