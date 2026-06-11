/**
 * The "intelligence" layer. Pure and unit-testable: given the current
 * claimable balance and gas, decide whether to propose a claim.
 *
 * Policy: claim only when the reward clears a floor AND gas is below the
 * operator's ceiling. This is what keeps the agent from claiming dust or
 * claiming into a gas spike.
 */
export type DecisionInput = {
  claimable: bigint; // operator's claimable RWRD (wei)
  maxFeePerGas: bigint; // current suggested max fee (wei)
  floor: bigint; // min RWRD worth claiming (wei)
  ceiling: bigint; // max gas the operator tolerates (wei)
};

export type Decision =
  | { claim: true; amount: bigint; reason: string }
  | { claim: false; reason: string };

export function decide(input: DecisionInput): Decision {
  const { claimable, maxFeePerGas, floor, ceiling } = input;

  if (claimable === 0n) {
    return { claim: false, reason: "nothing claimable" };
  }
  if (claimable < floor) {
    return {
      claim: false,
      reason: `claimable below floor (have ${claimable}, need ${floor})`,
    };
  }
  if (maxFeePerGas > ceiling) {
    return {
      claim: false,
      reason: `gas above ceiling (maxFeePerGas ${maxFeePerGas} > ${ceiling})`,
    };
  }
  // Claim the full claimable balance.
  return {
    claim: true,
    amount: claimable,
    reason: `claimable ${claimable} >= floor ${floor} and gas ${maxFeePerGas} <= ceiling ${ceiling}`,
  };
}
