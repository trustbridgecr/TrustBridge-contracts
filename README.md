# TrustBridge Smart Contracts

TrustBridge is a decentralized finance (DeFi) protocol built on the Stellar network, providing lending and borrowing functionality with collateral management and backstop mechanisms.

## 🏗️ Project Structure

```
TrustBridge-contracts/
├── contracts/                  # All smart contracts
│   ├── oracle/                # Price feed oracle (SEP-40)
│   ├── pool-factory/          # Factory for creating lending pools
│   ├── backstop/              # Backstop mechanism for pool security
│   ├── pool/                  # Main lending pool contract
│   ├── tbrg-token/            # TrustBridge governance token
│   └── mocks/                 # Mock contracts for testing
├── tools/                     # Deployment and utility scripts
│   ├── deploy-all.sh          # Complete deployment automation
│   └── scripts/               # Additional utility scripts
├── testing/                   # Test suites and fixtures
├── docs/                      # Documentation
├── audits/                    # Security audit reports
└── Cargo.toml                 # Workspace configuration
```

## 🚀 Quick Start

### 1. Prerequisites

- **Rust** (1.89.0 or later)
- **Stellar CLI**
- **wasm32-unknown-unknown target**

```bash
rustup target add wasm32-unknown-unknown
```

### 2. Deploy All Contracts

```bash
# Make script executable
chmod +x tools/deploy-all.sh

# Deploy with your admin address
ADMIN_ADDRESS="YOUR_STELLAR_ADDRESS" ./tools/deploy-all.sh
```

### 3. Use Deployed Contracts

```bash
# Load contract addresses
source deployment.env

# Interact with contracts
stellar contract invoke --id $TRUSTBRIDGE_ORACLE_ID --source alice --network testnet -- set_price ...
```

## 📖 Documentation

- **[Complete Deployment Guide](./docs/DEPLOYMENT.md)** - Step-by-step deployment instructions
- **[Architecture Overview](./docs/README.md)** - Contract architecture and interactions

## 🔧 Smart Contracts

### Core Contracts

| Contract | Description | Location |
|----------|-------------|----------|
| **Oracle** | SEP-40 price feed oracle | `contracts/oracle/` |
| **Pool Factory** | Creates and manages lending pools | `contracts/pool-factory/` |
| **Backstop** | Backstop mechanism for pool security | `contracts/backstop/` |
| **Pool** | Main lending/borrowing pool | `contracts/pool/` |
| **TBRG Token** | TrustBridge governance token | `contracts/tbrg-token/` |

### Mock Contracts

Testing contracts located in `contracts/mocks/`:
- `mock-pool-factory/` - Mock pool factory for testing
- `mock-pool/` - Mock pool for testing
- `moderc3156/` - ERC-3156 flash loan standard mock

## 🛠️ Development

### Build Individual Contracts

```bash
# Build oracle
cd contracts/oracle && cargo build --target wasm32-unknown-unknown --release

# Build all contracts in dependency order
./tools/deploy-all.sh  # This also builds everything
```

### Run Tests

```bash
# Run contract-specific tests
cd contracts/oracle && cargo test

# Run comprehensive test suite
cd testing/test-suites && cargo test
```

## 🌐 Networks

### Testnet (Recommended for Development)
```bash
NETWORK="testnet" ./tools/deploy-all.sh
```

### Futurenet (Experimental Features)
```bash
NETWORK="futurenet" ./tools/deploy-all.sh
```

### Mainnet (Production)
```bash
NETWORK="mainnet" ./tools/deploy-all.sh
```

## 📄 Configuration Files

### Environment Configuration

- **`.env.example`** - Template for environment variables
- **`.env`** - Your local environment variables (create from .env.example)

```bash
# Setup environment
cp .env.example .env
# Edit .env with your values
```

### Generated Files

After deployment, the following files are created:

- **`deployment.json`** - Contract addresses and deployment metadata
- **`deployment.env`** - Environment variables for easy sourcing

### Git Configuration

- **`.gitignore`** - Comprehensive ignore rules for Rust/Soroban projects
- **`.gitattributes`** - Proper handling of text/binary files

## 🔐 Security

- All contracts have been audited (see `audits/` directory)
- Use testnet for development and testing
- Keep private keys secure
- Verify all contract addresses before interacting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes in the appropriate `contracts/` directory
4. Add tests in `testing/test-suites/`
5. Update documentation in `docs/`
6. Submit a pull request

**Notes for contributors:**
- Under no circumstances should the "overflow-checks" flag be removed otherwise contract math will become unsafe
- Follow the existing code style and patterns
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Smart Contracts](https://developers.stellar.org/docs/build/smart-contracts)
- [TrustBridge Protocol Documentation](./docs/)

## ⚠️ Disclaimer

This software is provided "as is" without warranty. Use at your own risk. Always test thoroughly on testnets before mainnet deployment.

---

For detailed deployment instructions, see **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)**.
