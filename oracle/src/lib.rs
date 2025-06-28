#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, panic_with_error, Address, Env, Symbol,
};

mod storage;
mod error;
mod events;

pub use error::OracleError;
pub use events::OracleEvents;

// SEP-40 PriceData structure
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PriceData {
    pub price: i128,      // Price with decimals precision
    pub timestamp: u64,   // Unix timestamp
}

// Asset representation for SEP-40 compatibility
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Asset {
    Stellar(Address),     // Stellar asset contract address
    Other(Symbol),        // Other asset identifier
}

/// TrustBridge Oracle Contract
/// 
/// Implements SEP-40 Oracle interface for providing price feeds
/// to Blend pools and other DeFi protocols on Stellar.
#[contract]
pub struct TrustBridgeOracle;

/// Oracle trait defining the public interface
pub trait OracleTrait {
    /// Initialize the oracle contract with an admin
    /// 
    /// ### Arguments
    /// * `admin` - The administrator address who can set prices
    fn init(e: Env, admin: Address);

    /// Set the price for a given asset
    /// 
    /// ### Arguments
    /// * `asset` - The asset to set price for
    /// * `price` - The price in 7-decimal format (e.g., 10000000 = $1.0000000)
    fn set_price(e: Env, asset: Asset, price: i128);

    /// Get the last price for an asset
    /// 
    /// ### Arguments
    /// * `asset` - The asset to get price for
    /// 
    /// ### Returns
    /// * `Option<PriceData>` - The price data or None if not found
    fn lastprice(e: Env, asset: Asset) -> Option<PriceData>;

    /// Get the number of decimals used by the oracle
    /// 
    /// ### Returns
    /// * `u32` - Number of decimals (always 7 for TrustBridge)
    fn decimals(e: Env) -> u32;

    /// Set multiple prices in a single transaction (admin only)
    /// 
    /// ### Arguments
    /// * `assets` - Vector of assets
    /// * `prices` - Vector of corresponding prices
    fn set_prices(e: Env, assets: soroban_sdk::Vec<Asset>, prices: soroban_sdk::Vec<i128>);

    /// Get the admin address
    /// 
    /// ### Returns
    /// * `Address` - The current admin address
    fn admin(e: Env) -> Address;

    /// Transfer admin role to a new address (admin only)
    /// 
    /// ### Arguments
    /// * `new_admin` - The new admin address
    fn set_admin(e: Env, new_admin: Address);
}

#[contractimpl]
impl OracleTrait for TrustBridgeOracle {
    fn init(e: Env, admin: Address) {
        if storage::has_admin(&e) {
            panic_with_error!(&e, OracleError::AlreadyInitialized);
        }
        
        storage::set_admin(&e, &admin);
        
        OracleEvents::initialized(&e, admin);
    }

    fn set_price(e: Env, asset: Asset, price: i128) {
        let admin = storage::get_admin(&e);
        admin.require_auth();

        if price <= 0 {
            panic_with_error!(&e, OracleError::InvalidPrice);
        }

        let price_data = PriceData {
            price,
            timestamp: e.ledger().timestamp(),
        };

        storage::set_price(&e, &asset, &price_data);
        
        OracleEvents::price_set(&e, asset, price, price_data.timestamp);
    }

    fn lastprice(e: Env, asset: Asset) -> Option<PriceData> {
        storage::get_price(&e, &asset)
    }

    fn decimals(_e: Env) -> u32 {
        7 // TrustBridge Oracle uses 7 decimals
    }

    fn set_prices(e: Env, assets: soroban_sdk::Vec<Asset>, prices: soroban_sdk::Vec<i128>) {
        let admin = storage::get_admin(&e);
        admin.require_auth();

        if assets.len() != prices.len() {
            panic_with_error!(&e, OracleError::InvalidInput);
        }

        let timestamp = e.ledger().timestamp();

        for i in 0..assets.len() {
            let asset = assets.get(i).unwrap();
            let price = prices.get(i).unwrap();

            if price <= 0 {
                panic_with_error!(&e, OracleError::InvalidPrice);
            }

            let price_data = PriceData {
                price,
                timestamp,
            };

            storage::set_price(&e, &asset, &price_data);
            OracleEvents::price_set(&e, asset, price, timestamp);
        }
    }

    fn admin(e: Env) -> Address {
        storage::get_admin(&e)
    }

    fn set_admin(e: Env, new_admin: Address) {
        let current_admin = storage::get_admin(&e);
        current_admin.require_auth();

        storage::set_admin(&e, &new_admin);
        
        OracleEvents::admin_changed(&e, current_admin, new_admin);
    }
}

#[cfg(test)]
mod test; 