#![no_std]

#[cfg(any(test, feature = "testutils"))]
extern crate std;

#[path = "../../src/types.rs"]
pub mod types;

#[path = "../../src/oracle/mod.rs"]
pub mod oracle;
