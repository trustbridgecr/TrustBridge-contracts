# TrustBridge Contracts

This repository contains the oracle aggregator contract along with a simple custom oracle implementation.

## Building the contracts

Ensure the `soroban` CLI is installed. The repository ships with a `Makefile` that compiles the aggregator in the root crate and the custom oracle found under `custom-oracle/`, producing optimized WASM files for each contract.

```bash
make build
```

The optimized binaries will be located in `target/wasm32-unknown-unknown/optimized/`.

## Deploying the contracts

1. **Deploy the custom oracle**

   1. Upload `custom_oracle.wasm` to the network.
   2. Invoke `init` supplying the administrator address, a list of assets, the decimals used for prices and the resolution in seconds.
   3. Use `set_price` to publish prices for all configured assets at a specific timestamp.

2. **Deploy the oracle aggregator**
   1. Upload `oracle_aggregator.wasm`.
   2. Call `init` with an admin address, the base asset, the number of decimals and the maximum age (in seconds) for price history.
   3. Register the custom oracle address using `add_oracle`.
   4. Register assets with `add_asset` or `add_base_asset` as needed.

After deployment the aggregator can query the custom oracle using the `PriceFeed` interface.
