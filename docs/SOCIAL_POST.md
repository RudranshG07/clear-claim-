# Social post drafts — Ledger BNT-0038

Requirements baked in: tags **@Ledger**, includes **#LedgerSponsor** disclosure,
shows the build (link + on-device proof). Attach `docs/assets/demo.mp4` (or your
own screen recording — see `docs/DEMO_SCRIPT.md`) and/or
`docs/assets/03-clearsign-amount.png` ("Claim 36.75 RWRD to 0x…").

> Note: the clear-signing now actually renders on the device. Lead with that.

---

## Option 1 — X (single post)

> AI agents are signing transactions today — mostly with hot keys in a .env file.
>
> I built **Clear-Claim**: an autonomous agent that manages DePIN reward claims
> but holds NO key. It assembles the tx → the human approves on a Ledger that
> shows **"Claim 36.75 RWRD to 0x…"** (not a hash) → it broadcasts on-chain.
>
> Built on @Ledger's DMK + ERC-7730 clear signing, demoed end-to-end on Speculos
> (Polygon Amoy). A gate is useless if you're blind-signing — the human-in-the-loop
> only works if the tx is readable.
>
> Repo + on-chain proof: <REPO_URL>
>
> #LedgerSponsor

*(attach docs/assets/demo.mp4 or 03-clearsign-amount.png)*

---

## Option 2 — X thread

**1/**
> Most AI agents that move money do it with a hot key in a .env file —
> copyable, stealable. @Ledger shipped the Agent Stack to fix that. I built on it.
>
> Meet **Clear-Claim**: an autonomous, *keyless* DePIN reward agent. 🧵
> #LedgerSponsor

**2/**
> The agent watches an operator's claimable rewards + gas, decides when to claim,
> and assembles the transaction with viem. It holds no private key.
> Signing happens in-process through Ledger's **DMK**.

**3/**
> The human approves on the device. I ran the whole flow on **Speculos**
> (Ledger's emulator) — no hardware needed — and it broadcast a real claim on
> Sepolia: <ETHERSCAN_TX_URL>

**4/**
> Here's the best part. When the agent proposed the claim, the Ledger **refused
> to sign it**: "This transaction cannot be clear-signed."
>
> A hardware gate is meaningless if the screen shows an unreadable hash. The
> device enforces: no readable → no sign.
> *(image: 02-cannot-clear-sign.png)*

**5/**
> So I contributed an **ERC-7730 clear-signing descriptor** back to Ledger's open
> registry — turning the claim into a readable "Claim 36.75 RWRD to 0x…".
> The project doesn't just *use* Ledger; it *extends* it.
>
> Code + proof: <REPO_URL>
> Built for @Ledger N3XT. #LedgerSponsor

---

## Option 3 — LinkedIn

> **Most AI agents that touch money still rely on a private key in a config file.**
> Ledger shipped the Agent Stack to change that — so I built on it.
>
> **Clear-Claim** is an autonomous agent that manages DePIN reward claims for an
> operator. It watches the claimable balance and gas, decides when to claim, and
> assembles the transaction — but it holds **no private key**. Signing happens
> in-process through Ledger's **Device Management Kit (DMK)**, and the human gives
> final approval on the device. I demonstrated the full flow on **Speculos**,
> Ledger's open-source emulator, broadcasting a real claim on Ethereum Sepolia.
>
> The most interesting moment: the Ledger **refused to sign** the agent's
> transaction — "This transaction cannot be clear-signed." A hardware gate is
> meaningless if the device shows an unreadable hash; the human is still
> blind-signing a blank check. So I went further and contributed an **ERC-7730
> clear-signing descriptor** back to Ledger's registry, so the claim renders as a
> readable "Claim 36.75 RWRD to 0x…" on-device.
>
> The missing layer in agentic crypto isn't an agent that can sign — it's an agent
> whose signing the human can actually verify.
>
> Code, on-chain proof, and a full walkthrough: <REPO_URL>
>
> Built for the @Ledger N3XT "Build & Show with the Ledger Agent Stack" challenge.
> #LedgerSponsor
>
> *(attach the on-device screenshot or a short screen recording)*

---

### Fill in before posting
- `<REPO_URL>` — your public GitHub repo
- `<ETHERSCAN_TX_URL>` — https://sepolia.etherscan.io/tx/0x5f6b3e132c92150d61dbd4bd8f8d5889560f3602bef0f70267732b94817be151
- Attach `docs/assets/02-cannot-clear-sign.png` (and ideally a 30–60s screen recording)
- Make sure **@Ledger** is tagged and **#LedgerSponsor** is visible
