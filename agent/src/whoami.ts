// Print the operator address the device derives at DERIVATION_PATH.
import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import { loadConfigForWhoami } from "./config.whoami.js";
import { connectSpeculos } from "./signer/speculos.js";

async function main() {
  const cfg = loadConfigForWhoami();
  const conn = await connectSpeculos(cfg);
  try {
    const signer = new SignerEthBuilder({
      dmk: conn.dmk,
      sessionId: conn.sessionId,
    }).build();

    const { observable } = signer.getAddress(cfg.derivationPath, {
      checkOnDevice: false,
    });

    const address = await new Promise<string>((resolve, reject) => {
      observable.subscribe({
        next: (state) => {
          if (state.status === DeviceActionStatus.Completed) {
            resolve(state.output.address);
          } else if (state.status === DeviceActionStatus.Error) {
            reject(state.error);
          }
        },
        error: reject,
      });
    });

    console.log(`Operator address (${cfg.derivationPath}): ${address}`);
  } finally {
    await conn.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
