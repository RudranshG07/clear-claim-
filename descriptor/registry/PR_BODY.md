## Clear-Claim — DePINRewardDistributor

Adds a calldata clear-signing descriptor for the `claim(uint256 amount, address to)`
function of Clear-Claim's `DePINRewardDistributor`.

**What it does:** instead of a raw hash, the operator sees
`Claim <amount> RWRD to <address>` on their Ledger when an autonomous agent
proposes a DePIN reward claim — so the human-in-the-loop approval is actually
readable.

**Entity:** Clear-Claim
**Contract:** `DePINRewardDistributor`
**Deployment:** Sepolia (chainId 11155111) `0xE3c8900d3be62DeC6cec5374893A89B1873B55A1`
**Reward token (RWRD):** `0x7870103dC0108C7F9693A5a712AD94bdaBDD3A9D`

### Validation
- Validates against `specs/erc7730-v2.schema.json`.
- `erc7730 lint` reports no errors. (ABI cross-check is skipped because the
  testnet contract is not yet verified on the block explorer; the descriptor
  includes the relevant ABI inline.)

This descriptor is part of the Clear-Claim project, which pairs an autonomous,
keyless reward-claiming agent with clear signing so the operator only ever
approves transactions they can actually read.
