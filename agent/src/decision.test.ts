import { test } from "node:test";
import assert from "node:assert/strict";
import { parseEther, parseGwei } from "viem";
import { decide } from "./decision.js";

const floor = parseEther("100");
const ceiling = parseGwei("50");

test("claims full balance when above floor and gas below ceiling", () => {
  const d = decide({
    claimable: parseEther("142.5"),
    maxFeePerGas: parseGwei("20"),
    floor,
    ceiling,
  });
  assert.equal(d.claim, true);
  if (d.claim) assert.equal(d.amount, parseEther("142.5"));
});

test("does not claim when nothing is claimable", () => {
  const d = decide({ claimable: 0n, maxFeePerGas: parseGwei("1"), floor, ceiling });
  assert.equal(d.claim, false);
});

test("does not claim below the floor", () => {
  const d = decide({
    claimable: parseEther("99.9"),
    maxFeePerGas: parseGwei("1"),
    floor,
    ceiling,
  });
  assert.equal(d.claim, false);
});

test("does not claim when gas exceeds the ceiling", () => {
  const d = decide({
    claimable: parseEther("1000"),
    maxFeePerGas: parseGwei("80"),
    floor,
    ceiling,
  });
  assert.equal(d.claim, false);
});

test("claims exactly at the floor and ceiling boundaries", () => {
  const d = decide({
    claimable: floor,
    maxFeePerGas: ceiling,
    floor,
    ceiling,
  });
  assert.equal(d.claim, true);
});
