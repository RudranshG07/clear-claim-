# Clear-Claim — Ledger Agent Stack submission (BNT-0038, Lane C)

**An autonomous, keyless DePIN reward agent whose every signing path ends on a
Ledger — and only ever asks the human to approve something they can actually read.**

Built with the **Ledger Device Management Kit (DMK)**, demonstrated end-to-end on
**Speculos** (no hardware required), signing real transactions on Ethereum Sepolia.

---

## The idea (and why it fits the brief)

Ledger's thesis: *the missing layer in agentic crypto is deterministic,
hardware-enforced guardrails.* Clear-Claim takes the next step:

> A hardware gate is meaningless if the device shows an unreadable hash — the
> human is still blind-signing a blank check. The human-in-the-loop is only real
> if the transaction is **readable**.

So Clear-Claim pairs an autonomous agent with **clear signing**: the agent does
the work (watch rewards, decide, assemble the tx) but holds **no private key**,
and the operator approves a human-readable `Claim 142.5 RWRD to 0x…` on the
device. The same descriptor that makes it readable is contributed back to
**Ledger's ERC-7730 registry** — so the project doesn't just *use* Ledger, it
*extends* its ecosystem.

## How it uses the Ledger Agent Stack (DMK)

The agent (`agent/src/`) is pure TypeScript + viem and never touches a key:

1. Reads the operator's `claimable` balance + gas on Sepolia.
2. Decides (claim only above a reward floor and below a gas ceiling).
3. Assembles the `claim(amount,to)` transaction with viem.
4. Hands it **in-process to the DMK** — `@ledgerhq/device-management-kit` +
   `@ledgerhq/device-signer-kit-ethereum` over
   `@ledgerhq/device-transport-kit-speculos` — for on-device approval.
5. The operator approves on the Ledger; the agent broadcasts the signed tx.

A **custom DMK context module** (`agent/src/signer/contextModule.ts`) serves our
own ERC-7730 descriptor for our contract via `SignerEthBuilder.withContextModule`.

## Proof of use (this is the important part)

**The device clear-signs the claim in plain language** — the whole thesis,
working on a Ledger Flex (Speculos):

1. `docs/assets/01-without-descriptor-refused.png` — with no descriptor, the
   device **refuses to sign**: "This transaction cannot be clear-signed."
2. `docs/assets/02-clearsign-intent.png` — "Review transaction to: **Claim DePIN
   rewards**".
3. `docs/assets/03-clearsign-amount.png` — "Interaction with **Clear-Claim** /
   **Claim 142.5 RWRD** / To 0x…".

**Clear-signed claim, broadcast to Sepolia:**
[`0x070730a2…`](https://sepolia.etherscan.io/tx/0x070730a2a257f6c3c7f353d3f68f9f82fef0747f4cdd813cccd083520777f35b)
(block 11036145). The agent log:
```
DECIDE claim 142.5 RWRD ...
connecting to Speculos ... discovered SpeculosID (flex) ... connected
clear signing armed for 11155111:0xe3c8...
Intercepted dapps request ... (descriptors_calldata)
device step: signer.eth.steps.signTransaction
signed on device (v=0)
tx success: 0x070730a2… (block 11036145)
```

**How the readable render works:** the agent serves its own ERC-7730 descriptor
to the device via Ledger's dev clear-signing flow — POST to
`app.devicesdk.ledger-test.com` for a test-key-signed descriptor, then a CAL
`fetch` interceptor (vendored `@ledgerhq/cal-interceptor`) feeds it to the DMK
default context module in CAL `test` mode. This is the same mechanism as Ledger's
own `clear-signing-tester`. (On a production device, the descriptor must be in
Ledger's CAL — the registry route.)

## Contribution back to Ledger

A schema-valid, `erc7730 lint`-clean descriptor for the contract, ready to PR to
the [ERC-7730 registry](https://github.com/ethereum/clear-signing-erc7730-registry):
`descriptor/registry/clear-claim/calldata-DePINRewardDistributor.json`
(`scripts/submit-descriptor-pr.sh` opens the PR). Once Ledger's CAL signs it, the
device renders `Claim 142.5 RWRD to 0x…` instead of the hash.

## On-chain artifacts (Sepolia)

| | |
|---|---|
| RewardToken (RWRD) | `0x7870103dC0108C7F9693A5a712AD94bdaBDD3A9D` |
| DePINRewardDistributor | `0xE3c8900d3be62DeC6cec5374893A89B1873B55A1` |
| Speculos-signed claim | `0x5f6b3e13…` |

## Run it yourself

See `README.md` — `forge test`, deploy, `scripts/run-speculos.sh`, then
`cd agent && npm start`. Emulator-only, no hardware needed.

## Stack
Solidity (Foundry) · TypeScript + viem · **Ledger DMK** (device-management-kit,
device-signer-kit-ethereum, device-transport-kit-speculos) · Speculos (Ledger
Flex) · ERC-7730.
