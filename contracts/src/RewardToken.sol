// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title RewardToken
/// @notice DePIN reward token (RWRD), minted to the deployer who funds the
///         distributor's pool.
contract RewardToken is ERC20, Ownable {
    constructor(uint256 initialSupply)
        ERC20("DePIN Reward", "RWRD")
        Ownable(msg.sender)
    {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
