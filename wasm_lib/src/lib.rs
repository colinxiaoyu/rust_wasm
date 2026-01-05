use wasm_bindgen::prelude::*;
use web_sys::console;

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    console::log_1(&"Rust function called from JavaScript!".into());
    format!("Hello, {}! This message is from Rust + WebAssembly.", name)
}

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    console::log_1(&format!("Adding {} + {}", a, b).into());
    a + b
}

#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u32 {
    if n <= 1 {
        n
    } else {
        fibonacci(n - 1) + fibonacci(n - 2)
    }
}
