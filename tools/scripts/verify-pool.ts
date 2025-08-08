#!/usr/bin/env npx ts-node

/**
 * TrustBridge-MicroLoans Pool Verification Script
 * 
 * This script verifies the complete configuration of a deployed
 * TrustBridge-MicroLoans pool including reserves and emissions.
 * 
 * @author TrustBridge Team
 * @version 1.0.0
 */

import { 
  Pool,
} from '@blend-capital/blend-sdk';
import { Networks } from '@stellar/stellar-sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration constants
const CONFIG = {
  NETWORK: process.env.STELLAR_NETWORK || 'testnet',
  RPC_URL: process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
  
  // Pool Configuration
  POOL_ID: process.env.POOL_ID || 'POOL_ID_HERE',
  
  // Expected Configuration
  EXPECTED_ORACLE_ID: process.env.ORACLE_ID || 'CBCIZHUC42CKOZHKKEYMSXVVY24ZK2EKEUU6NFGQS5YFG7GAMEU5L32M',
  EXPECTED_BACKSTOP_RATE: 15,
  EXPECTED_MAX_POSITIONS: 4,
  EXPECTED_MIN_COLLATERAL: 1.0,
  
  // Expected Asset Addresses
  USDC_ADDRESS: process.env.USDC_ADDRESS || 'USDC_CONTRACT_ADDRESS_HERE',
  XLM_ADDRESS: process.env.XLM_ADDRESS || 'XLM_CONTRACT_ADDRESS_HERE',
  TBRG_ADDRESS: process.env.TBRG_ADDRESS || 'TBRG_CONTRACT_ADDRESS_HERE',
};

// Network configuration
const NETWORK_PASSPHRASE = CONFIG.NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

/**
 * Expected reserve configurations for verification
 */
const EXPECTED_RESERVES = {
  [CONFIG.USDC_ADDRESS]: {
    name: 'USDC',
    index: 0,
    decimals: 7,
    c_factor: 0.90, // 90%
    l_factor: 0.95, // 95%
    util: 0.80, // 80%
    max_util: 0.90, // 90%
    enabled: true
  },
  [CONFIG.XLM_ADDRESS]: {
    name: 'XLM',
    index: 1,
    decimals: 7,
    c_factor: 0.75, // 75%
    l_factor: 0.85, // 85%
    util: 0.70, // 70%
    max_util: 0.85, // 85%
    enabled: true
  },
  [CONFIG.TBRG_ADDRESS]: {
    name: 'TBRG',
    index: 2,
    decimals: 7,
    c_factor: 0.60, // 60%
    l_factor: 0.70, // 70%
    util: 0.60, // 60%
    max_util: 0.80, // 80%
    enabled: true
  }
};

/**
 * Verifies the complete pool configuration
 */
async function verifyPool(): Promise<void> {
  console.log('\n🔍 TrustBridge-MicroLoans Pool Verification');
  console.log('============================================');
  console.log(`📡 Network: ${CONFIG.NETWORK}`);
  console.log(`🏦 Pool ID: ${CONFIG.POOL_ID}`);

  try {
    // Load pool data from the ledger
    const network = NETWORK_PASSPHRASE === Networks.TESTNET ? 
      { rpc: CONFIG.RPC_URL, passphrase: Networks.TESTNET } :
      { rpc: CONFIG.RPC_URL, passphrase: Networks.PUBLIC };
    
    console.log('📡 Loading pool data from network...');
    const pool = await Pool.load(network, CONFIG.POOL_ID);

    console.log('✅ Pool loaded successfully!');
    console.log('\n📊 Pool Configuration Verification:');
    console.log('======================================');
    
    // Verify Oracle
    const oracleAddress = pool.config.oracle.toString();
    const oracleMatch = oracleAddress === CONFIG.EXPECTED_ORACLE_ID;
    console.log(`🔮 Oracle: ${oracleAddress}`);
    console.log(`   Expected: ${CONFIG.EXPECTED_ORACLE_ID}`);
    console.log(`   Status: ${oracleMatch ? '✅ MATCH' : '❌ MISMATCH'}`);

    // Verify Backstop Rate
    const backstopRate = Math.floor(pool.config.backstopRate * 100); // Convert from decimal to percentage
    const backstopMatch = backstopRate === CONFIG.EXPECTED_BACKSTOP_RATE;
    console.log(`📈 Backstop Rate: ${backstopRate}%`);
    console.log(`   Expected: ${CONFIG.EXPECTED_BACKSTOP_RATE}%`);
    console.log(`   Status: ${backstopMatch ? '✅ MATCH' : '❌ MISMATCH'}`);

    // Verify Max Positions
    const maxPositions = pool.config.maxPositions;
    const positionsMatch = maxPositions === CONFIG.EXPECTED_MAX_POSITIONS;
    console.log(`👥 Max Positions: ${maxPositions}`);
    console.log(`   Expected: ${CONFIG.EXPECTED_MAX_POSITIONS}`);
    console.log(`   Status: ${positionsMatch ? '✅ MATCH' : '❌ MISMATCH'}`);

    // Verify Min Collateral
    const minCollateral = ((pool.config as { minCollateral?: number }).minCollateral ?? 1.0) / 10000000;
    const minCollateralMatch = Math.abs(minCollateral - CONFIG.EXPECTED_MIN_COLLATERAL) < 0.01;
    console.log(`💰 Min Collateral: ${minCollateral}`);
    console.log(`   Expected: ${CONFIG.EXPECTED_MIN_COLLATERAL}`);
    console.log(`   Status: ${minCollateralMatch ? '✅ MATCH' : '❌ MISMATCH'}`);

    // Verify Reserves
    console.log('\n💰 Reserve Configuration Verification:');
    console.log('======================================');
    
    let reserveMatches = 0;
    let totalReserveChecks = 0;

    for (const [address, expectedConfig] of Object.entries(EXPECTED_RESERVES)) {
      console.log(`\n🔍 Verifying ${expectedConfig.name} Reserve:`);
      
      // Check if reserve exists in pool
      const reserve = pool.reserves.get(address);
      if (!reserve) {
        console.log(`   ❌ Reserve not found in pool`);
        continue;
      }

      totalReserveChecks++;

      // Verify reserve configuration
      const configChecks = [
        {
          name: 'Decimals',
          actual: reserve.config.decimals,
          expected: expectedConfig.decimals,
          match: reserve.config.decimals === expectedConfig.decimals
        },
        {
          name: 'Collateral Factor',
          actual: `${Math.floor(reserve.config.c_factor * 100)}%`,
          expected: `${Math.floor(expectedConfig.c_factor * 100)}%`,
          match: Math.abs(reserve.config.c_factor - expectedConfig.c_factor) < 0.01
        },
                  {
            name: 'Liability Factor',
            actual: `${Math.floor(reserve.config.l_factor * 100)}%`,
            expected: `${Math.floor(expectedConfig.l_factor * 100)}%`,
            match: Math.abs(reserve.config.l_factor - expectedConfig.l_factor) < 0.01
          },
        {
          name: 'Target Utilization',
          actual: `${Math.floor(reserve.config.util / 10000000 * 100)}%`,
          expected: `${Math.floor(expectedConfig.util * 100)}%`,
          match: Math.abs(reserve.config.util / 10000000 - expectedConfig.util) < 0.01
        },
                  {
            name: 'Max Utilization',
            actual: `${Math.floor(reserve.config.max_util * 100)}%`,
            expected: `${Math.floor(expectedConfig.max_util * 100)}%`,
            match: Math.abs(reserve.config.max_util - expectedConfig.max_util) < 0.01
          }
      ];

      let reserveConfigMatches = 0;
      configChecks.forEach(check => {
        console.log(`   ${check.name}: ${check.actual}`);
        console.log(`     Expected: ${check.expected}`);
        console.log(`     Status: ${check.match ? '✅ MATCH' : '❌ MISMATCH'}`);
        if (check.match) reserveConfigMatches++;
      });

      if (reserveConfigMatches === configChecks.length) {
        reserveMatches++;
        console.log(`   ✅ ${expectedConfig.name} reserve fully configured`);
      } else {
        console.log(`   ⚠️  ${expectedConfig.name} reserve has ${configChecks.length - reserveConfigMatches} mismatches`);
      }
    }

    // Verify Emissions (if configured)
    console.log('\n🎯 Emission Configuration Verification:');
    console.log('======================================');
    
    let emissionMatches = 0;

    for (const [address, expectedConfig] of Object.entries(EXPECTED_RESERVES)) {
      const reserve = pool.reserves.get(address);
      if (!reserve) continue;

      console.log(`\n📊 ${expectedConfig.name} Emissions:`);
      
      // Check supply emissions (res_type = 1)
      // Note: emissions configuration may not be available in current SDK version
      const emissionsConfig: unknown = (reserve as unknown as Record<string, unknown>).emissionsConfig;
      if (Array.isArray(emissionsConfig)) {
        const supplyEmissions = emissionsConfig.find((e: unknown) => typeof e === 'object' && e !== null && 'reserveType' in e && (e as { reserveType?: number }).reserveType === 1);
        if (supplyEmissions) {
          emissionMatches++;
          const share = supplyEmissions.share / 10000000 * 100; // Convert to percentage
          console.log(`   Supply Emissions: ${share.toFixed(1)}%`);
          console.log(`   Status: ✅ CONFIGURED`);
        } else {
          console.log(`   Supply Emissions: Not configured`);
          console.log(`   Status: ⚠️  NO EMISSIONS`);
        }
      }
    }

    // Overall verification result
    const allBasicMatch = oracleMatch && backstopMatch && positionsMatch && minCollateralMatch;
    const allReservesMatch = reserveMatches === totalReserveChecks && totalReserveChecks === 3;
    const allEmissionsConfigured = emissionMatches >= 3; // At least 3 reserves should have emissions

    console.log('\n🎯 Verification Summary:');
    console.log('======================================');
    console.log(`Oracle Configuration: ${oracleMatch ? '✅' : '❌'}`);
    console.log(`Backstop Rate: ${backstopMatch ? '✅' : '❌'}`);
    console.log(`Max Positions: ${positionsMatch ? '✅' : '❌'}`);
    console.log(`Min Collateral: ${minCollateralMatch ? '✅' : '❌'}`);
    console.log(`Reserve Configuration: ${allReservesMatch ? '✅' : '❌'} (${reserveMatches}/${totalReserveChecks})`);
    console.log(`Emission Configuration: ${allEmissionsConfigured ? '✅' : '⚠️'} (${emissionMatches} configured)`);

    const overallStatus = allBasicMatch && allReservesMatch;
    console.log(`Overall Status: ${overallStatus ? '✅ PASSED' : '❌ FAILED'}`);

    if (overallStatus) {
      console.log('\n🎉 Pool verification completed successfully!');
      console.log('🚀 TrustBridge-MicroLoans pool is properly configured!');
      console.log('');
      console.log('📋 Pool is ready for:');
      console.log('   • Backstop funding');
      console.log('   • Status activation');
      console.log('   • Production use');
    } else {
      console.log('\n⚠️  Pool verification failed. Please review the configuration.');
      console.log('💡 Check the mismatches above and reconfigure as needed.');
    }

    // Additional pool information
    console.log('\n📊 Additional Pool Information:');
    console.log('======================================');
    console.log(`Pool Name: ${pool.config.name || 'Not set'}`);
    console.log(`Admin: ${pool.config.admin}`);
    console.log(`Status: ${pool.config.status}`);
    console.log(`Total Reserves: ${pool.reserves.size}`);
    
    if (pool.reserves.size > 0) {
      console.log('📝 Reserve List:');
      let index = 0;
      for (const [address] of pool.reserves) {
        const expectedName = EXPECTED_RESERVES[address]?.name || 'Unknown';
        console.log(`   ${index}. ${expectedName}: ${address}`);
        index++;
      }
    }

  } catch (error) {
    console.error('❌ Pool verification failed:', error);
    console.error('💡 This may indicate the pool was not deployed or configured correctly');
    
    if (error instanceof Error && error.message.includes('not found')) {
      console.error('🔍 Please check:');
      console.error('   • Pool ID is correct');
      console.error('   • Network configuration is correct');
      console.error('   • Pool was successfully deployed');
    }
  }
}

// Export function for use in other scripts
export { verifyPool };

// Run if called directly
if (require.main === module) {
  verifyPool();
} 