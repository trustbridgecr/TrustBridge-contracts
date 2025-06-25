# TrustBridge Contracts — Deploy & Usage Guide

This guide explains how to build, deploy, and use the `custom_oracle` and `oracle_aggregator` contracts on the Soroban testnet using the `stellar` CLI.

---

## 🛠️ Prerequisites

- Rust toolchain (`rustup`)
- Soroban-compatible `stellar` CLI (v20.0.0-rc3 or higher):
  ```bash
  cargo install --locked stellar-cli --features opt
  ```

---

## 🏗️ Building the contracts

```bash
make build
```

Output:

- `target/wasm32-unknown-unknown/optimized/custom_oracle.wasm`
- `target/wasm32-unknown-unknown/optimized/oracle_aggregator.wasm`

---

## 🚀 1. Deploy `custom_oracle`

Output:

```
Installed WASM hash: b81e...
```

### 1.1 Create contract (call `init`)

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

### 1.2 Contract info

```bash
stellar contract info interface \
  --id CDLR6TLYLADGOZFDMWEWOY5NLKIDQ2Y3K62OXX47ZWQARLVRYLFS2CNW \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

### 1.3 Consultar la resolución

```bash
stellar contract invoke \
  --id CDLR6TLYLADGOZFDMWEWOY5NLKIDQ2Y3K62OXX47ZWQARLVRYLFS2CNW \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --source-account oracle-deployer \
  -- resolution
```
