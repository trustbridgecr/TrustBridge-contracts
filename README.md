# TrustBridge Protocol

This repository contains the smart contracts for an implementation of the TrustBridge Protocol. TrustBridge is a universal liquidity protocol primitive that enables the permissionless creation of lending pools.

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
