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
| **Claim signed on Speculos (Ledger Flex) end-to-end** | [`0x5f6b3e13…`](https://sepolia.etherscan.io/tx/0x5f6b3e132c92150d61dbd4bd8f8d5889560f3602bef0f70267732b94817be151) |
| **CLEAR-SIGNED claim ("Claim 142.5 RWRD to 0x…")** | [`0x070730a2…`](https://sepolia.etherscan.io/tx/0x070730a2a257f6c3c7f353d3f68f9f82fef0747f4cdd813cccd083520777f35b) |

### Clear signing works on-device (2026-06-11)

The device now renders the claim in plain language instead of a hash:
`Review transaction to: Claim DePIN rewards` → `Interaction with Clear-Claim` →
`Claim 142.5 RWRD` → `To 0x…` → `Network Ethereum Sepolia`. See
`docs/assets/02-clearsign-intent.png` and `docs/assets/03-clearsign-amount.png`.

This is achieved by vendoring Ledger's `cal-interceptor` (agent/src/vendor): the
agent POSTs the local ERC-7730 descriptor to Ledger's dev backend
(`app.devicesdk.ledger-test.com`) for a test-key-signed descriptor, then
intercepts the DMK's CAL `fetch` calls (with the context module in CAL `test`
mode) to serve it. Works on Speculos/dev apps. `docs/assets/01-without-descriptor-refused.png`
shows the device *refusing to sign* the same tx when no descriptor is available.

### Full loop proven (2026-06-11)

The agent ran against a live **Speculos** Ledger Flex emulator (Ethereum app
v1.22.1): it read claimable on Sepolia → decided → assembled the `claim` tx →
the **device signed it** → the agent broadcast it (tx `0x5f6b3e13…`), dropping
`claimable` 142.5 → 0 and crediting the operator
`0xf35ec83BDcd18BFF5412Df78362557E0F19f13Db`.

**Signing mode:** blind (device showed the tx hash). The device *correctly
refused* to clear-sign first ("This transaction cannot be clear-signed") because
our custom `claim` selector has no Ledger-CAL-trusted ERC-7730 descriptor yet —
exactly the gap Clear-Claim addresses. To render the readable
`Claim 142.5 RWRD to 0x…`, the descriptor
(`descriptor/calldata-depinrewarddistributor.resolved.json`) must be accepted
into the [ERC-7730 registry](https://github.com/LedgerHQ/clear-signing-erc7730-registry)
so Ledger's CAL serves a PKI-signed version.

The live claim decremented `claimable` 142.5 → 0 and transferred 142.5 RWRD to the
operator; the re-accrue restored 142.5 RWRD claimable for the next run.

> To re-point rewards at the Speculos operator: fund that address with a little
> Sepolia ETH (it pays claim gas), then `cast send <distributor>
> "accrue(address,uint256)" <speculosOperator> 142500000000000000000`
> from the owner key.
