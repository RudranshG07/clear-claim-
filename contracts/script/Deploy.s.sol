// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {RewardToken} from "../src/RewardToken.sol";
import {DePINRewardDistributor} from "../src/DePINRewardDistributor.sol";

/// @notice Deploys RewardToken + DePINRewardDistributor, funds the reward pool,
///         and accrues a starting reward to the operator so the agent has
///         something to claim.
///
/// Env:
///   OPERATOR_ADDRESS  - the operator whose Ledger/Speculos signs the claim
///                       (the address derived at 44'/60'/0'/0/0 on the seed).
///   INITIAL_ACCRUAL   - reward to credit the operator, in wei (default 142.5e18).
///   POOL_SUPPLY       - total RWRD minted into the pool, in wei (default 1,000,000e18).
///
/// Run:
///   forge script script/Deploy.s.sol --rpc-url sepolia --broadcast -vvvv \
///     --private-key $DEPLOYER_PRIVATE_KEY
contract Deploy is Script {
    using SafeERC20 for IERC20;

    function run() external {
        address operator = vm.envAddress("OPERATOR_ADDRESS");
        uint256 accrual = vm.envOr("INITIAL_ACCRUAL", uint256(142.5 ether));
        uint256 poolSupply = vm.envOr("POOL_SUPPLY", uint256(1_000_000 ether));

        vm.startBroadcast();

        RewardToken token = new RewardToken(poolSupply);
        DePINRewardDistributor distributor = new DePINRewardDistributor(token);

        // Fund the distributor's reward pool, then credit the operator.
        IERC20(address(token)).safeTransfer(address(distributor), poolSupply);
        distributor.accrue(operator, accrual);

        vm.stopBroadcast();

        console2.log("RewardToken (RWRD):     ", address(token));
        console2.log("DePINRewardDistributor: ", address(distributor));
        console2.log("Operator:               ", operator);
        console2.log("Accrued to operator:    ", accrual);
    }
}
