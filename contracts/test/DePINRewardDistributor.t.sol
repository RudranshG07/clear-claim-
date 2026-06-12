// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RewardToken} from "../src/RewardToken.sol";
import {DePINRewardDistributor} from "../src/DePINRewardDistributor.sol";

contract DePINRewardDistributorTest is Test {
    RewardToken internal token;
    DePINRewardDistributor internal distributor;

    address internal owner = address(this);
    address internal operator = makeAddr("operator");
    address internal recipient = makeAddr("recipient");

    uint256 internal constant POOL = 1_000_000 ether;
    uint256 internal constant ACCRUAL = 142.5 ether;

    event Accrued(address indexed operator, uint256 amount);
    event Claimed(address indexed operator, address indexed to, uint256 amount);

    function setUp() public {
        token = new RewardToken(POOL);
        // demoReward = 0 → faucet disabled for the accrue/claim tests.
        distributor = new DePINRewardDistributor(token, 0);
        // Fund the distributor's reward pool.
        require(token.transfer(address(distributor), POOL), "fund failed");
    }

    function test_AccrueCreditsOperator() public {
        vm.expectEmit(true, false, false, true);
        emit Accrued(operator, ACCRUAL);
        distributor.accrue(operator, ACCRUAL);
        assertEq(distributor.claimable(operator), ACCRUAL);
    }

    function test_ClaimHappyPath() public {
        distributor.accrue(operator, ACCRUAL);

        vm.expectEmit(true, true, false, true);
        emit Claimed(operator, recipient, ACCRUAL);

        vm.prank(operator);
        distributor.claim(ACCRUAL, recipient);

        assertEq(distributor.claimable(operator), 0);
        assertEq(token.balanceOf(recipient), ACCRUAL);
        assertEq(token.balanceOf(address(distributor)), POOL - ACCRUAL);
    }

    function test_PartialClaimLeavesRemainder() public {
        distributor.accrue(operator, ACCRUAL);

        vm.prank(operator);
        distributor.claim(100 ether, recipient);

        assertEq(distributor.claimable(operator), 42.5 ether);
        assertEq(token.balanceOf(recipient), 100 ether);
    }

    function test_ClaimToSelf() public {
        distributor.accrue(operator, ACCRUAL);
        vm.prank(operator);
        distributor.claim(ACCRUAL, operator);
        assertEq(token.balanceOf(operator), ACCRUAL);
    }

    function test_RevertWhen_OverClaim() public {
        distributor.accrue(operator, ACCRUAL);
        vm.prank(operator);
        vm.expectRevert(
            abi.encodeWithSelector(
                DePINRewardDistributor.InsufficientClaimable.selector,
                ACCRUAL + 1,
                ACCRUAL
            )
        );
        distributor.claim(ACCRUAL + 1, recipient);
    }

    function test_RevertWhen_ClaimZero() public {
        distributor.accrue(operator, ACCRUAL);
        vm.prank(operator);
        vm.expectRevert(DePINRewardDistributor.AmountZero.selector);
        distributor.claim(0, recipient);
    }

    function test_RevertWhen_ClaimToZeroAddress() public {
        distributor.accrue(operator, ACCRUAL);
        vm.prank(operator);
        vm.expectRevert(DePINRewardDistributor.ZeroAddress.selector);
        distributor.claim(ACCRUAL, address(0));
    }

    function test_RevertWhen_NonOwnerAccrues() public {
        vm.prank(operator);
        vm.expectRevert();
        distributor.accrue(operator, ACCRUAL);
    }

    function testFuzz_ClaimNeverExceedsAccrual(uint256 accrual, uint256 claimAmount) public {
        accrual = bound(accrual, 1, POOL);
        claimAmount = bound(claimAmount, 1, accrual);
        distributor.accrue(operator, accrual);

        vm.prank(operator);
        distributor.claim(claimAmount, recipient);

        assertEq(distributor.claimable(operator), accrual - claimAmount);
        assertEq(token.balanceOf(recipient), claimAmount);
    }

    // --- permissionless demo faucet ---

    uint256 internal constant DEMO = 36.75 ether;

    function _faucetDistributor() internal returns (DePINRewardDistributor d) {
        d = new DePINRewardDistributor(token, DEMO);
        token.mint(address(d), POOL); // mint a fresh pool to fund it
    }

    function test_FaucetReportsDemoRewardWhenReady() public {
        DePINRewardDistributor d = _faucetDistributor();
        // fresh operator, no accrual → claimable reports the demo reward
        assertEq(d.claimable(operator), DEMO);
    }

    function test_FaucetClaimSelfCredits() public {
        DePINRewardDistributor d = _faucetDistributor();
        vm.prank(operator);
        d.claim(DEMO, recipient); // self-drips, then transfers
        assertEq(token.balanceOf(recipient), DEMO);
        // immediately after, the cooldown blocks another drip
        assertEq(d.claimable(operator), 0);
    }

    function test_FaucetCooldownThenReady() public {
        DePINRewardDistributor d = _faucetDistributor();
        vm.prank(operator);
        d.claim(DEMO, recipient);
        assertEq(d.claimable(operator), 0);
        vm.warp(block.timestamp + d.DRIP_COOLDOWN());
        assertEq(d.claimable(operator), DEMO); // ready again
    }

    function test_FaucetDisabledWhenDemoRewardZero() public view {
        // setUp's distributor has demoReward = 0 → faucet off
        assertEq(distributor.claimable(operator), 0);
    }
}
