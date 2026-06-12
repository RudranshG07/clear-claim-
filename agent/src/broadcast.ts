import type { Hex } from "viem";
import type { Chain } from "./chain.js";

export async function broadcast(
  chain: Chain,
  signedTx: Hex,
): Promise<{ hash: Hex; status: "success" | "reverted"; blockNumber: bigint }> {
  const hash = await chain.client.sendRawTransaction({
    serializedTransaction: signedTx,
  });
  const receipt = await chain.client.waitForTransactionReceipt({ hash });
  return {
    hash,
    status: receipt.status,
    blockNumber: receipt.blockNumber,
  };
}
