import {
  CalInterceptor,
  ERC7730Client,
  addERC7730Descriptor,
} from "../vendor/cal-interceptor/index.js";

/**
 * Ledger's dev clear-signing backend: compiles an ERC-7730 descriptor into the
 * on-device descriptor and signs it with the TEST CAL key that Speculos/dev
 * apps trust. (Same mechanism as Ledger's own clear-signing-tester.)
 */
const TEST_BACKEND = "https://app.devicesdk.ledger-test.com";

export type ClearSignSession = {
  stop: () => void;
  count: number;
  keys: string[];
};

/**
 * Make our local ERC-7730 descriptor render as clear signing on the device:
 * POST it to Ledger's dev backend for a test-signed descriptor, then intercept
 * the DMK's CAL `fetch` calls and serve it. The DMK *default* context module
 * then renders "Claim … RWRD to 0x…" instead of a hash.
 *
 * Returns null (non-fatal) if the descriptor is missing or the backend is
 * unreachable — the agent then blind-signs with a warning.
 */
export async function setupClearSigning(
  descriptor: object,
): Promise<ClearSignSession | null> {
  try {
    const interceptor = new CalInterceptor();
    const client = new ERC7730Client({ baseUrl: TEST_BACKEND });
    const res = await addERC7730Descriptor({
      descriptor,
      interceptor,
      client,
      autoStart: true,
    });
    return { stop: () => interceptor.stop(), count: res.count, keys: res.keys };
  } catch {
    return null;
  }
}
