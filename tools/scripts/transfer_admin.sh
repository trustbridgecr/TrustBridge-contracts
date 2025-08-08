#!/bin/bash

# TrustBridge Oracle Admin Transfer Script
# This script safely transfers admin rights to the new TrustBridge admin address

set -e

echo "🔐 Starting TrustBridge Oracle admin transfer..."

# Configuration
NETWORK="testnet"
SOURCE_ACCOUNT=${SOURCE_ACCOUNT:-"safety-deployer"}  # Current admin account for signing
ORACLE_CONTRACT_ID="CBCIZHUC42CKOZHKKEYMSXVVY24ZK2EKEUU6NFGQS5YFG7GAMEU5L32M"
CURRENT_ADMIN="GDDSKY4FZCTT4Q3NIHEMNLIYXXC5PWE7QGBNS7NCRJJLQJWR3AQGV3FW"
NEW_ADMIN="GASVLW5YQFHEZJPNV2OQQ3P6CBD5Z5IW3XDAPEGSS6BMQZ35WZHCSKNB"

echo "📋 Transfer Configuration:"
echo "  Network: $NETWORK"
echo "  Oracle Contract: $ORACLE_CONTRACT_ID"
echo "  Current Admin: $CURRENT_ADMIN"
echo "  New Admin: $NEW_ADMIN"
echo "  Source Account: $SOURCE_ACCOUNT"
echo ""

# Step 1: Verify current admin
echo "🔍 Verifying current admin..."
CURRENT_ADMIN_CHECK=$(stellar contract invoke \
    --id $ORACLE_CONTRACT_ID \
    --source $SOURCE_ACCOUNT \
    --rpc-url https://soroban-testnet.stellar.org:443 \
    --network-passphrase "Test SDF Network ; September 2015" \
    -- \
    admin)

echo "✅ Current admin verified: $CURRENT_ADMIN_CHECK"

if [[ "$CURRENT_ADMIN_CHECK" != "\"$CURRENT_ADMIN\"" ]]; then
    echo "❌ Error: Current admin doesn't match expected value"
    echo "Expected: $CURRENT_ADMIN"
    echo "Actual: $CURRENT_ADMIN_CHECK"
    exit 1
fi

# Step 2: Ask for confirmation
echo ""
echo "⚠️  ADMIN TRANSFER CONFIRMATION"
echo "This will transfer admin rights from:"
echo "  FROM: $CURRENT_ADMIN"
echo "  TO:   $NEW_ADMIN"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " confirm

if [[ $confirm != "yes" ]]; then
    echo "❌ Admin transfer cancelled"
    exit 1
fi

# Step 3: Transfer admin rights
echo ""
echo "🔄 Transferring admin rights..."
stellar contract invoke \
    --id $ORACLE_CONTRACT_ID \
    --source $SOURCE_ACCOUNT \
    --rpc-url https://soroban-testnet.stellar.org:443 \
    --network-passphrase "Test SDF Network ; September 2015" \
    -- \
    set_admin \
    --new_admin $NEW_ADMIN

echo "✅ Admin transfer transaction submitted!"

# Step 4: Verify the transfer
echo ""
echo "🔍 Verifying admin transfer..."
sleep 2  # Wait for transaction to be processed

NEW_ADMIN_CHECK=$(stellar contract invoke \
    --id $ORACLE_CONTRACT_ID \
    --source $SOURCE_ACCOUNT \
    --rpc-url https://soroban-testnet.stellar.org:443 \
    --network-passphrase "Test SDF Network ; September 2015" \
    -- \
    admin)

echo "New admin address: $NEW_ADMIN_CHECK"

if [[ "$NEW_ADMIN_CHECK" == "\"$NEW_ADMIN\"" ]]; then
    echo "✅ Admin transfer successful!"
    echo ""
    echo "🎉 TrustBridge Oracle admin transfer completed!"
    echo ""
    echo "📋 Summary:"
    echo "  Oracle Contract: $ORACLE_CONTRACT_ID"
    echo "  New Admin: $NEW_ADMIN"
    echo "  Status: Transfer successful"
    echo ""
    echo "📝 Next Steps:"
    echo "  1. Test oracle functions with new admin"
    echo "  2. Update documentation with new admin"
    echo "  3. Inform team of admin change"
else
    echo "❌ Error: Admin transfer failed or not yet processed"
    echo "Expected: $NEW_ADMIN"
    echo "Actual: $NEW_ADMIN_CHECK"
    exit 1
fi 