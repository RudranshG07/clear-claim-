# Deployments

The agent is multi-chain (`CHAIN_ID` selects the network). Deployed and ran the
full clear-signed flow on two networks.

## Polygon Amoy (chainId 80002 — the testnet of DIMO's chain) — **live demo**

Current contracts (with the permissionless demo faucet):

| Contract | Address |
|---|---|
| RewardToken (RWRD) | [`0x9B60A21F729CC6138E89d84615c1c26b06f31354`](https://amoy.polygonscan.com/address/0x9B60A21F729CC6138E89d84615c1c26b06f31354) |
| DePINRewardDistributor (faucet) | [`0x699B46c34cDd4480E6160FaDcC982D3Bf8E6E6f5`](https://amoy.polygonscan.com/address/0x699B46c34cDd4480E6160FaDcC982D3Bf8E6E6f5) |

**Anyone can run the full flow with zero setup:** `claimable()` reports the demo
reward (36.75 RWRD, modeled on WeatherXM's live per-station rate) for any address
once a 60s cooldown elapses, and `claim()` self-credits it — so the keyless agent
+ a single clear-signed claim works for anybody, no accrue from us. Proven:
[`0x6957a89a…`](https://amoy.polygonscan.com/tx/0x6957a89a67c9938cbc77cd5e563f9d6a0f986afe18ef58140a1960872aa3cdfc)
(operator had 0 accrued → faucet self-credited → received 36.75 RWRD).

Earlier (pre-faucet) deployment: RWRD `0x25701aCCf2B9774afE71f43f4e010Eb82a0A7444`,
distributor `0x9C1c395C0B1B15eF4DE0B618597b1e221b7E2128`.

- **Operator:** `0xf35ec83BDcd18BFF5412Df78362557E0F19f13Db` (Speculos seed `44'/60'/0'/0/0`)
- **Clear-signed claim** (device showed "Claim 142.5 RWRD to 0x…", "Network: Polygon Amoy"):
  [`0x1f9dc7b4…`](https://amoy.polygonscan.com/tx/0x1f9dc7b4fe75c3dc3c818b0db49ca21874d81a2ec7177ce622a49da1565852d8)
- **Clear-signed claim with the live WeatherXM reward** ("Claim 36.75 RWRD" — the
  real per-station monthly rate from `api.weatherxm.com`):
  [`0x04e104c2…`](https://amoy.polygonscan.com/tx/0x04e104c2e0dc46646a5fa4d966fdb99b7890c95212065a5954e4f4c48e559cd7)
- Proof: `docs/assets/amoy-amount.png`, `docs/assets/amoy-network.png`, `docs/assets/demo.mp4`.

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
