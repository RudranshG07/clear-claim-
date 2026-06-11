# Deployments

## Sepolia (chainId 11155111)

| Contract | Address |
|---|---|
| RewardToken (RWRD) | [`0x7870103dC0108C7F9693A5a712AD94bdaBDD3A9D`](https://sepolia.etherscan.io/address/0x7870103dC0108C7F9693A5a712AD94bdaBDD3A9D) |
| DePINRewardDistributor | [`0xE3c8900d3be62DeC6cec5374893A89B1873B55A1`](https://sepolia.etherscan.io/address/0xE3c8900d3be62DeC6cec5374893A89B1873B55A1) |

- **Owner / deployer:** `0x1C1c93aD480b748DDfbD47B849d5654996DEda60`
- **Current operator** (has claimable rewards): `0x1C1c93aD480b748DDfbD47B849d5654996DEda60`
  (temporarily the deployer; switch to the Speculos-derived address for the on-device demo)
- **Reward pool:** 1,000,000 RWRD held by the distributor
- **Claimable to operator:** 142.5 RWRD

### Proof transactions

| Action | Tx |
|---|---|
| Deploy + fund + accrue | run `0x204eccfc…`, `0xd757084a…`, `0x2b32b871…` |
| Live claim (142.5 RWRD) | [`0xda5565f3…`](https://sepolia.etherscan.io/tx/0xda5565f3c515dd48e72a059367afcfcdd3ab1f7c4664c6d41f4115481d848d7e) |
| Re-accrue (reset for demo) | [`0xddf5223e…`](https://sepolia.etherscan.io/tx/0xddf5223eea833ebe031ac04bd714c8b373587e47f19cbec1495ac3d569108838) |

The live claim decremented `claimable` 142.5 → 0 and transferred 142.5 RWRD to the
operator; the re-accrue restored 142.5 RWRD claimable for the next run.

> To re-point rewards at the Speculos operator: fund that address with a little
> Sepolia ETH (it pays claim gas), then `cast send <distributor>
> "accrue(address,uint256)" <speculosOperator> 142500000000000000000`
> from the owner key.
