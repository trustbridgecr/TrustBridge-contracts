# TrustBridge Contracts

This repository contains the oracle aggregator contract along with a simple custom oracle implementation.

---

## 🛠️ Building the Contracts

Ensure the `soroban` CLI is installed. The repository includes a `Makefile` that compiles both the root aggregator and the custom oracle located in `custom-oracle/`, producing optimized WASM binaries.

```bash
make build
```

The optimized binaries will be located at:

```
target/wasm32-unknown-unknown/optimized/
```

---

## 🚀 Deploying the Contracts

### 1. **Deploy the Custom Oracle**

1. Upload `custom_oracle.wasm` to the network.
2. Invoke the `init` function, providing:
   - Administrator address
   - List of assets
   - Number of decimals used for prices
   - Resolution in seconds
3. Use the `set_price` method to publish prices for configured assets at a specific timestamp.

### 2. **Deploy the Oracle Aggregator**

1. Upload `oracle_aggregator.wasm`.
2. Call `init` with:
   - Admin address
   - Base asset
   - Number of decimals
   - Maximum age (in seconds) for price history
3. Register the custom oracle address using `add_oracle`.
4. Register assets using `add_asset` or `add_base_asset` as needed.

After deployment, the aggregator can query the custom oracle using the `PriceFeed` interface.

---

## 📦 Deployment Command (Example)

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/optimized/custom_oracle.wasm \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --source-account oracle-deployer \
  -- \
  admin=GASVLW5YQFHEZJPNV2OQQ3P6CBD5Z5IW3XDAPEGSS6BMQZ35WZHCSKNB \
  assets='[{"Symbol":"USDC"},{"Symbol":"BLND"}]' \
  decimals=6 \
  resolution=60
```

---

## 📋 Contract Interface Info (Example)

```bash
stellar contract info interface \
  --id CD4C4P7HSJKDJ5G6VCLIXWCQJNA257NRXBT44CKQCRRIDENTFJ5UMHYO \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

---
