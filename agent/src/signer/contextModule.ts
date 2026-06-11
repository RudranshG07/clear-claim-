import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import {
  ContextModuleBuilder,
  type ContextModule,
  type ContextLoader,
  type ClearSignContext,
  type ClearSignContextType,
} from "@ledgerhq/context-module";
import type { AgentConfig } from "../config.js";

/**
 * Input the DMK Ethereum signer passes to calldata context loaders.
 * (Mirror of CalldataContextInput from @ledgerhq/context-module — redeclared
 * locally to keep a narrow surface.)
 */
type CalldataInput = {
  to: string;
  data: string;
  selector: string;
  chainId: number;
  deviceModelId: string;
};

function isCalldataInput(x: unknown): x is CalldataInput {
  return (
    typeof x === "object" &&
    x !== null &&
    "to" in x &&
    "data" in x &&
    "selector" in x &&
    "chainId" in x
  );
}

/**
 * A custom ContextLoader that serves OUR ERC-7730 descriptor for OUR
 * DePINRewardDistributor, instead of fetching from Ledger's Crypto Asset List.
 *
 * The Ledger device renders clear-signing from *compiled, PKI-signed* descriptor
 * payloads (TLV), not raw ERC-7730 JSON. Ledger's CAL produces those from the
 * JSON and signs them with Ledger's PKI so the device trusts them. We load that
 * compiled artifact from disk:
 *
 *   descriptor/compiled/<chainId>-<address>.json
 *     -> ClearSignContextSuccess[]  ({ type, payload, certificate? })
 *
 * If the compiled artifact is absent (e.g. it hasn't been produced/signed yet),
 * we return no contexts: the signer then falls back to blind signing, and we log
 * loudly. This is the documented trust-gate boundary — see README.
 */
class LocalDescriptorLoader implements ContextLoader {
  constructor(
    private readonly cfg: AgentConfig,
    private readonly compiledPath: string,
    private readonly onMiss: () => void,
  ) {}

  canHandle(input: unknown, _expected: ClearSignContextType[]): input is CalldataInput {
    return (
      isCalldataInput(input) &&
      input.to.toLowerCase() === this.cfg.distributor.toLowerCase() &&
      input.chainId === 11155111
    );
  }

  async load(_input: unknown): Promise<ClearSignContext[]> {
    if (!existsSync(this.compiledPath)) {
      this.onMiss();
      return [];
    }
    const raw = await readFile(this.compiledPath, "utf8");
    const contexts = JSON.parse(raw) as ClearSignContext[];
    return contexts;
  }
}

/**
 * Build a ContextModule wired to our local descriptor only. Default loaders are
 * removed so the agent makes no network calls to Ledger's CAL and signing is
 * deterministic for the demo.
 */
export function buildContextModule(
  cfg: AgentConfig,
  compiledDescriptorPath: string,
  onDescriptorMiss: () => void,
): ContextModule {
  return new ContextModuleBuilder({ originToken: undefined })
    .removeDefaultLoaders()
    .addLoader(new LocalDescriptorLoader(cfg, compiledDescriptorPath, onDescriptorMiss))
    .build();
}
