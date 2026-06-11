import {
  DeviceManagementKitBuilder,
  type DeviceManagementKit,
  type DeviceSessionId,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { speculosTransportFactory } from "@ledgerhq/device-transport-kit-speculos";
import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import { firstValueFrom } from "rxjs";

/** Only the fields needed to reach the device. */
type DeviceConfig = { speculosUrl: string; deviceModel: DeviceModelId };

export type DeviceConnection = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  close: () => Promise<void>;
};

/**
 * Build the DMK against the Speculos transport, discover the emulated device,
 * and open a session. This is the in-process equivalent of plugging in a
 * Ledger — no CLI, no hardware.
 */
export async function connectSpeculos(
  cfg: DeviceConfig,
): Promise<DeviceConnection> {
  const dmk = new DeviceManagementKitBuilder()
    .addTransport(
      speculosTransportFactory(cfg.speculosUrl, false, cfg.deviceModel),
    )
    .build();

  // Discover the (single) Speculos device and connect.
  if (process.env.DMK_DEBUG) console.error("[dmk] discovering...");
  const device: DiscoveredDevice = await firstValueFrom(dmk.startDiscovering({}));
  if (process.env.DMK_DEBUG) console.error(`[dmk] discovered ${device.id} (${device.deviceModel?.model}); connecting...`);
  const sessionId = await dmk.connect({ device });
  if (process.env.DMK_DEBUG) console.error(`[dmk] connected, session ${sessionId}`);

  return {
    dmk,
    sessionId,
    close: async () => {
      try {
        await dmk.disconnect({ sessionId });
      } finally {
        dmk.close();
      }
    },
  };
}
