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
///      human-readable "Claim 36.75 RWRD to 0x..." string on the device.
///
///      Two ways an operator gets a claimable balance:
///        1. `accrue` (onlyOwner) — the production path: the DePIN protocol's
///           reward settlement credits the operator.
///        2. a permissionless **demo faucet** — so anyone can run the full
///           keyless flow without us. `claimable()` reports `demoReward` once the
///           per-operator cooldown elapses, and `claim()` self-credits it. The
///           agent stays keyless: the operator's single clear-signed claim both
///           drips and transfers.
contract DePINRewardDistributor is Ownable {
    using SafeERC20 for IERC20;

    /// @notice The reward token paid out on claim.
    IERC20 public immutable rewardToken;

    /// @notice Demo faucet reward (wei), modeled on WeatherXM's live per-station
    ///         rate at deploy time. Zero disables the faucet (production mode).
    uint256 public immutable demoReward;

    /// @notice Min seconds between demo-faucet drips per operator.
    uint256 public constant DRIP_COOLDOWN = 60;

    /// @dev Owner-accrued (real) rewards per operator.
    mapping(address operator => uint256 amount) private _accrued;

    /// @notice Last time an operator received a demo-faucet drip.
    mapping(address operator => uint256 timestamp) public lastDrip;

    event Accrued(address indexed operator, uint256 amount);
    event Dripped(address indexed operator, uint256 amount);
    event Claimed(address indexed operator, address indexed to, uint256 amount);

    error AmountZero();
    error InsufficientClaimable(uint256 requested, uint256 available);
    error ZeroAddress();

    constructor(IERC20 token, uint256 demoReward_) Ownable(msg.sender) {
        if (address(token) == address(0)) revert ZeroAddress();
        rewardToken = token;
        demoReward = demoReward_;
    }

    /// @notice Rewards an operator can currently claim — real accrued balance,
    ///         or the demo-faucet reward once the cooldown has elapsed.
    function claimable(address operator) public view returns (uint256) {
        uint256 accrued = _accrued[operator];
        if (accrued > 0) return accrued;
        if (_faucetReady(operator)) return demoReward;
        return 0;
    }

    /// @notice Credit an operator with newly earned rewards. Production path —
    ///         driven by the DePIN protocol's settlement of node activity.
    function accrue(address operator, uint256 amount) external onlyOwner {
        if (operator == address(0)) revert ZeroAddress();
        if (amount == 0) revert AmountZero();
        _accrued[operator] += amount;
        emit Accrued(operator, amount);
    }

    /// @notice Claim accrued rewards. Caller (the operator) chooses how much to
    ///         claim and the destination. If the caller has nothing accrued and
    ///         the demo faucet is ready, it self-credits `demoReward` first — so
    ///         anyone can run the full flow with just their device.
    /// @param amount Amount of RWRD to claim.
    /// @param to     Recipient of the claimed rewards.
    function claim(uint256 amount, address to) external {
        if (amount == 0) revert AmountZero();
        if (to == address(0)) revert ZeroAddress();

        uint256 available = _accrued[msg.sender];
        if (available < amount && _faucetReady(msg.sender)) {
            available += demoReward;
            lastDrip[msg.sender] = block.timestamp;
            emit Dripped(msg.sender, demoReward);
        }
        if (amount > available) revert InsufficientClaimable(amount, available);

        unchecked {
            _accrued[msg.sender] = available - amount;
        }
        emit Claimed(msg.sender, to, amount);
        rewardToken.safeTransfer(to, amount);
    }

    function _faucetReady(address operator) internal view returns (bool) {
        if (demoReward == 0) return false;
        uint256 last = lastDrip[operator];
        return last == 0 || block.timestamp >= last + DRIP_COOLDOWN;
    }
}
