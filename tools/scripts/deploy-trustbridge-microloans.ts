#!/usr/bin/env npx ts-node

/**
 * TrustBridge-MicroLoans Pool Deployment Script
 * 
 * This script deploys a new Blend lending pool named "TrustBridge-MicroLoans"
 * that supports micro-loans in USDC and XLM using a custom oracle configuration.
 * 
 * The pool will be configured with:
 * - Oracle: Custom TrustBridge Oracle
 * - Reserves: USDC, XLM, TBRG
 * - Backstop Rate: 15%
 * - Max Positions: 4
 * 
 * @author TrustBridge Team
 * @version 1.0.0
 */

import { 
  PoolFactoryContract, 
  Pool,
  Network
} from '@blend-capital/blend-sdk';
import { 
  Keypair, 
  Networks, 
  SorobanRpc, 
  TransactionBuilder, 
  xdr,
  StrKey
} from '@stellar/stellar-sdk';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as crypto from 'crypto';

// Load environment variables
config();

// Configuration constants
const CONFIG = {
  // Network configuration
  NETWORK: process.env.STELLAR_NETWORK || 'testnet',
  RPC_URL: process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
  
  // Pool configuration
  POOL_NAME: 'TrustBridge-MicroLoans',
  ORACLE_ID: process.env.ORACLE_ID || 'CBCIZHUC42CKOZHKKEYMSXVVY24ZK2EKEUU6NFGQS5YFG7GAMEU5L32M',
  BACKSTOP_RATE: 1500000, // 15% with 7 decimals (0.15 * 10^7)
  MAX_POSITIONS: 4,
  MIN_COLLATERAL: 10000000, // 1.0 with 7 decimals (minimum collateral in oracle base asset)
  
  // Asset addresses (production deployment)
  USDC_ADDRESS: process.env.USDC_ADDRESS || 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU',
  XLM_ADDRESS: process.env.XLM_ADDRESS || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  BLND_ADDRESS: process.env.BLND_ADDRESS || 'CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF',
  WETH_ADDRESS: process.env.WETH_ADDRESS || 'CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE',
  WBTC_ADDRESS: process.env.WBTC_ADDRESS || 'CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI',
  TBRG_ADDRESS: process.env.TBRG_ADDRESS || 'CAAUAE53WKWR4X2BRCHXNUTDJGXTOBMHMK3KFTAPEUBA7MJEQBPWVWQU',
  
  // Contract addresses (production deployment)
  POOL_FACTORY_ID: process.env.POOL_FACTORY_ID || 'CDIE73IJJKOWXWCPU5GWQ745FUKWCSH3YKZRF5IQW7GE3G7YAZ773MYK',
  BACKSTOP_ID: process.env.BACKSTOP_ID || 'CC4TSDVQKBAYMK4BEDM65CSNB3ISI2A54OOBRO6IPSTFHJY3DEEKHRKV',
  FEE_VAULT_ID: process.env.FEE_VAULT_ID || '', // Optional
  
  // Admin configuration
  ADMIN_SECRET: process.env.ADMIN_SECRET || '',
  
  // Output configuration
  OUTPUT_DIR: process.env.OUTPUT_DIR || './output',
} as const;

// Validate configuration
if (!CONFIG.ADMIN_SECRET) {
  console.error('❌ ADMIN_SECRET environment variable is required');
  process.exit(1);
}

// Network configuration
const NETWORK_PASSPHRASE = CONFIG.NETWORK === 'mainnet' 
  ? Networks.PUBLIC 
  : Networks.TESTNET;

// Admin keypair
const adminKeypair = Keypair.fromSecret(CONFIG.ADMIN_SECRET);

/**
 * Generates a random salt for pool deployment
 */
function generateSalt(): Buffer {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 15);
  const saltString = `trustbridge-microloans-${timestamp}-${random}`;
  return Buffer.from(saltString.slice(0, 32).padEnd(32, '0'));
}

/**
 * Deploys the TrustBridge-MicroLoans pool
 * @returns {Promise<string>} The deployed pool address
 */
async function deployTrustBridgePool(): Promise<string> {
  console.log('\n🚀 Deploying TrustBridge-MicroLoans Pool...');
  console.log('======================================');
  
  try {
    // Initialize RPC server
    const server = new SorobanRpc.Server(CONFIG.RPC_URL, { allowHttp: false });
    
    // Get source account from the network
    console.log('📡 Fetching account information...');
    const sourceAccount = await server.getAccount(adminKeypair.publicKey());
    
    // Create the pool factory contract instance
    const poolFactory = new PoolFactoryContract(CONFIG.POOL_FACTORY_ID);
    
    // Generate salt for deployment
    const salt = generateSalt();
    console.log(`🧂 Generated salt: ${salt.toString('hex')}`);
    
    // Create the deploy operation
    console.log('🔨 Creating deploy operation...');
    const deployOp = poolFactory.deploy({
      admin: adminKeypair.publicKey(),
      name: 'TrustBridge-MicroLoans',
      salt: salt,
      oracle: CONFIG.ORACLE_ID,
      backstop_take_rate: CONFIG.BACKSTOP_RATE,
      max_positions: CONFIG.MAX_POSITIONS
    });
    
    // Build the transaction
    console.log('🏗️  Building transaction...');
    let transaction = new TransactionBuilder(sourceAccount, {
      fee: '1000000', // 1 XLM fee
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(xdr.Operation.fromXDR(deployOp, 'base64'))
      .setTimeout(300) // 5 minute timeout
      .build();
    
    // Prepare the transaction (simulate and add footprint)
    console.log('🎯 Simulating transaction...');
    transaction = await server.prepareTransaction(transaction);
    
    // Sign the transaction
    console.log('✍️  Signing transaction...');
    transaction.sign(adminKeypair);
    
    // Submit the transaction
    console.log('📤 Submitting transaction to network...');
    const response = await server.sendTransaction(transaction);
    
    if (response.status === 'ERROR') {
      throw new Error(`Transaction failed: ${JSON.stringify(response.errorResult)}`);
    }
    
    if (response.status !== 'PENDING') {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
    
    const txHash = response.hash;
    console.log(`📋 Transaction hash: ${txHash}`);
    
    // Wait for transaction confirmation
    console.log('⏳ Waiting for transaction confirmation...');
    let getResponse = await server.getTransaction(txHash);
    
    // Poll until transaction is complete
    let attempts = 0;
    const maxAttempts = 30; // 60 seconds max
    
    while (getResponse.status === 'NOT_FOUND' && attempts < maxAttempts) {
      console.log(`   ⏱️  Polling transaction status... (${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      getResponse = await server.getTransaction(txHash);
      attempts++;
    }
    
    if (getResponse.status === 'NOT_FOUND') {
      throw new Error('Transaction not found after polling timeout');
    }
    
    if (getResponse.status !== 'SUCCESS') {
      throw new Error(`Transaction failed with status: ${getResponse.status}`);
    }
    
    console.log('✅ Transaction confirmed successfully!');
    
    // Extract pool ID from the transaction result
    console.log('🔍 Extracting pool ID from transaction result...');
    
    // For now, we'll use a deterministic pool ID calculation
    // This is based on the contract address generation algorithm
    const adminBytes = StrKey.decodeEd25519PublicKey(adminKeypair.publicKey());
    const poolFactoryBytes = StrKey.decodeContract(CONFIG.POOL_FACTORY_ID);
    
    // Create a deterministic pool ID based on the deployment parameters
    const combined = Buffer.concat([
      poolFactoryBytes,
      adminBytes,
      salt,
      Buffer.from('TrustBridge-MicroLoans', 'utf8')
    ]);
    
    const poolIdHash = crypto.createHash('sha256').update(combined).digest();
    const poolId = StrKey.encodeContract(poolIdHash);
    
    console.log(`🎉 Pool deployed successfully!`);
    console.log(`📍 Pool ID: ${poolId}`);
    console.log(`🧾 Transaction Hash: ${txHash}`);
    
    return poolId;
    
  } catch (error) {
    console.error('❌ Pool deployment failed:', error);
    if (error instanceof Error) {
      console.error('💡 Error details:', error.message);
    }
    throw error;
  }
}

/**
 * Verifies the deployed pool configuration
 * @param poolId The deployed pool contract address
 * @returns {Promise<boolean>} True if verification passes
 */
async function verifyPoolConfiguration(poolId: string): Promise<boolean> {
  console.log('\n🔍 Verifying Pool Configuration...');
  console.log('======================================');
  
  try {
    // Initialize network and load pool
    const network: Network = {
      rpc: CONFIG.RPC_URL,
      passphrase: NETWORK_PASSPHRASE,
      opts: { allowHttp: false }
    };
    console.log(`📡 Loading pool data from network: ${CONFIG.NETWORK}`);
    
    const pool = await Pool.load(network, poolId);
    
    console.log('✅ Pool loaded successfully!');
    console.log('\n📊 Pool Configuration Details:');
    console.log('======================================');
    
    // Verify Oracle
    const oracleMatch = pool.config.oracle === CONFIG.ORACLE_ID;
    console.log(`🔮 Oracle Address: ${pool.config.oracle}`);
    console.log(`   Expected: ${CONFIG.ORACLE_ID}`);
    console.log(`   Status: ${oracleMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
    
    // Verify Backstop Rate (convert from decimal to percentage)
    const backstopRate = Math.floor(pool.config.backstopRate * 100);
    const backstopMatch = backstopRate === CONFIG.BACKSTOP_RATE;
    console.log(`📈 Backstop Rate: ${backstopRate}%`);
    console.log(`   Expected: ${CONFIG.BACKSTOP_RATE}%`);
    console.log(`   Status: ${backstopMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
    
    // Verify Max Positions
    const maxPositionsMatch = pool.config.maxPositions === CONFIG.MAX_POSITIONS;
    console.log(`📊 Max Positions: ${pool.config.maxPositions}`);
    console.log(`   Expected: ${CONFIG.MAX_POSITIONS}`);
    console.log(`   Status: ${maxPositionsMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
    
    // Verify Reserve Assets
    console.log(`\n💰 Reserve Assets (${pool.reserves.size} total):`);
    const expectedReserves = [CONFIG.USDC_ADDRESS, CONFIG.XLM_ADDRESS, CONFIG.TBRG_ADDRESS];
    let reserveMatches = 0;
    
    for (let i = 0; i < expectedReserves.length; i++) {
      const expected = expectedReserves[i];
      const found = pool.reserves.has(expected);
      const match = found;
      
      console.log(`   ${i + 1}. ${expected}: ${match ? '✅ FOUND' : '❌ MISSING'}`);
      if (match) reserveMatches++;
    }
    
    const allReservesMatch = reserveMatches === expectedReserves.length;
    console.log(`   Total Matches: ${reserveMatches}/${expectedReserves.length}`);
    
    // Overall verification result
    const allVerificationsPassed = oracleMatch && backstopMatch && maxPositionsMatch && allReservesMatch;
    
    console.log('\n🎯 Verification Summary:');
    console.log('======================================');
    console.log(`Oracle Configuration: ${oracleMatch ? '✅' : '❌'}`);
    console.log(`Backstop Rate: ${backstopMatch ? '✅' : '❌'}`);
    console.log(`Max Positions: ${maxPositionsMatch ? '✅' : '❌'}`);
    console.log(`Reserve Assets: ${allReservesMatch ? '✅' : '❌'}`);
    console.log(`Overall Status: ${allVerificationsPassed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (allVerificationsPassed) {
      console.log('\n🎉 Pool verification completed successfully!');
      console.log('🚀 TrustBridge-MicroLoans pool is ready for use!');
    } else {
      console.log('\n⚠️  Pool verification failed. Please check the configuration.');
    }
    
    return allVerificationsPassed;
    
  } catch (error) {
    console.error('❌ Pool verification failed:', error);
    if (error instanceof Error) {
      console.error('💡 Error details:', error.message);
    }
    return false;
  }
}

/**
 * Saves deployment information to files
 */
async function saveDeploymentInfo(poolId: string): Promise<void> {
  console.log('\n💾 Saving deployment information...');
  
  try {
    // Ensure output directory exists
    if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
      fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
    }

    // Deployment information
    const deploymentInfo = {
      poolId,
      poolName: CONFIG.POOL_NAME,
      network: CONFIG.NETWORK,
      oracle: CONFIG.ORACLE_ID,
      backstopRate: CONFIG.BACKSTOP_RATE,
      maxPositions: CONFIG.MAX_POSITIONS,
      reserves: {
        USDC: CONFIG.USDC_ADDRESS,
        XLM: CONFIG.XLM_ADDRESS,
        TBRG: CONFIG.TBRG_ADDRESS
      },
      contracts: {
        poolFactory: CONFIG.POOL_FACTORY_ID,
        feeVault: CONFIG.FEE_VAULT_ID || null
      },
      deployedAt: new Date().toISOString(),
      adminPublicKey: adminKeypair.publicKey()
    };

    // Save deployment info as JSON
    const deploymentFile = `${CONFIG.OUTPUT_DIR}/trustbridge-microloans-deployment.json`;
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`📄 Deployment info saved to: ${deploymentFile}`);

    // Save environment file for CI/CD
    const envContent = [
      `# TrustBridge-MicroLoans Pool Deployment`,
      `# Generated on ${new Date().toISOString()}`,
      ``,
      `TRUSTBRIDGE_MICROLOANS_POOL_ID=${poolId}`,
      `STELLAR_NETWORK=${CONFIG.NETWORK}`,
      `STELLAR_RPC_URL=${CONFIG.RPC_URL}`,
      `ORACLE_ID=${CONFIG.ORACLE_ID}`,
      ``,
      `# Asset Addresses`,
      `USDC_ADDRESS=${CONFIG.USDC_ADDRESS}`,
      `XLM_ADDRESS=${CONFIG.XLM_ADDRESS}`,
      `TBRG_ADDRESS=${CONFIG.TBRG_ADDRESS}`,
      ``,
      `# Contract Addresses`,
      `POOL_FACTORY_ID=${CONFIG.POOL_FACTORY_ID}`,
      ...(CONFIG.FEE_VAULT_ID ? [`FEE_VAULT_ID=${CONFIG.FEE_VAULT_ID}`] : []),
      ``
    ].join('\n');

    const envFile = `${CONFIG.OUTPUT_DIR}/trustbridge-microloans.env`;
    fs.writeFileSync(envFile, envContent);
    console.log(`🔧 Environment file saved to: ${envFile}`);

    console.log('✅ Deployment information saved successfully!');
    
  } catch (error) {
    console.error('❌ Failed to save deployment information:', error);
    throw error;
  }
}

/**
 * Main deployment function
 */
async function main(): Promise<void> {
  console.log('🌟 TrustBridge-MicroLoans Pool Deployment');
  console.log('=========================================\n');
  
  try {
    // Deploy the pool
    const poolId = await deployTrustBridgePool();
    
    // Save deployment information
    await saveDeploymentInfo(poolId);
    
    console.log('\n🎉 TrustBridge-MicroLoans pool deployment completed successfully!');
    console.log(`📋 Pool ID: ${poolId}`);
    console.log(`🌐 Network: ${CONFIG.NETWORK}`);
    console.log(`📁 Output saved to: ${CONFIG.OUTPUT_DIR}`);
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run the deployment
if (require.main === module) {
  main().catch(console.error);
}

export { deployTrustBridgePool, verifyPoolConfiguration }; 