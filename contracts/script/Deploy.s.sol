// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {RewardToken} from "../src/RewardToken.sol";
import {DePINRewardDistributor} from "../src/DePINRewardDistributor.sol";

/// @notice Deploys the token + distributor, funds the pool, and seeds the
///         operator. Env: OPERATOR_ADDRESS, INITIAL_ACCRUAL, POOL_SUPPLY,
///         DEMO_REWARD (0 disables the faucet).
contract Deploy is Script {
    using SafeERC20 for IERC20;

    function run() external {
        address operator = vm.envAddress("OPERATOR_ADDRESS");
        uint256 accrual = vm.envOr("INITIAL_ACCRUAL", uint256(36.75 ether));
        uint256 poolSupply = vm.envOr("POOL_SUPPLY", uint256(1_000_000 ether));
        uint256 demoReward = vm.envOr("DEMO_REWARD", uint256(36.75 ether));

        vm.startBroadcast();

        RewardToken token = new RewardToken(poolSupply);
        DePINRewardDistributor distributor = new DePINRewardDistributor(token, demoReward);

        IERC20(address(token)).safeTransfer(address(distributor), poolSupply);
        distributor.accrue(operator, accrual);

        vm.stopBroadcast();

        console2.log("RewardToken (RWRD):     ", address(token));
        console2.log("DePINRewardDistributor: ", address(distributor));
        console2.log("Operator:               ", operator);
        console2.log("Demo faucet reward:     ", demoReward);
    }
}
