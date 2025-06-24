use soroban_sdk::{contract, contractimpl, Address, Env, Vec};

use crate::types::{Asset, PriceData};
mod storage;
#[contract]
pub struct CustomOracle;

#[contractimpl]
impl CustomOracle {
    pub fn __constructor(
        e: Env,
        admin: Address,
        assets: Vec<Asset>,
        decimals: u32,
        resolution: u32,
    ) {
        storage::set_admin(&e, &admin);
        storage::set_assets(&e, &assets);
        storage::set_decimals(&e, &decimals);
        storage::set_resolution(&e, &resolution);
        storage::set_last_timestamp(&e, &0u64);
    }

    pub fn set_price(e: Env, prices: Vec<i128>, timestamp: u64) {
        storage::get_admin(&e).require_auth();
        let assets = storage::get_assets(&e);
        if assets.len() != prices.len() {
            return;
        }
        for (asset, price) in assets.iter().zip(prices.iter()) {
            storage::set_price(&e, &asset, &timestamp, &price);
        }
        storage::set_last_timestamp(&e, &timestamp);
    }

    pub fn resolution(e: Env) -> u32 {
        storage::get_resolution(&e)
    }

    pub fn decimals(e: Env) -> u32 {
        storage::get_decimals(&e)
    }

    pub fn last_timestamp(e: Env) -> u64 {
        storage::get_last_timestamp(&e)
    }

    pub fn price(e: Env, asset: Asset, timestamp: u64) -> Option<PriceData> {
        if let Some(p) = storage::get_price(&e, &asset, &timestamp) {
            Some(PriceData {
                price: p,
                timestamp,
            })
        } else {
            None
        }
    }
}
