#!/bin/bash

# TrustBridge Complete Deployment Script
# This script deploys all contracts in the correct order

set -e

echo "🚀 Starting TrustBridge complete deployment..."

# Configuration
NETWORK=${NETWORK:-"testnet"}
SOURCE_ACCOUNT=${SOURCE_ACCOUNT:-"alice"}
ADMIN_ADDRESS=${ADMIN_ADDRESS}
ORACLE_ADMIN=${ORACLE_ADMIN:-$ADMIN_ADDRESS}

# Check required variables
if [ -z "$ADMIN_ADDRESS" ]; then
    echo "❌ Error: ADMIN_ADDRESS environment variable is required"
    echo "Usage: ADMIN_ADDRESS=<your-address> ./deploy-all.sh"
    exit 1
fi

echo "📋 Configuration:"
echo "  Network: $NETWORK"
echo "  Source Account: $SOURCE_ACCOUNT"
echo "  Admin Address: $ADMIN_ADDRESS"
echo "  Oracle Admin: $ORACLE_ADMIN"
echo ""

# Function to build individual contracts
build_contract() {
    local contract_name=$1
    echo "🔨 Building $contract_name..."
    
    cd "$contract_name"
    
    # Build the contract (dependencies should already be fixed)
    cargo build --target wasm32-unknown-unknown --release
    
    cd ..
    echo "✅ $contract_name built successfully"
}

# Step 1: Build contracts in dependency order
echo "🔨 Building contracts in dependency order..."

# First build oracle and pool-factory (no dependencies)
build_contract "contracts/oracle"
build_contract "contracts/pool-factory"

# Create target directory for backstop dependencies if it doesn't exist
mkdir -p target/wasm32-unknown-unknown/release

# Copy pool-factory WASM to global target for backstop dependency
cp contracts/pool-factory/target/wasm32-unknown-unknown/release/pool_factory.wasm target/wasm32-unknown-unknown/release/

# Now build backstop (depends on pool-factory WASM)
build_contract "contracts/backstop"

# Copy backstop WASM to global target for pool dependency
cp contracts/backstop/target/wasm32-unknown-unknown/release/backstop.wasm target/wasm32-unknown-unknown/release/

# Build pool last (depends on backstop WASM)
build_contract "contracts/pool"

echo "✅ All contracts built successfully"
echo ""

# Step 2: Deploy Oracle
echo "📍 Step 1: Deploying Oracle..."
ORACLE_ID=$(stellar contract deploy \
    --wasm contracts/oracle/target/wasm32-unknown-unknown/release/trustbridge_oracle.wasm \
    --source $SOURCE_ACCOUNT \
    --network $NETWORK)

if [ -z "$ORACLE_ID" ]; then
    echo "❌ Oracle deployment failed"
    exit 1
fi

echo "✅ Oracle deployed: $ORACLE_ID"

# Initialize Oracle
echo "🔧 Initializing Oracle..."
stellar contract invoke \
    --id $ORACLE_ID \
    --source $SOURCE_ACCOUNT \
    --network $NETWORK \
    -- \
    init \
    --admin $ORACLE_ADMIN

echo "✅ Oracle initialized"

# Step 3: Deploy Pool Factory
echo "📍 Step 2: Deploying Pool Factory..."
POOL_FACTORY_ID=$(stellar contract deploy \
    --wasm contracts/pool-factory/target/wasm32-unknown-unknown/release/pool_factory.wasm \
    --source $SOURCE_ACCOUNT \
    --network $NETWORK)

if [ -z "$POOL_FACTORY_ID" ]; then
    echo "❌ Pool Factory deployment failed"
    exit 1
fi

echo "✅ Pool Factory deployed: $POOL_FACTORY_ID"

# Step 4: Deploy Backstop
echo "📍 Step 3: Deploying Backstop..."
BACKSTOP_ID=$(stellar contract deploy \
    --wasm contracts/backstop/target/wasm32-unknown-unknown/release/backstop.wasm \
    --source $SOURCE_ACCOUNT \
    --network $NETWORK)

if [ -z "$BACKSTOP_ID" ]; then
    echo "❌ Backstop deployment failed"
    exit 1
fi

echo "✅ Backstop deployed: $BACKSTOP_ID"

# Step 5: Create Pool via Pool Factory
echo "📍 Step 4: Creating TrustBridge Pool..."

# Generate a random salt for pool deployment
SALT=$(openssl rand -hex 16)

# Create pool through factory
POOL_RESULT=$(stellar contract invoke \
    --id $POOL_FACTORY_ID \
    --source $SOURCE_ACCOUNT \
    --network $NETWORK \
    -- \
    deploy \
    --admin $ADMIN_ADDRESS \
    --name "TrustBridge-Pool" \
    --salt "0x$SALT" \
    --oracle $ORACLE_ID \
    --backstop_take_rate 1500000 \
    --max_positions 4)

# Extract pool ID from result (this is a simplified extraction)
POOL_ID=$(echo "$POOL_RESULT" | grep -o 'C[A-Z0-9]\{55\}' | head -1)

if [ -z "$POOL_ID" ]; then
    echo "❌ Pool creation failed or could not extract pool ID"
    echo "Pool factory result: $POOL_RESULT"
    exit 1
fi

echo "✅ Pool created: $POOL_ID"

# Step 6: Save deployment info
echo "💾 Saving deployment information..."
cat > deployment.json << EOF
{
  "network": "$NETWORK",
  "admin": "$ADMIN_ADDRESS",
  "oracle_admin": "$ORACLE_ADMIN",
  "contracts": {
    "oracle": "$ORACLE_ID",
    "pool_factory": "$POOL_FACTORY_ID", 
    "backstop": "$BACKSTOP_ID",
    "pool": "$POOL_ID"
  },
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# Create .env file for easy sourcing
cat > deployment.env << EOF
# TrustBridge Deployment Addresses
# Generated on $(date)

export TRUSTBRIDGE_ORACLE_ID="$ORACLE_ID"
export TRUSTBRIDGE_POOL_FACTORY_ID="$POOL_FACTORY_ID" 
export TRUSTBRIDGE_BACKSTOP_ID="$BACKSTOP_ID"
export TRUSTBRIDGE_POOL_ID="$POOL_ID"
export TRUSTBRIDGE_NETWORK="$NETWORK"
export TRUSTBRIDGE_ADMIN="$ADMIN_ADDRESS"
EOF

echo "✅ Deployment info saved to deployment.json and deployment.env"
echo ""

# Final summary
echo "🎉 TrustBridge deployment completed successfully!"
echo "=================================================="
echo ""
echo "📋 Contract Addresses:"
echo "   Oracle:       $ORACLE_ID"
echo "   Pool Factory: $POOL_FACTORY_ID"  
echo "   Backstop:     $BACKSTOP_ID"
echo "   Pool:         $POOL_ID"
echo ""
echo "🌐 Network: $NETWORK"
echo "👤 Admin: $ADMIN_ADDRESS"
echo ""
echo "📂 Files created:"
echo "   - deployment.json (detailed info)"
echo "   - deployment.env (environment variables)"
echo ""
echo "🔗 View contracts on Stellar Explorer:"
echo "   Oracle: https://stellar.expert/explorer/$NETWORK/contract/$ORACLE_ID"
echo "   Pool Factory: https://stellar.expert/explorer/$NETWORK/contract/$POOL_FACTORY_ID"
echo "   Backstop: https://stellar.expert/explorer/$NETWORK/contract/$BACKSTOP_ID" 
echo "   Pool: https://stellar.expert/explorer/$NETWORK/contract/$POOL_ID"
echo ""
echo "✨ To use these addresses in other scripts:"
echo "   source deployment.env"
echo ""
echo "🎯 Next steps:"
echo "   1. Configure reserves in the pool"
echo "   2. Set initial prices in the oracle"  
echo "   3. Test the deployment"