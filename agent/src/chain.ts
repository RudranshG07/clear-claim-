import {
  createPublicClient,
  http,
  encodeFunctionData,
  hexToBytes,
  type Address,
  type Hex,
} from "viem";
import { sepolia } from "viem/chains";
import type { AgentConfig } from "./config.js";
import { distributorAbi } from "./abi.js";

export type Chain = ReturnType<typeof createChain>;

export function createChain(cfg: AgentConfig) {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(cfg.rpcUrl),
  });

  return {
    client,

    /** Rewards the operator can currently claim. */
    async claimable(operator: Address): Promise<bigint> {
      return client.readContract({
        address: cfg.distributor,
        abi: distributorAbi,
        functionName: "claimable",
        args: [operator],
      });
    },

    /** Current suggested EIP-1559 fees. */
    async fees(): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
      const { maxFeePerGas, maxPriorityFeePerGas } =
        await client.estimateFeesPerGas();
      return { maxFeePerGas, maxPriorityFeePerGas };
    },

    /** Next nonce for the operator. */
    async nonce(operator: Address): Promise<number> {
      return client.getTransactionCount({ address: operator });
    },

    /** Encode claim(amount, to) calldata. */
    encodeClaim(amount: bigint, to: Address): Hex {
      return encodeFunctionData({
        abi: distributorAbi,
        functionName: "claim",
        args: [amount, to],
      });
    },

    /** Estimate gas for the operator's claim call. */
    async estimateClaimGas(
      operator: Address,
      amount: bigint,
      to: Address,
    ): Promise<bigint> {
      return client.estimateContractGas({
        account: operator,
        address: cfg.distributor,
        abi: distributorAbi,
        functionName: "claim",
        args: [amount, to],
      });
    },
  };
}

/** Hex -> bytes helper re-export so callers don't import viem directly. */
export { hexToBytes };
