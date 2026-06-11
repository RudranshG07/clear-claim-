import "dotenv/config";
import { z } from "zod";
import { getAddress, parseEther, parseGwei, type Address } from "viem";
import { DeviceModelId } from "@ledgerhq/device-management-kit";

const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "must be a 0x-prefixed 20-byte address")
  .transform((v) => getAddress(v) as Address);

const deviceModelSchema = z
  .enum(["nanoS", "nanoSP", "nanoX", "stax", "flex"])
  .default("flex")
  .transform((v) => v as DeviceModelId);

/**
 * Agent configuration. The agent is *keyless*: nothing here is a private key.
 * The operator's signing key lives on the Ledger / Speculos device. The only
 * secret-ish value is the RPC URL.
 */
const schema = z.object({
  // Chain access
  SEPOLIA_RPC_URL: z.string().url(),

  // Deployed contracts (from the Foundry deploy)
  DISTRIBUTOR_ADDRESS: addressSchema,
  REWARD_TOKEN_ADDRESS: addressSchema,

  // The operator: address derived at DERIVATION_PATH on the Speculos seed.
  // This is who has claimable rewards and who approves on-device.
  OPERATOR_ADDRESS: addressSchema,

  // Where claimed rewards are sent. Defaults to the operator itself.
  CLAIM_RECIPIENT: addressSchema.optional(),

  // Decision thresholds — the "intelligence" layer.
  // Only propose a claim when claimable >= FLOOR and gas <= CEILING.
  FLOOR_RWRD: z.coerce.number().positive().default(100), // min reward worth claiming
  CEILING_GWEI: z.coerce.number().positive().default(50), // max maxFeePerGas to tolerate

  // Signing device
  SPECULOS_URL: z.string().url().default("http://localhost:5000"),
  DERIVATION_PATH: z.string().default("44'/60'/0'/0/0"),
  DEVICE_MODEL: deviceModelSchema,

  // Loop
  POLL_INTERVAL_MS: z.coerce.number().int().positive().default(15_000),
});

function load() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid agent configuration. Fix your .env:\n${issues}\n\n` +
        `See agent/.env.example.`,
    );
  }
  const env = parsed.data;
  return {
    rpcUrl: env.SEPOLIA_RPC_URL,
    distributor: env.DISTRIBUTOR_ADDRESS,
    rewardToken: env.REWARD_TOKEN_ADDRESS,
    operator: env.OPERATOR_ADDRESS,
    recipient: env.CLAIM_RECIPIENT ?? env.OPERATOR_ADDRESS,
    floor: parseEther(env.FLOOR_RWRD.toString()),
    ceiling: parseGwei(env.CEILING_GWEI.toString()),
    speculosUrl: env.SPECULOS_URL,
    derivationPath: env.DERIVATION_PATH,
    deviceModel: env.DEVICE_MODEL,
    pollIntervalMs: env.POLL_INTERVAL_MS,
  } as const;
}

export type AgentConfig = ReturnType<typeof load>;
export { load as loadConfig };
