# Clear-Claim

**A hardware-gated, clear-signed reward claimer for DePIN operators.**

An autonomous agent watches an operator's claimable rewards and the current gas
price, decides when a claim is worth making, and assembles the transaction — but
it **holds no private key**. The operator approves the claim on a Ledger device
that shows a **human-readable** line (`Claim 142.5 RWRD to 0x9aF3…`) instead of a
raw hash, via an [ERC-7730](https://eips.ethereum.org/EIPS/eip-7730) clear-signing
descriptor.

> The human-in-the-loop is only real if the transaction is readable.

A gate behind hardware is meaningless if the device shows an unreadable hash —
the human is still blind-signing a blank check. Clear-Claim pairs an autonomous
agent with clear signing so the approval step actually protects the operator.

## Architecture

```
 Node agent (viem)          Reward contract            Ledger device (Speculos)
 ────────────────           ───────────────            ────────────────────────
 reads claimable    ──────► DePINRewardDistributor
 + gas price        ◄────── (returns claimable)
 decides when/how
   much to claim
        │
        │ assembles claim tx (viem)
        ▼
 DMK signer (in-process) ── clear-signed via ────────► "Claim 142.5 RWRD
 (no key in the agent)      ERC-7730 descriptor          to 0x9aF3…21bC"
        │                                                operator approves
        │ broadcasts signed tx                           on the secure screen
        ▼
 Sepolia (EVM testnet)
```

| Layer | Tech | Path |
|------|------|------|
| Reward distributor | Solidity (Foundry) | `contracts/` |
| Clear-signing descriptor | ERC-7730 | `descriptor/` |
| Agent (decide + assemble + broadcast) | Node + TypeScript + viem | `agent/` |
| On-device signing | Ledger Device Management Kit + Speculos | `agent/src/signer/` |

## Prerequisites

- **Foundry** (`forge`, `cast`) — contracts
- **Node 20+** — agent and descriptor tooling
- **Docker** — Speculos emulator
- A **Sepolia RPC URL** and a **deployer key funded with Sepolia ETH**
  (used only to deploy + seed rewards — *not* the signing key)
- The **Ethereum app `.elf`** for your Speculos device model
  (see [Speculos](#3-start-speculos-the-signing-device))

---

## Run it end-to-end

### 1. Contracts → Sepolia

```bash
cd contracts
forge test                      # 9 tests, all green
cp .env.example .env            # fill SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY, OPERATOR_ADDRESS
```

`OPERATOR_ADDRESS` is the address your Speculos device derives at
`44'/60'/0'/0/0` — get it in step 3 with `npm run whoami`, then come back here.

```bash
source .env
forge script script/Deploy.s.sol \
  --rpc-url sepolia --broadcast \
  --private-key "$DEPLOYER_PRIVATE_KEY" -vvvv
```

Note the printed **RewardToken** and **DePINRewardDistributor** addresses.

Sanity check the on-chain state:

```bash
cast call <DISTRIBUTOR> "claimable(address)(uint256)" <OPERATOR> --rpc-url sepolia
# -> 142500000000000000000  (142.5 RWRD)
```

### 2. Descriptor → resolve + validate

```bash
cd ../descriptor
npm install
npm run validate                # ✔ valid against ERC-7730 v2 schema

DISTRIBUTOR_ADDRESS=0x... REWARD_TOKEN_ADDRESS=0x... npm run apply-addresses
# writes calldata-...resolved.json (registry-ready) and compiled/<chainId>-<addr>.json
```

### 3. Start Speculos (the signing device)

Speculos doesn't ship Ledger app binaries — provide the Ethereum app `.elf` at
`scripts/apps/ethereum-<model>.elf` (build via
[app-ethereum](https://github.com/LedgerHQ/app-ethereum) + ledger-app-builder, or
copy from a release). Then:

```bash
DEVICE_MODEL=flex scripts/run-speculos.sh     # API + web UI on http://localhost:5000
```

### 4. Agent → decide, clear-sign, broadcast

```bash
cd ../agent
npm install
npm test                        # decision-policy unit tests
cp .env.example .env            # fill addresses, RPC, thresholds
npm run whoami                  # prints the operator address from Speculos
npm run dry-run                 # reads claimable + gas, decides, prints the assembled tx (no device)
npm start                       # full loop: decide -> clear-sign on Speculos -> broadcast
```

When a claim clears the floor and gas is under the ceiling, the agent assembles
the tx and hands it to the device. Approve the readable claim on the Speculos
screen; the agent broadcasts and prints the Sepolia tx hash.

---

## Clear-signing trust (the one honest caveat)

The Ledger device renders clear-signing from **compiled, PKI-signed descriptor
payloads** — not raw ERC-7730 JSON. Ledger's
[Crypto Asset List (CAL)](https://developers.ledger.com/docs/clear-signing/for-wallets)
compiles the ERC-7730 JSON and signs it so the device *trusts* it.

This repo provides the full path **up to** that signature:

- A **real, schema-valid ERC-7730 descriptor** (`descriptor/`), ready to submit
  to the registry / CAL.
- A **custom DMK context module** (`agent/src/signer/contextModule.ts`) that
  serves our descriptor for our contract instead of hitting Ledger's CAL — the
  documented extension point (`SignerEthBuilder.withContextModule`).
- A **compiled-artifact loader**: drop the CAL-signed payloads into
  `descriptor/compiled/<chainId>-<address>.json` and the device renders the full
  `Claim 142.5 RWRD to 0x…`.

Until that signed artifact is present, the agent **signs successfully but logs a
blind-sign warning** — it never silently blind-signs. Submitting the descriptor
to the ERC-7730 registry (so the CAL serves it) closes the loop on real devices.

**Registry submission is prepared and validated** at
`descriptor/registry/clear-claim/calldata-DePINRewardDistributor.json`
(passes `specs/erc7730-v2.schema.json` and `erc7730 lint`). To open the PR:

```bash
gh auth login                       # one-time
scripts/submit-descriptor-pr.sh     # forks the registry, pushes, opens the PR
```

## The agent is keyless — verify it

No private key is in the agent code or its `.env`:

```bash
grep -RinE "0x[0-9a-fA-F]{64}|PRIVATE_KEY=0x|MNEMONIC=" agent/src agent/.env.example
# -> no matches (no key material — only the device signs)
```

Signing happens only through the DMK against the device. The deployer key
(`contracts/.env`) is a separate, one-time setup key and never touches the agent.

## Layout

```
contracts/   Foundry: RewardToken (RWRD) + DePINRewardDistributor + tests + deploy
descriptor/  ERC-7730 descriptor + schema validator + address resolver
agent/       viem reads, decision policy, DMK/Speculos signing, broadcast
scripts/     run-speculos.sh
```
