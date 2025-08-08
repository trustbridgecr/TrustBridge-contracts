# TrustBridge Deployment Guide

This guide will help you deploy all TrustBridge contracts using the automated script `tools/deploy-all.sh`.

## Prerequisites

### 1. Required Tools

- **Rust** (versión 1.89.0 o superior)
- **Stellar CLI** (versión compatible)
- **wasm32-unknown-unknown target**

```bash
# Install WASM target
rustup target add wasm32-unknown-unknown

# Verify installation
rustc --version
stellar --version
```

### 2. Environment Variables Configuration

```bash
# Copy example file
cp .env.example .env

# Edit with your values
# Minimum required: ADMIN_ADDRESS
nano .env
```

### 3. Account Configuration

Before deploying, you need to configure a Stellar account:

```bash
# Generate new identity
stellar keys generate alice

# Or use an existing one
stellar keys address alice

# Fund account on testnet
stellar keys fund alice --network testnet

# Verify funds
stellar keys address alice  # Copy the address to use as ADMIN_ADDRESS
```

## Using the Deployment Script

### Basic Command

```bash
ADMIN_ADDRESS="YOUR_ADDRESS_HERE" ./tools/deploy-all.sh
```

### Complete Example

```bash
# Make script executable
chmod +x tools/deploy-all.sh

# Deploy with specific address
ADMIN_ADDRESS="GBZXN7PIRZGNMHGA7MUUUF4GWJQ5UW5FWVD2URXVPE4YKBXXKBJQT3J5" ./tools/deploy-all.sh
```

### Optional Environment Variables

```bash
# Customize configuration
NETWORK="testnet" \
SOURCE_ACCOUNT="alice" \
ADMIN_ADDRESS="GBZXN7PIRZGNMHGA7MUUUF4GWJQ5UW5FWVD2URXVPE4YKBXXKBJQT3J5" \
ORACLE_ADMIN="GBZXN7PIRZGNMHGA7MUUUF4GWJQ5UW5FWVD2URXVPE4YKBXXKBJQT3J5" \
./tools/deploy-all.sh
```

## Deployment Process

The `deploy-all.sh` script automatically executes:

### 1. Compilation in Dependency Order

```bash
🔨 Building contracts in dependency order...
🔨 Building oracle...        # No dependencies
🔨 Building pool-factory...  # No dependencies  
🔨 Building backstop...      # Depends on pool-factory WASM
🔨 Building pool...          # Depends on backstop WASM
```

### 2. Sequential Deployment

1. **Oracle Contract**
   - Deploy the Oracle contract
   - Initialize with admin address
   
2. **Pool Factory Contract**
   - Deploy the Pool Factory contract
   
3. **Backstop Contract**
   - Deploy the Backstop contract
   
4. **Pool Creation**
   - Use the Pool Factory to create a pool
   - Configure with Oracle and Backstop

### 3. Information Storage

Two files are automatically created:

- **`deployment.json`** - Detailed information
- **`deployment.env`** - Environment variables

## Generated Files

### deployment.json
```json
{
  "network": "testnet",
  "admin": "GBZXN7PIRZGNMHGA7MUUUF4GWJQ5UW5FWVD2URXVPE4YKBXXKBJQT3J5",
  "oracle_admin": "GBZXN7PIRZGNMHGA7MUUUF4GWJQ5UW5FWVD2URXVPE4YKBXXKBJQT3J5",
  "contracts": {
    "oracle": "CCR6QKTWZQYW6YUJ7UP7XXZRLWQPFRV6SWBLQS4ZQOSAF4BOUD77OTE2",
    "pool_factory": "CDLZFC3SHJYDEH7GIWEX4XTY52YHQHQKD5GFSAQ5FDKR2R4XFQXC2QXJ",
    "backstop": "CBQHN5LLKXVHFHXS4BKG2SDTYQGSZM7XN2EUKX75BTT42JVJF2H4VDMK",
    "pool": "CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGEXE"
  },
  "deployed_at": "2024-08-08T10:30:45Z"
}
```

### deployment.env
```bash
# TrustBridge Deployment Addresses
# Generated on Thu Aug 8 10:30:45 2024

export TRUSTBRIDGE_ORACLE_ID="CCR6QKTWZQYW6YUJ7UP7XXZRLWQPFRV6SWBLQS4ZQOSAF4BOUD77OTE2"
export TRUSTBRIDGE_POOL_FACTORY_ID="CDLZFC3SHJYDEH7GIWEX4XTY52YHQHQKD5GFSAQ5FDKR2R4XFQXC2QXJ"
export TRUSTBRIDGE_BACKSTOP_ID="CBQHN5LLKXVHFHXS4BKG2SDTYQGSZM7XN2EUKX75BTT42JVJF2H4VDMK"
export TRUSTBRIDGE_POOL_ID="CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGEXE"
export TRUSTBRIDGE_NETWORK="testnet"
export TRUSTBRIDGE_ADMIN="GBZXN7PIRZGNMHGA7MUUUF4GWJQ5UW5FWVD2URXVPE4YKBXXKBJQT3J5"
```

## Using Deployed Contracts

### Load Environment Variables

```bash
# Load contract addresses
source deployment.env

# Verify variables
echo $TRUSTBRIDGE_ORACLE_ID
echo $TRUSTBRIDGE_POOL_ID
```

### Interact with Contracts

#### Oracle Contract
```bash
# Set price
stellar contract invoke \
  --id $TRUSTBRIDGE_ORACLE_ID \
  --source alice \
  --network testnet \
  -- \
  set_price \
  --asset '{"Stellar":"CDLZFC3SHJYDEH7GIWEX4XTY52YHQHQKD5GFSAQ5FDKR2R4XFQXC2QXJ"}' \
  --price 10000000

# Get price  
stellar contract invoke \
  --id $TRUSTBRIDGE_ORACLE_ID \
  --source alice \
  --network testnet \
  -- \
  lastprice \
  --asset '{"Stellar":"CDLZFC3SHJYDEH7GIWEX4XTY52YHQHQKD5GFSAQ5FDKR2R4XFQXC2QXJ"}'
```

#### Pool Contract
```bash
# Submit request to pool
stellar contract invoke \
  --id $TRUSTBRIDGE_POOL_ID \
  --source alice \
  --network testnet \
  -- \
  submit \
  --from alice \
  --spender alice \
  --to alice \
  --requests '[...]'
```

## Troubleshooting

### Common Errors

#### "XDR value invalid"
```bash
# Problem: Version incompatibility
# Solution: Verify compatibility between CLI and SDK

stellar --version  # Must be compatible with the soroban-sdk used
```

#### "Account not found"
```bash
# Problem: Account without funds
# Solution: Fund account

stellar keys fund alice --network testnet
```

#### "Contract not found"
```bash
# Problem: Dependencies not compiled correctly
# Solution: Clean and recompile

rm -rf target */target
./tools/deploy-all.sh
```

### Logs and Debug

To get more debug information:

```bash
# Run with verbose logs
RUST_LOG=debug ADMIN_ADDRESS="..." ./tools/deploy-all.sh

# Check network status
stellar network ls

# Check specific account
stellar keys address alice
```

## Available Networks

### Testnet (Recommended for testing)
```bash
NETWORK="testnet" ./tools/deploy-all.sh
```

### Futurenet (For experimental features)
```bash  
NETWORK="futurenet" ./tools/deploy-all.sh
```

### Mainnet (Production only)
```bash
NETWORK="mainnet" ./tools/deploy-all.sh
```

## Post-Deployment

### 1. Verify Contracts

Visit Stellar Explorer to verify the contracts:

- Oracle: `https://stellar.expert/explorer/testnet/contract/{ORACLE_ID}`
- Pool Factory: `https://stellar.expert/explorer/testnet/contract/{POOL_FACTORY_ID}`
- Backstop: `https://stellar.expert/explorer/testnet/contract/{BACKSTOP_ID}`
- Pool: `https://stellar.expert/explorer/testnet/contract/{POOL_ID}`

### 2. Initial Configuration

1. **Configure prices in Oracle**
2. **Set reserves in Pool** 
3. **Test basic functionality**

### 3. Next Steps

- Configure reserves in the pool
- Set initial prices in the oracle
- Test the deployment

## Security

⚠️ **Important security considerations:**

- **Never share your private key**
- **Use dedicated addresses for admin**
- **Verify all transactions before signing**
- **Securely store deployment.json and deployment.env**
- **Use testnet before mainnet**

## Support

If you encounter problems:

1. Review the [Troubleshooting](#troubleshooting) section
2. Verify the prerequisites configuration
3. Check the deployment logs
4. Create an issue in the repository