use soroban_sdk::{Address, Env, Symbol};
use crate::{Asset, PriceData};

// Storage key constants
const ADMIN_KEY: &str = "admin";
const PRICE_KEY: &str = "price";

// TTL constants (in ledgers)
const ONE_DAY_LEDGERS: u32 = 17280; // Assuming 5 seconds per ledger
const INSTANCE_TTL: u32 = ONE_DAY_LEDGERS * 30; // 30 days
const INSTANCE_BUMP: u32 = INSTANCE_TTL + ONE_DAY_LEDGERS; // 31 days

/// Check if admin is set
pub fn has_admin(e: &Env) -> bool {
    e.storage()
        .instance()
        .has(&Symbol::new(e, ADMIN_KEY))
}

/// Get the admin address
pub fn get_admin(e: &Env) -> Address {
    e.storage()
        .instance()
        .extend_ttl(INSTANCE_TTL, INSTANCE_BUMP);
    
    e.storage()
        .instance()
        .get(&Symbol::new(e, ADMIN_KEY))
        .unwrap()
}

/// Set the admin address
pub fn set_admin(e: &Env, admin: &Address) {
    e.storage()
        .instance()
        .set(&Symbol::new(e, ADMIN_KEY), admin);
    
    e.storage()
        .instance()
        .extend_ttl(INSTANCE_TTL, INSTANCE_BUMP);
}

/// Set price data for an asset
pub fn set_price(e: &Env, asset: &Asset, price_data: &PriceData) {
    let key = (Symbol::new(e, PRICE_KEY), asset.clone());
    
    e.storage()
        .persistent()
        .set(&key, price_data);
    
    // Extend TTL for price data (prices should live longer)
    let price_ttl = ONE_DAY_LEDGERS * 90; // 90 days
    let price_bump = price_ttl + ONE_DAY_LEDGERS * 10; // 100 days
    
    e.storage()
        .persistent()
        .extend_ttl(&key, price_ttl, price_bump);
}

/// Get price data for an asset
pub fn get_price(e: &Env, asset: &Asset) -> Option<PriceData> {
    let key = (Symbol::new(e, PRICE_KEY), asset.clone());
    
    if let Some(price_data) = e.storage().persistent().get::<(Symbol, Asset), PriceData>(&key) {
        // Extend TTL when accessing price data
        let price_ttl = ONE_DAY_LEDGERS * 90; // 90 days
        let price_bump = price_ttl + ONE_DAY_LEDGERS * 10; // 100 days
        
        e.storage()
            .persistent()
            .extend_ttl(&key, price_ttl, price_bump);
        
        Some(price_data)
    } else {
        None
    }
} 