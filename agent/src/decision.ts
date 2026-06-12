// Claim only when the reward clears the floor and gas is below the ceiling.
export type DecisionInput = {
  claimable: bigint;
  maxFeePerGas: bigint;
  floor: bigint;
  ceiling: bigint;
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
  return {
    claim: true,
    amount: claimable,
    reason: `claimable ${claimable} >= floor ${floor} and gas ${maxFeePerGas} <= ceiling ${ceiling}`,
  };
}
