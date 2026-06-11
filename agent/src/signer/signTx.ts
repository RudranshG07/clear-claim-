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

/**
 * Run the on-device sign-transaction flow and await the signature.
 *
 * The operator approves the claim on the Speculos screen. With the local
 * descriptor present, the device shows a readable "Claim 142.5 RWRD to 0x..."
 * instead of a raw hash. Intermediate device-action states are surfaced via
 * `onStep` so the caller can narrate the flow.
 */
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
