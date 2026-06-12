import {
  SignerEthBuilder,
  type SignerEth,
} from "@ledgerhq/device-signer-kit-ethereum";
import {
  DeviceActionStatus,
  type DeviceManagementKit,
  type DeviceSessionId,
} from "@ledgerhq/device-management-kit";
import type { ContextModule } from "@ledgerhq/context-module";
import type { Hex } from "viem";

export type DeviceSignature = { r: Hex; s: Hex; v: number };

export function buildEthSigner(
  dmk: DeviceManagementKit,
  sessionId: DeviceSessionId,
  contextModule: ContextModule,
): SignerEth {
  return new SignerEthBuilder({ dmk, sessionId })
    .withContextModule(contextModule)
    .build();
}

// Run the on-device signing flow and resolve with the signature. `onStep`
// surfaces the intermediate device-action states.
export function signOnDevice(
  signer: SignerEth,
  derivationPath: string,
  unsignedTx: Uint8Array,
  onStep?: (step: string) => void,
): Promise<DeviceSignature> {
  const { observable } = signer.signTransaction(derivationPath, unsignedTx);

  return new Promise<DeviceSignature>((resolve, reject) => {
    observable.subscribe({
      next: (state) => {
        if (state.status === DeviceActionStatus.Pending) {
          const step = (state.intermediateValue as { step?: unknown })?.step;
          if (step !== undefined && onStep) onStep(String(step));
        } else if (state.status === DeviceActionStatus.Completed) {
          const sig = state.output;
          resolve({ r: sig.r as Hex, s: sig.s as Hex, v: sig.v });
        } else if (state.status === DeviceActionStatus.Error) {
          reject(state.error);
        } else if (state.status === DeviceActionStatus.Stopped) {
          reject(new Error("Signing was cancelled on the device"));
        }
      },
      error: reject,
    });
  });
}
