#!/bin/bash

# TrustBridge Oracle Deployment Script
# This script builds, deploys, and initializes the TrustBridge Oracle on Soroban Testnet

set -e

echo "🚀 Starting TrustBridge Oracle deployment..."

# Configuration
NETWORK="testnet"
SOURCE_ACCOUNT=${SOURCE_ACCOUNT:-"alice"}  # Default to alice, can be overridden
ADMIN_ADDRESS=${ADMIN_ADDRESS:-""}

# Check if required environment variables are set
if [ -z "$ADMIN_ADDRESS" ]; then
    echo "❌ Error: ADMIN_ADDRESS environment variable is required"
    echo "Please set ADMIN_ADDRESS to the public key that will administrate the oracle"
    exit 1
fi

echo "📋 Configuration:"
echo "  Network: $NETWORK"
echo "  Source Account: $SOURCE_ACCOUNT"
echo "  Admin Address: $ADMIN_ADDRESS"
echo ""

# Step 1: Check if contract WASM file exists
echo "🔍 Checking for existing TrustBridge Oracle WASM file..."

if [ ! -f "oracle/target/wasm32-unknown-unknown/release/trustbridge_oracle.wasm" ]; then
    echo "❌ WASM file not found at oracle/target/wasm32-unknown-unknown/release/trustbridge_oracle.wasm"
    echo "Please build the contract first using: cargo build --target wasm32-unknown-unknown --release"
    exit 1
fi

echo "✅ Contract WASM file found and ready for deployment"

# Step 2: Deploy the contract
echo "🚀 Deploying contract to $NETWORK..."
ORACLE_ID=$(stellar contract deploy \
    --wasm oracle/target/wasm32-unknown-unknown/release/trustbridge_oracle.wasm \
    --source $SOURCE_ACCOUNT \
    --network $NETWORK)

if [ -z "$ORACLE_ID" ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo "✅ Contract deployed successfully!"
echo "📍 Oracle Contract ID: $ORACLE_ID"

# Step 3: Initialize the contract
echo "🔧 Initializing oracle with admin: $ADMIN_ADDRESS"
stellar contract invoke \
    --id $ORACLE_ID \
    --source $SOURCE_ACCOUNT \
    --network $NETWORK \
    -- \
    init \
    --admin $ADMIN_ADDRESS

echo "✅ Oracle initialized successfully!"

# Step 4: Store contract ID for later use
echo "💾 Storing contract ID..."
mkdir -p .stellar/contract-ids/
echo "{\"ids\":[\"$ORACLE_ID\"],\"network\":\"$NETWORK\"}" > .stellar/contract-ids/trustbridge_oracle.json

echo ""
echo "🎉 TrustBridge Oracle deployment completed successfully!"
echo ""
echo "📋 Summary:"
echo "  Oracle Contract ID: $ORACLE_ID"
echo "  Admin Address: $ADMIN_ADDRESS"
echo "  Network: $NETWORK"
echo "  Status: Initialized and ready to receive price updates"
echo ""
echo "🔗 View on Stellar Explorer:"
echo "  https://stellar.expert/explorer/testnet/contract/$ORACLE_ID"
echo ""
echo "📝 Next Steps:"
echo "  1. Set initial prices using set_price_batch.sh"
echo "  2. Verify prices using verify_oracle.sh"
echo "  3. Test oracle functionality"
echo ""

# Export for use in other scripts
export TRUSTBRIDGE_ORACLE_ID=$ORACLE_ID
echo "TRUSTBRIDGE_ORACLE_ID=$ORACLE_ID" >> .env 