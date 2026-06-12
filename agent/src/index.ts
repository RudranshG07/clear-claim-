import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
import { formatEther, formatGwei, type Hex } from "viem";
import { loadConfig, type AgentConfig } from "./config.js";
import { createChain, type Chain } from "./chain.js";
import { decide } from "./decision.js";
import { buildUnsignedClaimTx, buildSignedClaimTx } from "./tx.js";
import { connectSpeculos } from "./signer/speculos.js";
import { getDepinReward } from "./depin.js";
import { buildEthSigner, signOnDevice } from "./signer/signTx.js";
import { buildTestCalContextModule } from "./signer/contextModule.js";
import { setupClearSigning } from "./signer/clearSign.js";
import { broadcast } from "./broadcast.js";

const moduleDir = dirname(fileURLToPath(import.meta.url));

// Origin token for the DMK default context module. Any non-empty value works
// against Ledger's dev CAL flow used by the cal-interceptor.
const ORIGIN_TOKEN = process.env.GATING_TOKEN ?? "clear-claim-agent";

/**
 * Load the ERC-7730 descriptor template and patch it with the configured chain
 * and deployed addresses, so the same descriptor works on any supported chain.
 */
function buildDescriptor(cfg: AgentConfig): object {
  const path = resolve(
    moduleDir,
    "../../descriptor/registry/clear-claim/calldata-DePINRewardDistributor.json",
  );
  const d = JSON.parse(readFileSync(path, "utf8"));
  d.context.contract.deployments = [
    { chainId: cfg.chainId, address: cfg.distributor },
  ];
  if (d.metadata?.constants) d.metadata.constants.rwrdToken = cfg.rewardToken;
  return d;
}

const log = (...a: unknown[]) => console.log(`[agent ${new Date().toISOString()}]`, ...a);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One observe -> decide -> (sign -> broadcast) cycle. Returns true if it claimed. */
async function tick(cfg: AgentConfig, chain: Chain, dryRun: boolean): Promise<boolean> {
  const [claimable, fees, depin] = await Promise.all([
    chain.claimable(cfg.operator),
    chain.fees(),
    getDepinReward(),
  ]);
  if (depin) {
    log(
      `live DePIN data (${depin.source}): ${depin.activeStations} active WeatherXM ` +
        `stations earned ${depin.rewards30d.toLocaleString()} WXM/30d ` +
        `→ ~${depin.perStationMonthly.toFixed(2)} WXM/station. ` +
        `The operator's reward is modeled on this real per-station rate.`,
    );
  }
  log(
    `claimable=${formatEther(claimable)} RWRD  maxFeePerGas=${formatGwei(fees.maxFeePerGas)} gwei`,
  );

  const decision = decide({
    claimable,
    maxFeePerGas: fees.maxFeePerGas,
    floor: cfg.floor,
    ceiling: cfg.ceiling,
  });

  if (!decision.claim) {
    log(`hold: ${decision.reason}`);
    return false;
  }

  log(`DECIDE claim ${formatEther(decision.amount)} RWRD to ${cfg.recipient} (${decision.reason})`);

  // Assemble the claim transaction (agent holds no key).
  const [nonce, gas] = await Promise.all([
    chain.nonce(cfg.operator),
    chain.estimateClaimGas(cfg.operator, decision.amount, cfg.recipient),
  ]);
  const data = chain.encodeClaim(decision.amount, cfg.recipient);
  const { tx, unsignedBytes } = buildUnsignedClaimTx({
    chainId: cfg.chainId,
    to: cfg.distributor,
    data,
    nonce,
    gas,
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
  });

  if (dryRun) {
    log("dry-run: assembled unsigned tx (not signing/broadcasting)");
    log(`  to=${tx.to} nonce=${nonce} gas=${gas} data=${data}`);
    return true;
  }

  // Make our ERC-7730 descriptor render as clear signing on the device.
  const clearSign = await setupClearSigning(buildDescriptor(cfg));
  if (clearSign && clearSign.count > 0) {
    log(`clear signing armed for ${clearSign.keys.join(", ")}`);
  } else {
    log("WARNING: clear-signing descriptor unavailable — device may blind-sign.");
  }

  // Hand the unsigned tx to the operator's device for clear-signed approval.
  log(`connecting to Speculos at ${cfg.speculosUrl} ...`);
  const conn = await connectSpeculos(cfg);
  try {
    const ctxModule = buildTestCalContextModule(ORIGIN_TOKEN);
    const signer = buildEthSigner(conn.dmk, conn.sessionId, ctxModule);

    log("waiting for operator to approve the readable claim on the device ...");
    const sig = await signOnDevice(signer, cfg.derivationPath, unsignedBytes, (step) =>
      log(`  device step: ${step}`),
    );
    log(`signed on device (v=${sig.v})`);

    const signedTx: Hex = buildSignedClaimTx(tx, sig);
    log("broadcasting signed tx ...");
    const receipt = await broadcast(chain, signedTx);
    log(`tx ${receipt.status}: ${receipt.hash} (block ${receipt.blockNumber})`);
    const explorer = cfg.chain.blockExplorers?.default?.url;
    if (explorer) log(`${explorer}/tx/${receipt.hash}`);
    return true;
  } finally {
    await conn.close();
    clearSign?.stop();
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const once = process.argv.includes("--once") || dryRun;
  const cfg = loadConfig();
  const chain = createChain(cfg);

  log(
    `Clear-Claim agent started (operator=${cfg.operator}, distributor=${cfg.distributor}, ` +
      `floor=${formatEther(cfg.floor)} RWRD, ceiling=${formatGwei(cfg.ceiling)} gwei)`,
  );
  if (dryRun) log("mode: DRY RUN (no device, no broadcast)");

  let running = true;
  process.on("SIGINT", () => {
    log("shutting down ...");
    running = false;
  });

  while (running) {
    try {
      const claimed = await tick(cfg, chain, dryRun);
      if (once) break;
      if (claimed) {
        // After a claim, keep watching (claimable resets to 0).
        await sleep(cfg.pollIntervalMs);
      } else {
        await sleep(cfg.pollIntervalMs);
      }
    } catch (err) {
      log("error:", err instanceof Error ? err.message : err);
      if (once) process.exitCode = 1;
      if (once) break;
      await sleep(cfg.pollIntervalMs);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
