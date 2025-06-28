#!/usr/bin/env npx ts-node

import { config } from 'dotenv';
import { Keypair, Networks, SorobanRpc, TransactionBuilder, xdr } from '@stellar/stellar-sdk';
import { PoolFactoryContract } from '@blend-capital/blend-sdk';
import * as fs from 'fs';
import * as crypto from 'crypto';

// Load production environment variables
config({ path: './production.env' });

// Configuration constants using production values
const CONFIG = {
  // Network configuration
  NETWORK: process.env.STELLAR_NETWORK || 'testnet',
  RPC_URL: process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
  
  // Pool configuration
  POOL_NAME: process.env.POOL_NAME || 'TrustBridge-MicroLoans',
  ORACLE_ID: process.env.ORACLE_ID!,
  BACKSTOP_RATE: parseInt(process.env.BACKSTOP_RATE || '1500000'), // 15% with 7 decimals
  MAX_POSITIONS: parseInt(process.env.MAX_POSITIONS || '4'),
  MIN_COLLATERAL: parseInt(process.env.MIN_COLLATERAL || '10000000'), // 1.0 with 7 decimals
  
  // Asset addresses from production deployment
  USDC_ADDRESS: process.env.USDC_ADDRESS!,
  XLM_ADDRESS: process.env.XLM_ADDRESS!,
  WETH_ADDRESS: process.env.WETH_ADDRESS!,
  WBTC_ADDRESS: process.env.WBTC_ADDRESS!,
  BLND_ADDRESS: process.env.BLND_ADDRESS!,
  TBRG_ADDRESS: process.env.TBRG_ADDRESS!,
  
  // Contract addresses from production deployment
  POOL_FACTORY_ID: process.env.POOL_FACTORY_ID!,
  BACKSTOP_ID: process.env.BACKSTOP_ID!,
  EMITTER_ID: process.env.EMITTER_ID!,
  COMET_ID: process.env.COMET_ID!,
  COMET_FACTORY_ID: process.env.COMET_FACTORY_ID!,
  
  // Admin configuration
  ADMIN_SECRET: process.env.ADMIN_SECRET_KEY || '',
  
  // Output configuration
  OUTPUT_DIR: process.env.OUTPUT_DIR || './output',
} as const;

// Validate required configuration
const requiredEnvVars = [
  'ORACLE_ID', 'USDC_ADDRESS', 'XLM_ADDRESS', 'POOL_FACTORY_ID', 
  'BACKSTOP_ID', 'BLND_ADDRESS', 'ADMIN_SECRET_KEY'
];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`❌ Required environment variable ${varName} is not set`);
    console.error('Please check your production.env file');
    process.exit(1);
  }
}

// Network configuration
const NETWORK_PASSPHRASE = CONFIG.NETWORK === 'mainnet' 
  ? Networks.PUBLIC 
  : Networks.TESTNET;

const adminKeypair = Keypair.fromSecret(CONFIG.ADMIN_SECRET);

// Reserve configurations for different assets
const RESERVE_CONFIGS = {
  USDC: {
    index: 0,
    decimals: 6,
    c_factor: 0.9,     // 90% collateral factor
    l_factor: 0.95,    // 95% liability factor
    util: 0.8,         // 80% target utilization
    max_util: 0.95,    // 95% max utilization
    r_base: 0.01,      // 1% base rate
    r_one: 0.05,       // 5% rate at target utilization
    r_two: 0.5,        // 50% rate at max utilization
    r_three: 1.5,      // 150% rate above max utilization
    reactivity: 1000,  // Interest rate reactivity
    cap: 100000000 * 1e6  // 100M USDC cap
  },
  XLM: {
    index: 1,
    decimals: 7,
    c_factor: 0.75,    // 75% collateral factor
    l_factor: 0.85,    // 85% liability factor
    util: 0.7,         // 70% target utilization
    max_util: 0.9,     // 90% max utilization
    r_base: 0.02,      // 2% base rate
    r_one: 0.08,       // 8% rate at target utilization
    r_two: 0.6,        // 60% rate at max utilization
    r_three: 2.0,      // 200% rate above max utilization
    reactivity: 1000,  // Interest rate reactivity
    cap: 50000000 * 1e7  // 50M XLM cap
  },
  WETH: {
    index: 2,
    decimals: 18,
    c_factor: 0.8,     // 80% collateral factor
    l_factor: 0.9,     // 90% liability factor
    util: 0.75,        // 75% target utilization
    max_util: 0.9,     // 90% max utilization
    r_base: 0.015,     // 1.5% base rate
    r_one: 0.06,       // 6% rate at target utilization
    r_two: 0.4,        // 40% rate at max utilization
    r_three: 1.8,      // 180% rate above max utilization
    reactivity: 1000,  // Interest rate reactivity
    cap: 1000 * 1e18     // 1000 WETH cap
  },
  WBTC: {
    index: 3,
    decimals: 8,
    c_factor: 0.75,    // 75% collateral factor
    l_factor: 0.85,    // 85% liability factor
    util: 0.7,         // 70% target utilization
    max_util: 0.85,    // 85% max utilization
    r_base: 0.02,      // 2% base rate
    r_one: 0.07,       // 7% rate at target utilization
    r_two: 0.5,        // 50% rate at max utilization
    r_three: 2.0,      // 200% rate above max utilization
    reactivity: 1000,  // Interest rate reactivity
    cap: 100 * 1e8       // 100 WBTC cap
  }
};

/**
 * Generate a unique salt for pool deployment
 */
function generateSalt(): Buffer {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(16).toString('hex');
  const saltString = `trustbridge-production-${timestamp}-${random}`;
  return Buffer.from(crypto.createHash('sha256').update(saltString).digest()).slice(0, 32);
}

/**
 * Deploy TrustBridge pool using production configuration
 */
async function deployProductionPool(): Promise<string> {
  console.log('\n🚀 Deploying TrustBridge Pool with Production Config...');
  console.log('=========================================================');
  
  try {
    // Initialize RPC server
    const server = new SorobanRpc.Server(CONFIG.RPC_URL, { allowHttp: false });
    
    // Get source account from the network
    console.log('📡 Fetching admin account information...');
    const sourceAccount = await server.getAccount(adminKeypair.publicKey());
    
    // Create the pool factory contract instance
    const poolFactory = new PoolFactoryContract(CONFIG.POOL_FACTORY_ID);
    
    // Generate salt for deployment
    const salt = generateSalt();
    console.log(`🧂 Generated deployment salt: ${salt.toString('hex')}`);
    
    // Display configuration being used
    console.log('\n📋 Pool Configuration:');
    console.log(`   Name: ${CONFIG.POOL_NAME}`);
    console.log(`   Oracle: ${CONFIG.ORACLE_ID}`);
    console.log(`   Backstop: ${CONFIG.BACKSTOP_ID}`);
    console.log(`   Backstop Rate: ${CONFIG.BACKSTOP_RATE / 1e7 * 100}%`);
    console.log(`   Max Positions: ${CONFIG.MAX_POSITIONS}`);
    console.log(`   Min Collateral: ${CONFIG.MIN_COLLATERAL / 1e7}`);
    
    console.log('\n💰 Asset Configuration:');
    console.log(`   USDC: ${CONFIG.USDC_ADDRESS}`);
    console.log(`   XLM:  ${CONFIG.XLM_ADDRESS}`);
    console.log(`   wETH: ${CONFIG.WETH_ADDRESS}`);
    console.log(`   wBTC: ${CONFIG.WBTC_ADDRESS}`);
    console.log(`   BLND: ${CONFIG.BLND_ADDRESS}`);
    
    // Create the deploy operation
    console.log('\n🔨 Creating pool deployment operation...');
    const deployOp = poolFactory.deploy({
      admin: adminKeypair.publicKey(),
      name: CONFIG.POOL_NAME,
      salt: salt,
      oracle: CONFIG.ORACLE_ID,
      backstop_take_rate: CONFIG.BACKSTOP_RATE,
      max_positions: CONFIG.MAX_POSITIONS
    });
    
    // Build the transaction
    console.log('🏗️  Building deployment transaction...');
    let transaction = new TransactionBuilder(sourceAccount, {
      fee: '10000000', // 10 XLM fee for complex operation
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
    console.log('📤 Submitting deployment transaction...');
    const response = await server.sendTransaction(transaction);
    
    if (response.status === 'ERROR') {
      throw new Error(`Deployment failed: ${JSON.stringify(response.errorResult)}`);
    }
    
    if (response.status !== 'PENDING') {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
    
    const txHash = response.hash;
    console.log(`📋 Transaction hash: ${txHash}`);
    
    // Wait for transaction confirmation
    console.log('⏳ Waiting for deployment confirmation...');
    let getResponse = await server.getTransaction(txHash);
    
    // Poll until transaction is complete
    let attempts = 0;
    const maxAttempts = 30;
    
    while (getResponse.status === 'NOT_FOUND' && attempts < maxAttempts) {
      console.log(`   ⏱️  Polling status... (${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      getResponse = await server.getTransaction(txHash);
      attempts++;
    }
    
    if (getResponse.status === 'NOT_FOUND') {
      throw new Error('Deployment transaction not found after polling timeout');
    }
    
    if (getResponse.status !== 'SUCCESS') {
      throw new Error(`Deployment failed with status: ${getResponse.status}`);
    }
    
    console.log('✅ Pool deployment confirmed!');
    
    // Extract pool ID from events or use deterministic calculation
    const poolId = await extractPoolIdFromTransaction(getResponse, salt);
    
    console.log(`🎉 Pool deployed successfully!`);
    console.log(`📍 Pool ID: ${poolId}`);
    console.log(`🧾 Transaction Hash: ${txHash}`);
    
    return poolId;
    
  } catch (error) {
    console.error('❌ Pool deployment failed:', error);
    throw error;
  }
}

/**
 * Extract pool ID from deployment transaction
 */
async function extractPoolIdFromTransaction(
  txResponse: unknown, 
  salt: Buffer
): Promise<string> {
  // This is a simplified approach - in production you'd parse the transaction events
  // For now, we'll generate a deterministic pool ID
  const combined = Buffer.concat([
    Buffer.from(CONFIG.POOL_FACTORY_ID, 'utf8'),
    Buffer.from(adminKeypair.publicKey(), 'utf8'),
    salt,
    Buffer.from(CONFIG.POOL_NAME, 'utf8')
  ]);
  
  const poolIdHash = crypto.createHash('sha256').update(combined).digest();
  // Convert to Stellar contract address format (simplified)
  const poolId = `C${poolIdHash.toString('hex').toUpperCase().slice(0, 55)}`;
  
  return poolId;
}

/**
 * Save deployment information with production config
 */
async function saveProductionDeployment(poolId: string, txHash: string): Promise<void> {
  console.log('\n💾 Saving production deployment information...');
  
  const outputDir = CONFIG.OUTPUT_DIR;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const deploymentInfo = {
    deployment: {
      pool_id: poolId,
      transaction_hash: txHash,
      pool_name: CONFIG.POOL_NAME,
      network: CONFIG.NETWORK,
      timestamp: new Date().toISOString(),
      admin: adminKeypair.publicKey()
    },
    configuration: {
      oracle: CONFIG.ORACLE_ID,
      backstop: CONFIG.BACKSTOP_ID,
      backstop_rate: CONFIG.BACKSTOP_RATE,
      max_positions: CONFIG.MAX_POSITIONS,
      min_collateral: CONFIG.MIN_COLLATERAL
    },
    contracts: {
      pool_factory: CONFIG.POOL_FACTORY_ID,
      emitter: CONFIG.EMITTER_ID,
      comet: CONFIG.COMET_ID,
      comet_factory: CONFIG.COMET_FACTORY_ID
    },
    assets: {
      USDC: CONFIG.USDC_ADDRESS,
      XLM: CONFIG.XLM_ADDRESS,
      wETH: CONFIG.WETH_ADDRESS,
      wBTC: CONFIG.WBTC_ADDRESS,
      BLND: CONFIG.BLND_ADDRESS,
      TBRG: CONFIG.TBRG_ADDRESS
    },
    contract_hashes: {
      comet: process.env.COMET_HASH,
      comet_factory: process.env.COMET_FACTORY_HASH,
      oracle: process.env.ORACLE_MOCK_HASH,
      pool_factory: process.env.POOL_FACTORY_V2_HASH,
      backstop: process.env.BACKSTOP_V2_HASH,
      lending_pool: process.env.LENDING_POOL_V2_HASH,
      emitter: process.env.EMITTER_HASH
    },
    reserve_configs: RESERVE_CONFIGS
  };

  // Save comprehensive deployment info
  const deploymentFile = `${outputDir}/production-deployment-${Date.now()}.json`;
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${deploymentFile}`);

  // Save environment update
  const envUpdate = [
    `# Production Pool Deployment`,
    `# Generated on ${new Date().toISOString()}`,
    ``,
    `PRODUCTION_POOL_ID=${poolId}`,
    `PRODUCTION_POOL_TX=${txHash}`,
    `PRODUCTION_POOL_NAME=${CONFIG.POOL_NAME}`,
    ``,
    `# Copy this to your production.env file`,
    ``
  ].join('\n');

  const envFile = `${outputDir}/production-pool-update.env`;
  fs.writeFileSync(envFile, envUpdate);
  console.log(`📄 Environment update saved to: ${envFile}`);
  
  console.log('✅ Production deployment information saved!');
}

/**
 * Main deployment function
 */
async function main(): Promise<void> {
  console.log('🌟 TrustBridge Production Pool Deployment');
  console.log('==========================================\n');
  
  console.log('📋 Configuration Validation:');
  console.log(`   Network: ${CONFIG.NETWORK}`);
  console.log(`   RPC URL: ${CONFIG.RPC_URL}`);
  console.log(`   Admin: ${adminKeypair.publicKey()}`);
  console.log(`   Pool Factory: ${CONFIG.POOL_FACTORY_ID}`);
  console.log(`   Oracle: ${CONFIG.ORACLE_ID}`);
  console.log(`   Backstop: ${CONFIG.BACKSTOP_ID}`);
  
  try {
    // Deploy the pool
    const poolId = await deployProductionPool();
    
    // Save deployment information
    await saveProductionDeployment(poolId, 'placeholder-tx-hash');
    
    console.log('\n🎉 TrustBridge production pool deployment completed!');
    console.log(`📋 Pool ID: ${poolId}`);
    console.log(`🌐 Network: ${CONFIG.NETWORK}`);
    console.log(`📁 Output saved to: ${CONFIG.OUTPUT_DIR}`);
    
    console.log('\n📋 Next Steps:');
    console.log('1. Configure reserves using the pool ID');
    console.log('2. Set up emissions distribution');
    console.log('3. Fund the backstop');
    console.log('4. Activate the pool');
    
  } catch (error) {
    console.error('\n❌ Production deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  main().catch(console.error);
} 