use soroban_sdk::{Address, Env, Symbol};
use crate::Asset;

/// Events emitted by the TrustBridge Oracle contract
pub struct OracleEvents;

impl OracleEvents {
    /// Emitted when the oracle is initialized
    pub fn initialized(e: &Env, admin: Address) {
        e.events().publish(
            (Symbol::new(e, "initialized"),),
            admin
        );
    }

    /// Emitted when a price is set
    pub fn price_set(e: &Env, asset: Asset, price: i128, timestamp: u64) {
        e.events().publish(
            (Symbol::new(e, "price_set"), asset),
            (price, timestamp)
        );
    }

    /// Emitted when admin is changed
    pub fn admin_changed(e: &Env, old_admin: Address, new_admin: Address) {
        e.events().publish(
            (Symbol::new(e, "admin_changed"),),
            (old_admin, new_admin)
        );
    }
} 