// Resolve the descriptor's placeholder addresses with the real deployed ones,
// then compile it into the agent's local clear-sign context artifact.
//
// Usage:
//   DISTRIBUTOR_ADDRESS=0x... REWARD_TOKEN_ADDRESS=0x... node apply-addresses.mjs
//
// Outputs:
//   calldata-depinrewarddistributor.resolved.json   (registry-shaped, real addresses)
//   compiled/11155111-<distributor>.json            (ClearSignContext[] for the agent)
//
// NOTE on the compiled artifact: the Ledger device renders clear-signing from
// COMPILED, PKI-SIGNED descriptor payloads, which are produced and signed by
// Ledger's Crypto Asset List (CAL). This script writes the *resolved* ERC-7730
// JSON (ready to submit to the registry / CAL) and a placeholder compiled file
// so the agent's custom context module has a path to load. Replace the compiled
// file with the CAL-signed payloads to get full on-device clear signing; until
// then the agent logs a blind-sign warning. See README "Clear-signing trust".
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const DIST_PLACEHOLDER = "0x1111111111111111111111111111111111111111";
const RWRD_PLACEHOLDER = "0x2222222222222222222222222222222222222222";

const distributor = req("DISTRIBUTOR_ADDRESS");
const rewardToken = req("REWARD_TOKEN_ADDRESS");

function req(name) {
  const v = process.env[name];
  if (!v || !/^0x[a-fA-F0-9]{40}$/.test(v)) {
    console.error(`Missing/invalid ${name} (need a 0x 20-byte address)`);
    process.exit(1);
  }
  return v;
}

const templatePath = resolve(here, "calldata-depinrewarddistributor.json");
let json = readFileSync(templatePath, "utf8");
json = json
  .split(DIST_PLACEHOLDER)
  .join(distributor)
  .split(RWRD_PLACEHOLDER)
  .join(rewardToken);

const resolvedPath = resolve(here, "calldata-depinrewarddistributor.resolved.json");
writeFileSync(resolvedPath, json);
console.log(`wrote ${resolvedPath}`);

// Placeholder compiled artifact (empty contexts -> agent falls back to blind
// sign with a loud warning until CAL-signed payloads are dropped in here).
const compiledDir = resolve(here, "compiled");
mkdirSync(compiledDir, { recursive: true });
const compiledPath = resolve(
  compiledDir,
  `11155111-${distributor.toLowerCase()}.json`,
);
writeFileSync(compiledPath, JSON.stringify([], null, 2));
console.log(`wrote ${compiledPath} (empty — drop CAL-signed payloads here)`);
