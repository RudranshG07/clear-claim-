import "dotenv/config";
import { z } from "zod";
import { getAddress, parseEther, parseGwei, type Address, type Chain } from "viem";
import { sepolia, polygonAmoy, arbitrumSepolia } from "viem/chains";
import { DeviceModelId } from "@ledgerhq/device-management-kit";

const CHAINS: Record<number, Chain> = {
  [sepolia.id]: sepolia,
  [polygonAmoy.id]: polygonAmoy,
  [arbitrumSepolia.id]: arbitrumSepolia,
};

const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "must be a 0x-prefixed 20-byte address")
  .transform((v) => getAddress(v) as Address);

const deviceModelSchema = z
  .enum(["nanoS", "nanoSP", "nanoX", "stax", "flex"])
  .default("flex")
  .transform((v) => v as DeviceModelId);

const schema = z.object({
  CHAIN_ID: z.coerce.number().int().default(sepolia.id),
  RPC_URL: z.string().url().optional(),
  SEPOLIA_RPC_URL: z.string().url().optional(),

  DISTRIBUTOR_ADDRESS: addressSchema,
  REWARD_TOKEN_ADDRESS: addressSchema,
  OPERATOR_ADDRESS: addressSchema,
  CLAIM_RECIPIENT: addressSchema.optional(),

  FLOOR_RWRD: z.coerce.number().positive().default(100),
  CEILING_GWEI: z.coerce.number().positive().default(50),

  TRANSPORT: z.enum(["speculos", "usb"]).default("speculos"),
  SPECULOS_URL: z.string().url().default("http://localhost:5000"),
  DERIVATION_PATH: z.string().default("44'/60'/0'/0/0"),
  DEVICE_MODEL: deviceModelSchema,

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
  const chain = CHAINS[env.CHAIN_ID];
  if (!chain) {
    throw new Error(
      `Unsupported CHAIN_ID ${env.CHAIN_ID}. Supported: ${Object.keys(CHAINS).join(", ")}`,
    );
  }
  const rpcUrl = env.RPC_URL ?? env.SEPOLIA_RPC_URL;
  if (!rpcUrl) {
    throw new Error("Set RPC_URL (or SEPOLIA_RPC_URL) in your .env");
  }
  return {
    chain,
    chainId: env.CHAIN_ID,
    rpcUrl,
    distributor: env.DISTRIBUTOR_ADDRESS,
    rewardToken: env.REWARD_TOKEN_ADDRESS,
    operator: env.OPERATOR_ADDRESS,
    recipient: env.CLAIM_RECIPIENT ?? env.OPERATOR_ADDRESS,
    floor: parseEther(env.FLOOR_RWRD.toString()),
    ceiling: parseGwei(env.CEILING_GWEI.toString()),
    transport: env.TRANSPORT,
    speculosUrl: env.SPECULOS_URL,
    derivationPath: env.DERIVATION_PATH,
    deviceModel: env.DEVICE_MODEL,
    pollIntervalMs: env.POLL_INTERVAL_MS,
  } as const;
}

export type AgentConfig = ReturnType<typeof load>;
export { load as loadConfig };
