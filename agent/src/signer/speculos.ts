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

async function buildTransport(cfg: DeviceConfig): Promise<TransportFactory> {
  if (cfg.transport === "usb") {
    // node-hid is lazy-imported so Speculos users don't need the native build.
    const { nodeHidTransportFactory } = await import(
      "@ledgerhq/device-transport-kit-node-hid"
    );
    return nodeHidTransportFactory;
  }
  return speculosTransportFactory(cfg.speculosUrl, false, cfg.deviceModel);
}

// Connect to the device (Speculos by default, or a USB Ledger when transport="usb").
export async function connectSpeculos(
  cfg: DeviceConfig,
): Promise<DeviceConnection> {
  const dmk = new DeviceManagementKitBuilder()
    .addTransport(await buildTransport(cfg))
    .build();

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
