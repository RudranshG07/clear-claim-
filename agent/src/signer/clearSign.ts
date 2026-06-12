import {
  CalInterceptor,
  ERC7730Client,
  addERC7730Descriptor,
} from "../vendor/cal-interceptor/index.js";

// Ledger's dev backend compiles an ERC-7730 descriptor and signs it with the
// test CAL key that Speculos/dev apps trust.
const TEST_BACKEND = "https://app.devicesdk.ledger-test.com";

export type ClearSignSession = {
  stop: () => void;
  count: number;
  keys: string[];
};

// Get a test-signed descriptor and intercept the DMK's CAL fetches so the
// device renders the readable claim. Returns null if the backend is unreachable
// (the agent then falls back to blind signing).
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
