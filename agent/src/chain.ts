import {
  createPublicClient,
  http,
  encodeFunctionData,
  hexToBytes,
  type Address,
  type Hex,
} from "viem";
import type { AgentConfig } from "./config.js";
import { distributorAbi } from "./abi.js";

export type Chain = ReturnType<typeof createChain>;

export function createChain(cfg: AgentConfig) {
  const client = createPublicClient({
    chain: cfg.chain,
    transport: http(cfg.rpcUrl),
  });

  return {
    client,

    async claimable(operator: Address): Promise<bigint> {
      return client.readContract({
        address: cfg.distributor,
        abi: distributorAbi,
        functionName: "claimable",
        args: [operator],
      });
    },

    async fees(): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
      const { maxFeePerGas, maxPriorityFeePerGas } =
        await client.estimateFeesPerGas();
      return { maxFeePerGas, maxPriorityFeePerGas };
    },

    async nonce(operator: Address): Promise<number> {
      return client.getTransactionCount({ address: operator });
    },

    encodeClaim(amount: bigint, to: Address): Hex {
      return encodeFunctionData({
        abi: distributorAbi,
        functionName: "claim",
        args: [amount, to],
      });
    },

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

export { hexToBytes };
