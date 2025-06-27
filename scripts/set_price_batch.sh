#!/bin/bash

# TrustBridge Oracle Price Setting Script
# Sets initial prices for USDC, XLM, and TBRG assets

set -e

echo "💰 Setting initial prices for TrustBridge Oracle..."

# Load environment variables
if [ -f ".env" ]; then
    source .env
fi

# Configuration
NETWORK="testnet"
SOURCE_ACCOUNT=${SOURCE_ACCOUNT:-"alice"}
ORACLE_ID=${TRUSTBRIDGE_ORACLE_ID:-""}

# Asset addresses (these should be set to actual Stellar asset contract addresses)
USDC_ADDRESS=${USDC_ADDRESS:-"CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCN3VM"}
XLM_ADDRESS=${XLM_ADDRESS:-"CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA"}
TBRG_ADDRESS=${TBRG_ADDRESS:-"CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMCBGSLPVCOC4ZLBNG6"}

# Prices in 7-decimal format
USDC_PRICE=${USDC_PRICE:-"10000000"}    # $1.0000000 - USDC stable at $1
XLM_PRICE=${XLM_PRICE:-"1150000"}       # $0.1150000 - XLM price
TBRG_PRICE=${TBRG_PRICE:-"10000000"}    # $1.0000000 - TBRG initial price

# Check if required variables are set
if [ -z "$ORACLE_ID" ]; then
    echo "❌ Error: ORACLE_ID not found"
    echo "Please ensure the oracle has been deployed or set TRUSTBRIDGE_ORACLE_ID"
    exit 1
fi

echo "📋 Configuration:"
echo "  Oracle ID: $ORACLE_ID"
echo "  Network: $NETWORK"
echo "  Source Account: $SOURCE_ACCOUNT"
echo ""
echo "💵 Asset Prices (7 decimals):"
echo "  USDC: \$$(echo "scale=7; $USDC_PRICE / 10000000" | bc -l)"
echo "  XLM:  \$$(echo "scale=7; $XLM_PRICE / 10000000" | bc -l)"
echo "  TBRG: \$$(echo "scale=7; $TBRG_PRICE / 10000000" | bc -l)"
echo ""

# Function to set individual price
set_price() {
    local asset_address=$1
    local price=$2
    local asset_name=$3
    
    echo "💰 Setting $asset_name price to $price..."
    
    stellar contract invoke \
        --id $ORACLE_ID \
        --source $SOURCE_ACCOUNT \
        --network $NETWORK \
        -- \
        set_price \
        --asset "{\"Stellar\": \"$asset_address\"}" \
        --price $price
    
    echo "✅ $asset_name price set successfully"
}

# Set prices for each asset
echo "🚀 Starting price updates..."

set_price $USDC_ADDRESS $USDC_PRICE "USDC"
set_price $XLM_ADDRESS $XLM_PRICE "XLM"
set_price $TBRG_ADDRESS $TBRG_PRICE "TBRG"

echo ""
echo "🎉 All prices set successfully!"
echo ""

# Verify the prices were set correctly
echo "🔍 Verifying prices..."

verify_price() {
    local asset_address=$1
    local expected_price=$2
    local asset_name=$3
    
    echo "🔍 Verifying $asset_name price..."
    
    local result=$(stellar contract invoke \
        --id $ORACLE_ID \
        --source $SOURCE_ACCOUNT \
        --network $NETWORK \
        -- \
        lastprice \
        --asset "{\"Stellar\": \"$asset_address\"}")
    
    echo "📊 $asset_name result: $result"
}

verify_price $USDC_ADDRESS $USDC_PRICE "USDC"
verify_price $XLM_ADDRESS $XLM_PRICE "XLM"
verify_price $TBRG_ADDRESS $TBRG_PRICE "TBRG"

echo ""
echo "✅ Price verification completed!"
echo ""
echo "📝 Summary:"
echo "  ✅ USDC price: \$$(echo "scale=7; $USDC_PRICE / 10000000" | bc -l)"
echo "  ✅ XLM price:  \$$(echo "scale=7; $XLM_PRICE / 10000000" | bc -l)"
echo "  ✅ TBRG price: \$$(echo "scale=7; $TBRG_PRICE / 10000000" | bc -l)"
echo ""
echo "🔗 Oracle Contract: https://stellar.expert/explorer/testnet/contract/$ORACLE_ID" 