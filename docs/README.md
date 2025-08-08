# TrustBridge Contracts Documentation

Welcome to the TrustBridge smart contracts documentation. This directory contains comprehensive guides for deploying, configuring, and using the TrustBridge DeFi protocol on Stellar.

## 📋 Table of Contents

### Quick Start
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide using `deploy-all.sh`

### Contract Architecture
- **Oracle Contract** - Price feed oracle implementing SEP-40
- **Pool Factory** - Factory for creating lending pools
- **Backstop Contract** - Backstop mechanism for pool security
- **Pool Contract** - Main lending pool with collateral management

### Deployment Files
- **`tools/deploy-all.sh`** - Automated deployment script
- **`deployment.json`** - Generated contract addresses and metadata  
- **`deployment.env`** - Environment variables for deployed contracts

## 🚀 Quick Deployment

```bash
# 1. Set up your admin address
ADMIN_ADDRESS="YOUR_STELLAR_ADDRESS" 

# 2. Run deployment
./tools/deploy-all.sh
```

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 📁 Generated Files

After successful deployment, you'll find:

```
├── deployment.json     # Contract addresses and deployment info
├── deployment.env      # Environment variables to source
└── docs/
    └── DEPLOYMENT.md   # This comprehensive guide
```

## 🔧 Contract Interactions

### Load Contract Addresses
```bash
source deployment.env
```

### Oracle Usage
```bash
# Set asset price
stellar contract invoke --id $TRUSTBRIDGE_ORACLE_ID --source alice --network testnet -- set_price --asset {...} --price 10000000

# Get asset price  
stellar contract invoke --id $TRUSTBRIDGE_ORACLE_ID --source alice --network testnet -- lastprice --asset {...}
```

### Pool Usage
```bash
# Submit lending/borrowing requests
stellar contract invoke --id $TRUSTBRIDGE_POOL_ID --source alice --network testnet -- submit --from alice --requests [...]
```

## 🌐 Networks

- **Testnet** (default): For testing and development
- **Futurenet**: For experimental features  
- **Mainnet**: For production deployments

## 📖 Additional Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Smart Contracts](https://developers.stellar.org/docs/build/smart-contracts)
- [TrustBridge Protocol Overview](../README.md)

## ⚠️ Important Notes

- Always test on testnet before mainnet deployment
- Keep your deployment files secure
- Verify contract addresses on Stellar Explorer
- Follow security best practices for key management

---

For the complete deployment walkthrough, start with **[DEPLOYMENT.md](./DEPLOYMENT.md)**.