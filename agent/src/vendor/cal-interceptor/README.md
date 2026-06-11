# Vendored: @ledgerhq/cal-interceptor

Vendored from LedgerHQ/device-sdk-ts (`packages/tools/cal-interceptor`, develop
branch) because the package is not published to npm. Zero dependencies.

It lets a local ERC-7730 descriptor render as clear signing on a **Speculos**
(or dev) Ledger without the contract being in Ledger's production Crypto Asset
List:

1. `ERC7730Client.processDescriptor()` POSTs the ERC-7730 JSON to Ledger's dev
   backend (`https://app.devicesdk.ledger-test.com/api/process-erc7730-descriptor`),
   which compiles it into the device descriptor and signs it with the **test**
   CAL key the dev/Speculos app trusts.
2. `CalInterceptor` patches global `fetch` and serves that descriptor (and the
   test certificates) whenever the DMK's default context module queries the CAL.

This is Ledger's own clear-signing test mechanism (the `clear-signing-tester`
app's `--erc7730-files` flow). It works on Speculos/dev builds only — production
devices still require a CAL-signed descriptor (the registry route).
