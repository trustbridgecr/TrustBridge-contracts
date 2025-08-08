use crate::{
    errors::PoolFactoryError,
    events::PoolFactoryEvents,
    storage::{self, PoolInitMeta},
};
use soroban_sdk::{
    contract, contractclient, contractimpl, panic_with_error, Address, Bytes, BytesN, Env, IntoVal,
    String, symbol_short, vec, Vec,
};

const SCALAR_7: u32 = 1_0000000;

#[contract]
pub struct PoolFactoryContract;

#[contractclient(name = "PoolFactoryClient")]
pub trait PoolFactory {
    /// Deploys and initializes a lending pool
    ///
    /// ### Arguments
    /// * `admin` - The admin address for the pool
    /// * `name` - The name of the pool
    /// * `salt` - The salt for the pool address
    /// * `oracle` - The oracle address for the pool
    /// * `backstop_take_rate` - The backstop take rate for the pool (7 decimals)
    /// * `max_positions` - The maximum user positions supported by the pool
    /// * `min_collateral` - The minimum collateral required for a borrow position (oracle decimals)
    fn deploy(
        e: Env,
        admin: Address,
        name: String,
        salt: BytesN<32>,
        oracle: Address,
        backstop_take_rate: u32,
        max_positions: u32,
        min_collateral: i128,
    ) -> Address;

    /// Checks if contract address was deployed by the factory
    ///
    /// Returns true if pool was deployed by factory and false otherwise
    ///
    /// ### Arguments
    /// * `pool_id` - The contract address to be checked
    fn is_pool(e: Env, pool_id: Address) -> bool;
}

#[contractimpl]
impl PoolFactoryContract {
    /// Construct the pool factory contract
    ///
    /// ### Arguments
    /// * `pool_init_meta` - The pool initialization metadata    
    pub fn __constructor(e: Env, pool_init_meta: PoolInitMeta) {
        storage::set_pool_init_meta(&e, &pool_init_meta);
    }
}

#[contractimpl]
impl PoolFactory for PoolFactoryContract {
    fn deploy(
        e: Env,
        admin: Address,
        name: String,
        salt: BytesN<32>,
        oracle: Address,
        backstop_take_rate: u32,
        max_positions: u32,
        min_collateral: i128,
    ) -> Address {
        admin.require_auth();
        storage::extend_instance(&e);
        let pool_init_meta = storage::get_pool_init_meta(&e);

        // verify backstop take rate is within [0,1) with 7 decimals
        if backstop_take_rate >= SCALAR_7 {
            panic_with_error!(&e, PoolFactoryError::InvalidPoolInitArgs);
        }

        // verify max positions is at least 2 and less than 64
        // pools have a max of 30 reserves, so 60 is the max number of positions
        if max_positions < 2 || max_positions > 60 {
            panic_with_error!(&e, PoolFactoryError::InvalidPoolInitArgs);
        }

        // verify max positions is at least 2 and less than 64
        // pools have a max of 50 reserves, so 100 is the max number of positions
        if min_collateral < 0 {
            panic_with_error!(&e, PoolFactoryError::InvalidPoolInitArgs);
        }

        let mut as_u8s: [u8; 56] = [0; 56];
        admin.to_string().copy_into_slice(&mut as_u8s);
        let mut salt_as_bytes: Bytes = salt.into_val(&e);
        salt_as_bytes.extend_from_array(&as_u8s);
        let new_salt = e.crypto().keccak256(&salt_as_bytes);

        let pool_address = e.deployer().with_current_contract(new_salt).deploy(
            pool_init_meta.pool_hash
        );

        // Initialize the pool after deployment
        let mut init_args = vec![&e];
        init_args.push_back(admin.clone().into_val(&e));
        init_args.push_back(name.clone().into_val(&e));
        init_args.push_back(oracle.clone().into_val(&e));
        init_args.push_back(backstop_take_rate.into_val(&e));
        init_args.push_back(max_positions.into_val(&e));
        init_args.push_back(min_collateral.into_val(&e));
        init_args.push_back(pool_init_meta.backstop.clone().into_val(&e));
        init_args.push_back(pool_init_meta.blnd_id.clone().into_val(&e));
        
        // Call init function on the deployed pool
        e.invoke_contract::<()>(&pool_address, &symbol_short!("init"), init_args);

        storage::set_deployed(&e, &pool_address);

        PoolFactoryEvents::deploy(&e, pool_address.clone());
        pool_address
    }

    fn is_pool(e: Env, pool_address: Address) -> bool {
        storage::extend_instance(&e);
        storage::is_deployed(&e, &pool_address)
    }
}
