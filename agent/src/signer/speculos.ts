import {
  DeviceManagementKitBuilder,
  type DeviceManagementKit,
  type DeviceSessionId,
  type DiscoveredDevice,
  type TransportFactory,
} from "@ledgerhq/device-management-kit";
import { speculosTransportFactory } from "@ledgerhq/device-transport-kit-speculos";
import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import { firstValueFrom } from "rxjs";

/** Only the fields needed to reach the device. */
type DeviceConfig = {
  speculosUrl: string;
  deviceModel: DeviceModelId;
  transport?: "speculos" | "usb";
};

export type DeviceConnection = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  close: () => Promise<void>;
};

/** Pick the transport: Speculos emulator (default) or a real USB Ledger. */
async function buildTransport(cfg: DeviceConfig): Promise<TransportFactory> {
  if (cfg.transport === "usb") {
    // Real hardware Ledger over USB. Lazy-imported so Speculos users don't need
    // the native node-hid build.
    const { nodeHidTransportFactory } = await import(
      "@ledgerhq/device-transport-kit-node-hid"
    );
    return nodeHidTransportFactory;
  }
  return speculosTransportFactory(cfg.speculosUrl, false, cfg.deviceModel);
}

/**
 * Build the DMK against the configured transport, discover the device, and open
 * a session. Speculos (emulator) by default; set transport="usb" to use a real
 * plugged-in Ledger. Either way the agent stays keyless — the key never leaves
 * the device.
 */
export async function connectSpeculos(
  cfg: DeviceConfig,
): Promise<DeviceConnection> {
  const dmk = new DeviceManagementKitBuilder()
    .addTransport(await buildTransport(cfg))
    .build();

  // Discover the device and connect.
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
