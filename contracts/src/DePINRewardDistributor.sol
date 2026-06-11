// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title DePINRewardDistributor
/// @notice Tracks per-operator claimable DePIN rewards and lets an operator
///         claim them. The autonomous agent reads `claimable` and assembles a
///         `claim` transaction, but the operator signs it on a Ledger device.
/// @dev `claim` takes explicit `amount` and `to` parameters on purpose: those
///      calldata fields are what the ERC-7730 descriptor formats into a
///      human-readable "Claim 142.5 RWRD to 0x..." string on the device. A
///      no-arg claim() would leave the device with nothing meaningful to show.
contract DePINRewardDistributor is Ownable {
    using SafeERC20 for IERC20;

    /// @notice The reward token paid out on claim.
    IERC20 public immutable rewardToken;

    /// @notice Rewards an operator has accrued and may claim.
    mapping(address operator => uint256 amount) public claimable;

    event Accrued(address indexed operator, uint256 amount);
    event Claimed(address indexed operator, address indexed to, uint256 amount);

    error AmountZero();
    error InsufficientClaimable(uint256 requested, uint256 available);
    error ZeroAddress();

    constructor(IERC20 token) Ownable(msg.sender) {
        if (address(token) == address(0)) revert ZeroAddress();
        rewardToken = token;
    }

    /// @notice Credit an operator with newly earned rewards. In production this
    ///         is driven by an oracle/settlement of node activity; here the
    ///         owner calls it to simulate continuous DePIN earnings.
    function accrue(address operator, uint256 amount) external onlyOwner {
        if (operator == address(0)) revert ZeroAddress();
        if (amount == 0) revert AmountZero();
        claimable[operator] += amount;
        emit Accrued(operator, amount);
    }

    /// @notice Claim accrued rewards. Caller (the operator) chooses how much to
    ///         claim and the destination. The agent assembles this call; the
    ///         operator approves the readable result on their Ledger.
    /// @param amount Amount of RWRD to claim (<= caller's claimable balance).
    /// @param to     Recipient of the claimed rewards.
    function claim(uint256 amount, address to) external {
        if (amount == 0) revert AmountZero();
        if (to == address(0)) revert ZeroAddress();
        uint256 available = claimable[msg.sender];
        if (amount > available) revert InsufficientClaimable(amount, available);

        unchecked {
            claimable[msg.sender] = available - amount;
        }
        emit Claimed(msg.sender, to, amount);
        rewardToken.safeTransfer(to, amount);
    }
}
