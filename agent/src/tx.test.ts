import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseGwei,
  parseEther,
  hexToBytes,
  serializeTransaction,
  keccak256,
  recoverTransactionAddress,
  encodeFunctionData,
} from "viem";
import { privateKeyToAccount, sign } from "viem/accounts";
import { sepolia } from "viem/chains";
import { buildUnsignedClaimTx, buildSignedClaimTx, toYParity } from "./tx.js";
import { distributorAbi } from "./abi.js";

const PK =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as const;
const account = privateKeyToAccount(PK);
const distributor = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" as const;

test("toYParity normalizes 0/1, 27/28, and EIP-155 v", () => {
  assert.equal(toYParity(0, 11155111), 0);
  assert.equal(toYParity(1, 11155111), 1);
  assert.equal(toYParity(27, 11155111), 0);
  assert.equal(toYParity(28, 11155111), 1);
  // EIP-155 legacy: v = yParity + 35 + 2*chainId
  assert.equal(toYParity(35 + 2 * 11155111, 11155111), 0);
  assert.equal(toYParity(36 + 2 * 11155111, 11155111), 1);
});

test("signed claim tx recovers to the signer (reassembly is correct)", async () => {
  const data = encodeFunctionData({
    abi: distributorAbi,
    functionName: "claim",
    args: [parseEther("142.5"), account.address],
  });
  const { tx, unsignedBytes } = buildUnsignedClaimTx({
    chainId: sepolia.id,
    to: distributor,
    data,
    nonce: 7,
    gas: 70000n,
    maxFeePerGas: parseGwei("20"),
    maxPriorityFeePerGas: parseGwei("1"),
  });

  // Simulate what the device does: sign the digest of the unsigned tx and
  // return r, s, v (27/28) — exactly the DMK signer's output shape.
  const digest = keccak256(unsignedBytes);
  const sig = await sign({ hash: digest, privateKey: PK });
  const v = Number(sig.v);
  const signed = buildSignedClaimTx(tx, { r: sig.r, s: sig.s, v });

  const sender = await recoverTransactionAddress({
    serializedTransaction: signed as `0x02${string}`,
  });
  assert.equal(sender.toLowerCase(), account.address.toLowerCase());
});

test("unsigned bytes match viem's canonical serialization", () => {
  const data = encodeFunctionData({
    abi: distributorAbi,
    functionName: "claim",
    args: [parseEther("1"), account.address],
  });
  const { tx, unsignedBytes } = buildUnsignedClaimTx({
    chainId: sepolia.id,
    to: distributor,
    data,
    nonce: 0,
    gas: 60000n,
    maxFeePerGas: parseGwei("10"),
    maxPriorityFeePerGas: parseGwei("1"),
  });
  assert.equal(tx.chainId, sepolia.id);
  assert.deepEqual(unsignedBytes, hexToBytes(serializeTransaction(tx)));
});
