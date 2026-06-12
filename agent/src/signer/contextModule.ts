import {
  ContextModuleBuilder,
  ContextModuleChainID,
  type ContextModule,
} from "@ledgerhq/context-module";

// Default context module with the CAL in test mode, so the device accepts the
// test-key-signed descriptor served by the cal-interceptor.
export function buildTestCalContextModule(originToken: string): ContextModule {
  return new ContextModuleBuilder({ originToken })
    .setChain(ContextModuleChainID.Ethereum)
    .setCalConfig({
      url: "https://crypto-assets-service.api.ledger.com/v1",
      mode: "test",
      branch: "main",
    })
    .build();
}
