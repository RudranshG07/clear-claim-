// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract DePINRewardDistributor is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable rewardToken;
    uint256 public immutable demoReward;
    uint256 public constant DRIP_COOLDOWN = 60;

    mapping(address operator => uint256 amount) private _accrued;
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

    function claimable(address operator) public view returns (uint256) {
        uint256 accrued = _accrued[operator];
        if (accrued > 0) return accrued;
        if (_faucetReady(operator)) return demoReward;
        return 0;
    }

    function accrue(address operator, uint256 amount) external onlyOwner {
        if (operator == address(0)) revert ZeroAddress();
        if (amount == 0) revert AmountZero();
        _accrued[operator] += amount;
        emit Accrued(operator, amount);
    }

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
