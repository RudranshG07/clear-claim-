# Demo recording script (60–90s)

A short screen recording is the strongest proof for the bounty. Record your
terminal + the Speculos browser (http://localhost:5005). `docs/assets/demo.mp4`
is a captioned screenshot version you can use as a fallback or B-roll.

## Setup (before recording)
```bash
# Speculos with the Ledger Ethereum app
API_PORT=5005 DEVICE_MODEL=flex scripts/run-speculos.sh

# in agent/, point at the live Amoy contract
cd agent && cp .env.amoy-demo.example .env
```
Make sure http://localhost:5005 shows the Ethereum app home screen.

## Recording (what to show + say)

**1. The problem (5s).**
> "AI agents that move money usually hold a hot key in a .env file. Clear-Claim's
> agent holds no key — and the human only approves what they can read."

**2. Run the agent (15s).** Show the terminal:
```bash
npm start
```
Point at the log: `claimable=~36.75 RWRD (live WeatherXM rate)`, `DECIDE claim`, `clear signing armed`,
`Intercepted dapps request …`.
> "The agent reads the operator's DePIN rewards, decides to claim, and assembles
> the transaction — using Ledger's DMK to sign."

**3. The device (30s).** Switch to http://localhost:5005:
- "Review transaction to **Claim DePIN rewards**"
- swipe → "Interaction with **Clear-Claim** · **Claim 36.75 RWRD** · To 0x…"
- swipe → "Network **Polygon Amoy**"
- swipe → **hold to sign**
> "This is the whole point — the Ledger shows a readable claim, not a hash. The
> human approves something they can actually verify."

**4. On-chain (10s).** Back to the terminal:
> "Signed on the device, broadcast on-chain."
Show `tx success: 0x…` and open the polygonscan link.

**5. Close (5s).**
> "Keyless agent, hardware-gated, clear-signed — built on the Ledger Agent Stack,
> demoed on Speculos. #LedgerSponsor"

## Optional B-roll
- `docs/assets/01-without-descriptor-refused.png` — the device refusing to sign
  without a descriptor (great for the "why clear signing matters" beat).
- `docs/assets/demo.mp4` — the captioned 15s sequence.
