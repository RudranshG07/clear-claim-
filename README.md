# Clear-Claim

**A hardware-gated, clear-signed reward claimer for DePIN operators.**

An autonomous agent watches an operator's claimable rewards and the current gas
price, decides when a claim is worth making, and assembles the transaction — but
it **holds no private key**. The operator approves the claim on a Ledger device
that shows a **human-readable** line (`Claim 36.75 RWRD to 0x9aF3…`) instead of a
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
 DMK signer (in-process) ── clear-signed via ────────► "Claim 36.75 RWRD
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

## Quickstart — zero-deploy demo (~5 min, no key, no faucet)

The fastest way to see the clear-signed claim — **no key, no faucet, no deploy.**
It points at the **live Clear-Claim contracts on Polygon Amoy**. The contract has
a permissionless demo faucet: `claimable()` reports the reward (36.75 RWRD,
modeled on WeatherXM's live rate) for *any* operator, and the claim self-credits
it — so the keyless agent + your single clear-signed approval works for anyone,
repeatable every 60s.

```bash
# 1. Speculos with the Ledger Ethereum app (port 5005 dodges macOS AirPlay on 5000)
mkdir -p scripts/apps
curl -sSL -o scripts/apps/ethereum-flex.elf \
  https://github.com/LedgerHQ/app-ethereum/releases/download/1.22.1/app-1.22.1-flex.elf
API_PORT=5005 DEVICE_MODEL=flex scripts/run-speculos.sh        # web UI: http://localhost:5005

# 2. Agent, pointed at the live contract
cd agent && npm install
cp .env.amoy-demo.example .env
npm start
```

Open **http://localhost:5005**: the Ledger renders **"Claim 36.75 RWRD to 0x… ·
Network Polygon Amoy"**. **Reject** to just see the render (repeatable), or **swipe
+ hold to sign** to broadcast a real on-chain claim (one-shot until re-accrued).

> Honest scope: the reward amount is **real** — pulled live from
> [WeatherXM's public API](https://api.weatherxm.com/api/v1/network/stats) (a real
> DePIN; ~6k stations on Arbitrum), modeled on the actual per-station rate
> (~36 WXM/month). Settlement runs on our **testnet** (Polygon Amoy) contract via
> a permissionless faucet (no DePIN mints claimable *test* rewards). The agent,
> DMK signing, clear-sign render, and on-chain token transfer are all genuine;
> Speculos is Ledger's **official** emulator — just not physical hardware.

---

## Run it end-to-end (deploy your own — ~15 min)

Works on **Sepolia** (`CHAIN_ID=11155111`), **Polygon Amoy** (`80002`), or
**Arbitrum Sepolia** (`421614`). Examples below use Amoy; swap the chain/RPC for
another. You need a deployer key funded with that chain's test gas (a faucet).

### 1. Contracts → deploy + seed a reward

```bash
cd contracts
forge test                              # 9 tests, all green
cp .env.example .env                    # set DEPLOYER_PRIVATE_KEY (funded), OPERATOR_ADDRESS

# OPERATOR_ADDRESS is the address Speculos derives at 44'/60'/0'/0/0 — get it in
# step 2 with `npm run whoami`, then come back and deploy:
source .env
forge script script/Deploy.s.sol --broadcast --legacy \
  --rpc-url https://rpc-amoy.polygon.technology \
  --private-key "$DEPLOYER_PRIVATE_KEY"
# note the printed RewardToken + DePINRewardDistributor addresses
```

### 2. Speculos (the emulated Ledger) + operator

Download the prebuilt Ethereum app and start Speculos (port 5005 avoids the
macOS AirPlay conflict on 5000):

```bash
mkdir -p scripts/apps
curl -sSL -o scripts/apps/ethereum-flex.elf \
  https://github.com/LedgerHQ/app-ethereum/releases/download/1.22.1/app-1.22.1-flex.elf
API_PORT=5005 DEVICE_MODEL=flex scripts/run-speculos.sh   # web UI: http://localhost:5005
```

In another terminal, get the operator address and fund it for claim gas:

```bash
cd agent && npm install
SPECULOS_URL=http://localhost:5005 npm run whoami         # prints the operator address
# fund that address with a little test gas, and accrue rewards to it (owner key):
cast send <DISTRIBUTOR> "accrue(address,uint256)" <OPERATOR> 142500000000000000000 \
  --rpc-url https://rpc-amoy.polygon.technology --private-key "$DEPLOYER_PRIVATE_KEY" --legacy
```

### 3. Agent → decide, **clear-sign**, broadcast

```bash
cd agent
cp .env.example .env     # set CHAIN_ID, RPC_URL, DISTRIBUTOR/REWARD_TOKEN/OPERATOR addrs, SPECULOS_URL=http://localhost:5005
npm test                 # unit tests
npm run dry-run          # reads claimable + gas, decides, prints the assembled tx (no device)
npm start                # full loop: decide -> clear-sign on Speculos -> broadcast
```

When it reaches the device, open **http://localhost:5005**, and you'll see the
Ledger render the claim in plain language:

> Review transaction to **Claim DePIN rewards** → Interaction with **Clear-Claim**
> → **Claim 36.75 RWRD** → To `0x…` → Network **Polygon Amoy**

Swipe through and **hold to sign**. The agent broadcasts and prints the tx hash.
See `docs/assets/` for screenshots of exactly this.

---

## Use your own device

The agent is transport-agnostic (the DMK abstracts the device). Set `TRANSPORT`:

**Your own Speculos (default, `TRANSPORT=speculos`).** Run `scripts/run-speculos.sh`
yourself — it's your own emulated Ledger on your machine. The default seed
derives the same operator everywhere, and the contract's faucet credits it, so it
just works.

**A real hardware Ledger (`TRANSPORT=usb`).** Plug in your Ledger, open the
Ethereum app, and set `TRANSPORT=usb` in `agent/.env` (uses
`@ledgerhq/device-transport-kit-node-hid`, an optional native dep). The agent
connects over USB and you approve on the physical device. The operator becomes
*your* device's address — the faucet credits any address, so it still works (fund
your address with a little test gas).

> Caveat on real hardware: a production Ledger only renders clear-signing for
> descriptors **Ledger's CAL has signed**. Our dev-signed descriptor renders on
> Speculos but not on a stock device, so on real hardware the claim **blind-signs**
> (enable blind signing in the app) until the descriptor is merged into Ledger's
> ERC-7730 registry. The keyless + hardware-gated flow works on real hardware
> today; the readable render needs the registry (the production path).

## How clear signing works here

A production Ledger only renders descriptors that **Ledger's CAL has signed**.
For development/Speculos, Ledger ships a dev path (used by their own
`clear-signing-tester`), which this agent uses automatically:

1. The agent POSTs its ERC-7730 descriptor to Ledger's dev backend
   (`app.devicesdk.ledger-test.com`) → gets a **test-key-signed** descriptor.
2. A vendored `@ledgerhq/cal-interceptor` (`agent/src/vendor/`) intercepts the
   DMK's CAL `fetch` calls (context module in CAL `test` mode) and serves it.

So the readable claim renders on Speculos with **no extra steps**. For a
*production* device, the same descriptor
(`descriptor/registry/clear-claim/calldata-DePINRewardDistributor.json`,
schema-valid + `erc7730 lint`-clean) must be merged into Ledger's
[ERC-7730 registry](https://github.com/ethereum/clear-signing-erc7730-registry)
— `scripts/submit-descriptor-pr.sh` opens that PR.

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
