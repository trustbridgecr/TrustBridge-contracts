#!/bin/bash

# TrustBridge Oracle Smoke Test
# Quick validation of core oracle functionality

set -e

echo "💨 TrustBridge Oracle Smoke Test..."

# Load environment variables
if [ -f ".env" ]; then
    source .env
fi

# Configuration
NETWORK="testnet"
SOURCE_ACCOUNT=${SOURCE_ACCOUNT:-"alice"}
ORACLE_ID=${TRUSTBRIDGE_ORACLE_ID:-""}

# Check prerequisites
if [ -z "$ORACLE_ID" ]; then
    echo "❌ Error: ORACLE_ID not found"
    exit 1
fi

echo "🎯 Testing Oracle: $ORACLE_ID"
echo ""

# Test 1: Decimals
echo "1️⃣  Testing decimals()..."
DECIMALS=$(stellar contract invoke \
    --id $ORACLE_ID \
    --source $SOURCE_ACCOUNT \
    --network $NETWORK \
    -- \
    decimals)

if [ "$DECIMALS" = "7" ]; then
    echo "✅ Decimals: $DECIMALS"
else
    echo "❌ Decimals: $DECIMALS (expected 7)"
    exit 1
fi

# Test 2: Admin
echo "2️⃣  Testing admin()..."
ADMIN=$(stellar contract invoke \
    --id $ORACLE_ID \
    --source $SOURCE_ACCOUNT \
    --network $NETWORK \
    -- \
    admin)

if [ -n "$ADMIN" ]; then
    echo "✅ Admin: $ADMIN"
else
    echo "❌ Admin not set"
    exit 1
fi

# Test 3: Price check (USDC as example)
echo "3️⃣  Testing lastprice() with USDC..."
USDC_ADDRESS=${USDC_ADDRESS:-"CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCN3VM"}

PRICE_RESULT=$(stellar contract invoke \
    --id $ORACLE_ID \
    --source $SOURCE_ACCOUNT \
    --network $NETWORK \
    -- \
    lastprice \
    --asset "{\"Stellar\": \"$USDC_ADDRESS\"}")

if [[ "$PRICE_RESULT" == *"price"* ]]; then
    echo "✅ USDC price data: $PRICE_RESULT"
else
    echo "❌ USDC price not available: $PRICE_RESULT"
    exit 1
fi

echo ""
echo "🎉 Smoke test PASSED!"
echo "📋 Oracle Summary:"
echo "  📍 Contract ID: $ORACLE_ID"
echo "  🔢 Decimals: $DECIMALS"
echo "  👤 Admin: $ADMIN"
echo "  💰 Price Feed: Active"
echo "  🌐 Network: $NETWORK"
echo ""
echo "✅ Oracle is ready for Blend integration!" 