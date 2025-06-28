import { 
  PoolContract, 
  ReserveConfig,
} from '@blend-capital/blend-sdk';
import { 
  Keypair, 
  Networks, 
  SorobanRpc, 
  TransactionBuilder,
  xdr
} from '@stellar/stellar-sdk';
import { config } from 'dotenv';

// Load environment variables
config();

// Configuration
const NETWORK_PASSPHRASE = Networks.TESTNET;
const RPC_URL = process.env.RPC_URL || 'https://soroban-testnet.stellar.org';

// Contract addresses
const POOL_ADDRESS = process.env.POOL_ADDRESS!;

// Asset addresses (production deployment)
const USDC_ADDRESS = process.env.USDC_ADDRESS || 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU';
const XLM_ADDRESS = process.env.XLM_ADDRESS || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const WETH_ADDRESS = process.env.WETH_ADDRESS || 'CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE';
const WBTC_ADDRESS = process.env.WBTC_ADDRESS || 'CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI';
const TBRG_ADDRESS = process.env.TBRG_ADDRESS || 'CAAUAE53WKWR4X2BRCHXNUTDJGXTOBMHMK3KFTAPEUBA7MJEQBPWVWQU';

// Network configuration

// Reserve configurations
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
    reactivity: 1000   // Interest rate reactivity
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
    reactivity: 1000   // Interest rate reactivity
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
    reactivity: 1000   // Interest rate reactivity
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
    reactivity: 1000   // Interest rate reactivity
  },
  TBRG: {
    index: 4,
    decimals: 7,
    c_factor: 0.6,     // 60% collateral factor
    l_factor: 0.8,     // 80% liability factor
    util: 0.6,         // 60% target utilization
    max_util: 0.85,    // 85% max utilization
    r_base: 0.03,      // 3% base rate
    r_one: 0.1,        // 10% rate at target utilization
    r_two: 0.8,        // 80% rate at max utilization
    r_three: 3.0,      // 300% rate above max utilization
    reactivity: 1000   // Interest rate reactivity
  }
};

async function configureReserves(): Promise<{ success: boolean; configuredAssets: { name: string; address: string }[] }> {
  try {
    console.log('🔧 Starting Reserve Configuration...\n');

    // Validate required environment variables
    const requiredVars = [
      'SECRET_KEY',
      'POOL_ADDRESS'
    ];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    }

    // Initialize admin keypair
    const adminKeypair = Keypair.fromSecret(process.env.SECRET_KEY!);
    const adminAddress = adminKeypair.publicKey();
    
    console.log(`📋 Configuration Details:`);
    console.log(`   Admin: ${adminAddress}`);
    console.log(`   Pool: ${POOL_ADDRESS}`);
    console.log(`   Assets: USDC, XLM, wETH, wBTC, TBRG\n`);

    // Initialize RPC server and pool contract
    const server = new SorobanRpc.Server(RPC_URL, { allowHttp: false });
    const poolContract = new PoolContract(POOL_ADDRESS);

    // Asset mapping (production deployment)
    const assets = [
      { name: 'USDC', address: USDC_ADDRESS, config: RESERVE_CONFIGS.USDC },
      { name: 'XLM', address: XLM_ADDRESS, config: RESERVE_CONFIGS.XLM },
      { name: 'wETH', address: WETH_ADDRESS, config: RESERVE_CONFIGS.WETH },
      { name: 'wBTC', address: WBTC_ADDRESS, config: RESERVE_CONFIGS.WBTC },
      { name: 'TBRG', address: TBRG_ADDRESS, config: RESERVE_CONFIGS.TBRG }
    ];

    // Step 1: Queue reserve configurations
    console.log('1️⃣ Queuing reserve configurations...\n');
    
    for (const asset of assets) {
      console.log(`   Configuring ${asset.name}...`);
      
      // Create ReserveConfig instance
      const reserveConfig = new ReserveConfig(
        asset.config.index,
        asset.config.decimals,
        asset.config.c_factor,
        asset.config.l_factor,
        asset.config.util,
        asset.config.max_util,
        asset.config.r_base,
        asset.config.r_one,
        asset.config.r_two,
        asset.config.r_three,
        asset.config.reactivity
      );

      // Queue the reserve configuration
      const queueOperation = poolContract.queueSetReserve({
        asset: asset.address,
        metadata: reserveConfig
      });

      // Build and submit transaction
      const account = await server.getAccount(adminAddress);
      const queueTx = new TransactionBuilder(account, {
        fee: '1000000',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(xdr.Operation.fromXDR(queueOperation, 'base64'))
        .setTimeout(300)
        .build();

      const preparedQueueTx = await server.prepareTransaction(queueTx);
      preparedQueueTx.sign(adminKeypair);

      const queueResult = await server.sendTransaction(preparedQueueTx);
      
      if (queueResult.status !== 'PENDING') {
        throw new Error(`Failed to queue reserve for ${asset.name}: ${queueResult.errorResult}`);
      }

      // Wait for confirmation
      const queueHash = queueResult.hash;
      let queueStatus;
      
      do {
        await new Promise(resolve => setTimeout(resolve, 2000));
        queueStatus = await server.getTransaction(queueHash);
      } while (queueStatus.status === 'NOT_FOUND');

      if (queueStatus.status !== 'SUCCESS') {
        throw new Error(`Queue transaction failed for ${asset.name}: ${queueStatus.resultXdr}`);
      }

      console.log(`   ✅ ${asset.name} reserve queued successfully`);
    }

    console.log('\n⏳ Waiting for timelock period...');
    console.log('   (In production, you would wait for the timelock period to expire)');
    console.log('   For testnet, this might be shorter or immediate\n');

    // Step 2: Set reserve configurations (after timelock)
    console.log('2️⃣ Setting reserve configurations...\n');
    
    for (const asset of assets) {
      console.log(`   Setting ${asset.name} reserve...`);
      
      // Set the reserve configuration (note: no metadata parameter needed)
      const setOperation = poolContract.setReserve(asset.address);

      // Build and submit transaction
      const account = await server.getAccount(adminAddress);
      const setTx = new TransactionBuilder(account, {
        fee: '1000000',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(xdr.Operation.fromXDR(setOperation, 'base64'))
        .setTimeout(300)
        .build();

      const preparedSetTx = await server.prepareTransaction(setTx);
      preparedSetTx.sign(adminKeypair);

      const setResult = await server.sendTransaction(preparedSetTx);
      
      if (setResult.status !== 'PENDING') {
        throw new Error(`Failed to set reserve for ${asset.name}: ${setResult.errorResult}`);
      }

      // Wait for confirmation
      const setHash = setResult.hash;
      let setStatus;
      
      do {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setStatus = await server.getTransaction(setHash);
      } while (setStatus.status === 'NOT_FOUND');

      if (setStatus.status !== 'SUCCESS') {
        throw new Error(`Set transaction failed for ${asset.name}: ${setStatus.resultXdr}`);
      }

      // Extract reserve index from result
      const reserveIndex = PoolContract.parsers.setReserve(setStatus.resultXdr ? setStatus.resultXdr.toString() : "");
      console.log(`   ✅ ${asset.name} reserve set successfully (index: ${reserveIndex})`);
    }

    // Step 3: Display configuration summary
    console.log('\n🎉 Reserve Configuration Complete!\n');
    console.log('📊 Configuration Summary:');
    
    for (const asset of assets) {
      console.log(`\n   ${asset.name} (${asset.address}):`);
      console.log(`     Collateral Factor: ${(asset.config.c_factor * 100).toFixed(1)}%`);
      console.log(`     Target Utilization: ${(asset.config.util * 100).toFixed(1)}%`);
      console.log(`     Max Utilization: ${(asset.config.max_util * 100).toFixed(1)}%`);
      console.log(`     Base Rate: ${(asset.config.r_base * 100).toFixed(2)}%`);
      console.log(`     Rate at Target: ${(asset.config.r_one * 100).toFixed(2)}%`);
    }

    console.log('\n📝 Next Steps:');
    console.log('   1. Set up emissions configuration');
    console.log('   2. Fund the backstop if required');
    console.log('   3. Verify pool is ready for lending/borrowing');
    console.log('   4. Run verification script\n');

    return {
      success: true,
      configuredAssets: assets.map(a => ({ name: a.name, address: a.address }))
    };

  } catch (error) {
    console.error('❌ Reserve configuration failed:', error);
    throw error;
  }
}

// Run configuration if this script is executed directly
if (require.main === module) {
  configureReserves()
    .then(() => {
      console.log('✅ Reserve configuration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Reserve configuration failed:', error);
      process.exit(1);
    });
}

export { configureReserves }; 