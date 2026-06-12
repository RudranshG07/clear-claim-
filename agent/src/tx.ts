import {
  serializeTransaction,
  hexToBytes,
  type Address,
  type Hex,
  type TransactionSerializableEIP1559,
} from "viem";

export type ClaimTxParams = {
  chainId: number;
  to: Address;
  data: Hex;
  nonce: number;
  gas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
};

// Returns the structured tx and the unsigned bytes the DMK signer consumes.
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

// Ledger may return v as 0/1, 27/28, or an EIP-155 value; normalize to yParity.
export function toYParity(v: number, chainId: number): number {
  if (v === 0 || v === 1) return v;
  if (v === 27 || v === 28) return v - 27;
  const legacy = v - 35 - 2 * chainId;
  if (legacy === 0 || legacy === 1) return legacy;
  return v % 2;
}

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
