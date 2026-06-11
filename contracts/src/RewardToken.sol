// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title RewardToken
/// @notice The DePIN reward token (RWRD). 18 decimals so the Ledger device can
///         render amounts like "142.5 RWRD" via the ERC-7730 descriptor.
/// @dev Minted to the deployer at construction; the deployer funds the
///      DePINRewardDistributor's reward pool. Owner can mint more for demos.
contract RewardToken is ERC20, Ownable {
    constructor(uint256 initialSupply)
        ERC20("DePIN Reward", "RWRD")
        Ownable(msg.sender)
    {
        _mint(msg.sender, initialSupply);
    }

    /// @notice Mint additional supply (demo convenience).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
