// Validate the ERC-7730 descriptor against the official schema (offline copy).
// Usage: node validate.mjs [descriptor.json]
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const here = dirname(fileURLToPath(import.meta.url));
const descriptorPath = resolve(
  here,
  process.argv[2] ?? "registry/clear-claim/calldata-DePINRewardDistributor.json",
);
const schemaPath = resolve(here, "schema/erc7730-v2.schema.json");

const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
const data = JSON.parse(readFileSync(descriptorPath, "utf8"));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addFormat("eip55", true);
ajv.addFormat("eip155", true);

const validate = ajv.compile(schema);
const ok = validate(data);

if (ok) {
  console.log(`✔ ${descriptorPath}\n  valid against ERC-7730 v2 schema`);
  process.exit(0);
} else {
  console.error(`✗ ${descriptorPath} is INVALID:`);
  for (const e of validate.errors ?? []) {
    console.error(`  - ${e.instancePath || "(root)"} ${e.message}`);
  }
  process.exit(1);
}
