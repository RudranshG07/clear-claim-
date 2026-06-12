import "dotenv/config";
import { z } from "zod";
import { DeviceModelId } from "@ledgerhq/device-management-kit";

// Device-only config for `whoami` (runs before deployment).
const schema = z.object({
  TRANSPORT: z.enum(["speculos", "usb"]).default("speculos"),
  SPECULOS_URL: z.string().url().default("http://localhost:5000"),
  DERIVATION_PATH: z.string().default("44'/60'/0'/0/0"),
  DEVICE_MODEL: z
    .enum(["nanoS", "nanoSP", "nanoX", "stax", "flex"])
    .default("flex"),
});

export function loadConfigForWhoami() {
  const env = schema.parse(process.env);
  return {
    transport: env.TRANSPORT,
    speculosUrl: env.SPECULOS_URL,
    derivationPath: env.DERIVATION_PATH,
    deviceModel: env.DEVICE_MODEL as DeviceModelId,
  } as const;
}
