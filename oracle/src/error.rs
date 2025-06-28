use soroban_sdk::contracterror;

/// Errors for the TrustBridge Oracle contract
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum OracleError {
    /// Contract has already been initialized
    AlreadyInitialized = 1,
    
    /// Caller is not authorized to perform this action
    Unauthorized = 2,
    
    /// Invalid price provided (must be > 0)
    InvalidPrice = 3,
    
    /// Invalid input parameters
    InvalidInput = 4,
    
    /// Price not found for the requested asset
    PriceNotFound = 5,
    
    /// Contract is not initialized
    NotInitialized = 6,
} 