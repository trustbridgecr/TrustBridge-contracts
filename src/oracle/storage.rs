use crate::types::Asset;
use soroban_sdk::{contracttype, Address, Env, Map, Symbol, Vec};

const ADMIN_KEY: &str = "Admin";
const ASSETS_KEY: &str = "Assets";
const DECIMALS_KEY: &str = "Decimals";
const RESOLUTION_KEY: &str = "Resolution";
const LAST_TS_KEY: &str = "LastTs";
const PRICES_KEY: &str = "Prices";

#[contracttype]
#[derive(Clone, Debug)]
pub struct PriceKey {
    pub asset: Asset,
    pub timestamp: u64,
}

fn prices(e: &Env) -> Map<PriceKey, i128> {
    e.storage()
        .instance()
        .get::<Symbol, Map<PriceKey, i128>>(&Symbol::new(e, PRICES_KEY))
        .unwrap_or(Map::new(e))
}

pub fn set_admin(e: &Env, admin: &Address) {
    e.storage()
        .instance()
        .set::<Symbol, Address>(&Symbol::new(e, ADMIN_KEY), admin);
}

pub fn get_admin(e: &Env) -> Address {
    e.storage()
        .instance()
        .get::<Symbol, Address>(&Symbol::new(e, ADMIN_KEY))
        .unwrap()
}

pub fn set_decimals(e: &Env, decimals: &u32) {
    e.storage()
        .instance()
        .set::<Symbol, u32>(&Symbol::new(e, DECIMALS_KEY), decimals);
}

pub fn get_decimals(e: &Env) -> u32 {
    e.storage()
        .instance()
        .get::<Symbol, u32>(&Symbol::new(e, DECIMALS_KEY))
        .unwrap()
}

pub fn set_resolution(e: &Env, resolution: &u32) {
    e.storage()
        .instance()
        .set::<Symbol, u32>(&Symbol::new(e, RESOLUTION_KEY), resolution);
}

pub fn get_resolution(e: &Env) -> u32 {
    e.storage()
        .instance()
        .get::<Symbol, u32>(&Symbol::new(e, RESOLUTION_KEY))
        .unwrap()
}

pub fn set_assets(e: &Env, assets: &Vec<Asset>) {
    e.storage()
        .instance()
        .set::<Symbol, Vec<Asset>>(&Symbol::new(e, ASSETS_KEY), assets);
}

pub fn get_assets(e: &Env) -> Vec<Asset> {
    e.storage()
        .instance()
        .get::<Symbol, Vec<Asset>>(&Symbol::new(e, ASSETS_KEY))
        .unwrap_or(Vec::new(e))
}

pub fn set_last_timestamp(e: &Env, ts: &u64) {
    e.storage()
        .instance()
        .set::<Symbol, u64>(&Symbol::new(e, LAST_TS_KEY), ts);
}

pub fn get_last_timestamp(e: &Env) -> u64 {
    e.storage()
        .instance()
        .get::<Symbol, u64>(&Symbol::new(e, LAST_TS_KEY))
        .unwrap_or(0)
}

pub fn set_price(e: &Env, asset: &Asset, ts: &u64, price: &i128) {
    let mut p = prices(e);
    p.set(
        PriceKey {
            asset: asset.clone(),
            timestamp: *ts,
        },
        *price,
    );
    e.storage()
        .instance()
        .set::<Symbol, Map<PriceKey, i128>>(&Symbol::new(e, PRICES_KEY), &p);
}

pub fn get_price(e: &Env, asset: &Asset, ts: &u64) -> Option<i128> {
    let p = prices(e);
    p.get(PriceKey {
        asset: asset.clone(),
        timestamp: *ts,
    })
}
