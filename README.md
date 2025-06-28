# TrustBridge Protocol

This repository contains the smart contracts for an implementation of the TrustBridge Protocol. TrustBridge is a universal liquidity protocol primitive that enables the permissionless creation of lending pools.

## 🚀 Oracle Deployment Status

✅ **TrustBridge Oracle is LIVE on Stellar Testnet!**

- **Oracle Contract**: `CBCIZHUC42CKOZHKKEYMSXVVY24ZK2EKEUU6NFGQS5YFG7GAMEU5L32M`
- **TBRG Token Contract**: `CAAUAE53WKWR4X2BRCHXNUTDJGXTOBMHMK3KFTAPEUBA7MJEQBPWVWQU`
- **Supported Assets**: USDC, XLM, TBRG
- **Status**: Fully operational with live price feeds

📋 **[View Complete Deployment Details](./ORACLE_DEPLOYMENT_STATUS.md)**

## Documentation

To learn more about the TrustBridge Protocol, visit the docs:

- [Blend Docs](https://docs.blend.capital/)

## Audits

Conducted audits can be viewed in the `audits` folder.

## Getting Started

Build the contracts with:

```
make
```

Run all unit tests and the integration test suite with:

```
make test
```

## Deployment

The `make` command creates an optimized and un-optimized set of WASM contracts. It's recommended to use the optimized version if deploying to a network.

These can be found at the path:

```
target/wasm32-unknown-unknown/optimized
```

For help with deployment to a network, please visit the [Blend Utils](https://github.com/blend-capital/blend-utils) repo.

## Contributing

Notes for contributors:

- Under no circumstances should the "overflow-checks" flag be removed otherwise contract math will become unsafe
