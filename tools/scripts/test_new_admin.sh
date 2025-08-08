#!/bin/bash

# TrustBridge Oracle New Admin Test Script
# This script tests that the new admin can perform oracle functions

set -e

echo "🧪 Testing TrustBridge Oracle with new admin..."

# Configuration
NETWORK="testnet"
SOURCE_ACCOUNT=${SOURCE_ACCOUNT:-"safety-deployer"}  # Account that has access to new admin keypair
ORACLE_CONTRACT_ID="CBCIZHUC42CKOZHKKEYMSXVVY24ZK2EKEUU6NFGQS5YFG7GAMEU5L32M"
NEW_ADMIN="GASVLW5YQFHEZJPNV2OQQ3P6CBD5Z5IW3XDAPEGSS6BMQZ35WZHCSKNB"

echo "📋 Test Configuration:"
echo "  Network: $NETWORK"
echo "  Oracle Contract: $ORACLE_CONTRACT_ID"
echo "  New Admin: $NEW_ADMIN"
echo "  Source Account: $SOURCE_ACCOUNT"
echo ""

# Test 1: Verify admin address
echo "🔍 Test 1: Verifying current admin..."
CURRENT_ADMIN=$(stellar contract invoke \
    --id $ORACLE_CONTRACT_ID \
    --source $SOURCE_ACCOUNT \
    --rpc-url https://soroban-testnet.stellar.org:443 \
    --network-passphrase "Test SDF Network ; September 2015" \
    -- \
    admin)

echo "Current admin: $CURRENT_ADMIN"

if [[ "$CURRENT_ADMIN" == "\"$NEW_ADMIN\"" ]]; then
    echo "✅ Test 1 PASSED: Admin address is correct"
else
    echo "❌ Test 1 FAILED: Admin address doesn't match"
    echo "Expected: $NEW_ADMIN"
    echo "Actual: $CURRENT_ADMIN"
    exit 1
fi

echo ""

# Test 2: Test admin can set a price
echo "🔍 Test 2: Testing admin can set price..."

# Create test asset (USDC)
USDC_ADDRESS="CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA"

echo "Setting test price for USDC..."
stellar contract invoke \
    --id $ORACLE_CONTRACT_ID \
    --source $SOURCE_ACCOUNT \
    --rpc-url https://soroban-testnet.stellar.org:443 \
    --network-passphrase "Test SDF Network ; September 2015" \
    -- \
    set_price \
    --asset '{"tag":"Stellar","values":["'$USDC_ADDRESS'"]}' \
    --price 10000000

echo "✅ Test 2 PASSED: Admin can set prices"
echo ""

# Test 3: Verify price was set correctly
echo "🔍 Test 3: Verifying price was set..."
PRICE_DATA=$(stellar contract invoke \
    --id $ORACLE_CONTRACT_ID \
    --source $SOURCE_ACCOUNT \
    --rpc-url https://soroban-testnet.stellar.org:443 \
    --network-passphrase "Test SDF Network ; September 2015" \
    -- \
    lastprice \
    --asset '{"tag":"Stellar","values":["'$USDC_ADDRESS'"]}')

echo "Price data: $PRICE_DATA"

if [[ "$PRICE_DATA" != "null" ]]; then
    echo "✅ Test 3 PASSED: Price was set and can be retrieved"
else
    echo "❌ Test 3 FAILED: Price was not set properly"
    exit 1
fi

echo ""

# Test 4: Test decimals function
echo "🔍 Test 4: Testing decimals function..."
DECIMALS=$(stellar contract invoke \
    --id $ORACLE_CONTRACT_ID \
    --source $SOURCE_ACCOUNT \
    --rpc-url https://soroban-testnet.stellar.org:443 \
    --network-passphrase "Test SDF Network ; September 2015" \
    -- \
    decimals)

echo "Decimals: $DECIMALS"

if [[ "$DECIMALS" == "7" ]]; then
    echo "✅ Test 4 PASSED: Decimals function works correctly"
else
    echo "❌ Test 4 FAILED: Decimals function returned unexpected value"
    exit 1
fi

echo ""

# Test 5: Test batch price setting
echo "🔍 Test 5: Testing batch price setting..."

# Create test assets
XLM_ADDRESS="CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA"

echo "Setting batch prices..."
stellar contract invoke \
    --id $ORACLE_CONTRACT_ID \
    --source $SOURCE_ACCOUNT \
    --rpc-url https://soroban-testnet.stellar.org:443 \
    --network-passphrase "Test SDF Network ; September 2015" \
    -- \
    set_prices \
    --assets '[{"tag":"Stellar","values":["'$USDC_ADDRESS'"]},{"tag":"Stellar","values":["'$XLM_ADDRESS'"]}]' \
    --prices '[10000000,1150000]'

echo "✅ Test 5 PASSED: Batch price setting works"
echo ""

# Final summary
echo "🎉 All tests passed successfully!"
echo ""
echo "📋 Test Summary:"
echo "  ✅ Admin verification"
echo "  ✅ Single price setting"
echo "  ✅ Price retrieval"
echo "  ✅ Decimals function"
echo "  ✅ Batch price setting"
echo ""
echo "🔒 The new admin ($NEW_ADMIN) is fully functional!"
echo ""
echo "📝 Oracle is ready for production use with the new admin." 