#![no_std]

#[cfg(any(test, feature = "testutils"))]
extern crate std;

#[path = "../types.rs"]
mod types;

#[path = "../oracle/mod.rs"]
pub mod oracle;
