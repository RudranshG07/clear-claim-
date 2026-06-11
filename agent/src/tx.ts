import {
  serializeTransaction,
  hexToBytes,
  type Address,
  type Hex,
  type TransactionSerializableEIP1559,
} from "viem";

export type ClaimTxParams = {
  chainId: number; // target EVM chain
  to: Address; // distributor contract
  data: Hex; // encoded claim(amount,to)
  nonce: number;
  gas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
};

/**
 * Build the unsigned EIP-1559 transaction the operator will sign on-device.
 * Returns both the structured tx (needed to re-serialize with the signature)
 * and the raw unsigned bytes the DMK signer consumes.
 */
export function buildUnsignedClaimTx(p: ClaimTxParams): {
  tx: TransactionSerializableEIP1559;
  unsignedBytes: Uint8Array;
} {
  const tx: TransactionSerializableEIP1559 = {
    type: "eip1559",
    chainId: p.chainId,
    to: p.to,
    data: p.data,
    value: 0n,
    nonce: p.nonce,
    gas: p.gas,
    maxFeePerGas: p.maxFeePerGas,
    maxPriorityFeePerGas: p.maxPriorityFeePerGas,
  };
  const unsigned = serializeTransaction(tx);
  return { tx, unsignedBytes: hexToBytes(unsigned) };
}

/**
 * Normalize the device's `v` into an EIP-1559 yParity (0/1).
 * Ledger apps may return 0/1 directly, or 27/28, or a legacy EIP-155 v.
 */
export function toYParity(v: number, chainId: number): number {
  if (v === 0 || v === 1) return v;
  if (v === 27 || v === 28) return v - 27;
  // EIP-155 legacy: v = yParity + 35 + 2*chainId
  const legacy = v - 35 - 2 * chainId;
  if (legacy === 0 || legacy === 1) return legacy;
  // Fallback to parity of v.
  return v % 2;
}

/** Re-serialize the tx with the device signature into a broadcastable raw tx. */
export function buildSignedClaimTx(
  tx: TransactionSerializableEIP1559,
  sig: { r: Hex; s: Hex; v: number },
): Hex {
  const yParity = toYParity(sig.v, tx.chainId);
  return serializeTransaction(tx, {
    r: sig.r,
    s: sig.s,
    yParity,
  });
}
