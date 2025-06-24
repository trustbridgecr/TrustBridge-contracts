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

### 1.1 Install WASM

```bash
stellar contract install \
  --wasm target/wasm32-unknown-unknown/optimized/custom_oracle.wasm \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --source-account oracle-deployer
```

Output:

```
Installed WASM hash: b81e...
```

### 1.2 Create contract (call `init`)

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

### 1.3 Publish prices

```bash
stellar contract invoke \
  --id <CUSTOM_ORACLE_ID> \
  --fn set_price \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --source-account GASVL... \
  -- \
    prices='[1000000, 250000]' \
    timestamp=1720000000
```

---

## 🚀 2. Deploy `oracle_aggregator`

### 2.1 Install WASM

```bash
stellar contract install \
  --wasm target/wasm32-unknown-unknown/optimized/oracle_aggregator.wasm \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --source-account oracle-deployer
```

### 2.2 Create contract (call `init`)

```bash
stellar contract create \
  --wasm-hash <AGGREGATOR_WASM_HASH> \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --source-account oracle-deployer \
  -- \
    init \
    admin=GASVLW5YQFHEZJPNV2OQQ3P6CBD5Z5IW3XDAPEGSS6BMQZ35WZHCSKNB \
    base_asset='{{"Symbol":"USDC"}}' \
    decimals=6 \
    max_age=300
```

### 2.3 Register oracle

```bash
stellar contract invoke \
  --id <AGGREGATOR_CONTRACT_ID> \
  --fn add_oracle \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --source-account GASVL... \
  -- \
    oracle=<CUSTOM_ORACLE_ID>
```

### 2.4 Register asset

```bash
stellar contract invoke \
  --id <AGGREGATOR_CONTRACT_ID> \
  --fn add_asset \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --source-account GASVL... \
  -- \
    asset='{{"Symbol":"BLND"}}'
```

---

## 📈 Query price

```bash
stellar contract invoke \
  --id <AGGREGATOR_CONTRACT_ID> \
  --fn price \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  -- \
    asset='{{"Symbol":"BLND"}}' \
    timestamp=1720000000
```
