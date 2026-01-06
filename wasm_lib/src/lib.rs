use wasm_bindgen::prelude::*;
use web_sys::console;

// Export edge detection module
pub mod edge_detection;

// Re-export the main edge detection functions
pub use edge_detection::{
    sobel_edge_detection,
    extract_contour_points,
    simplify_path,
    group_contours,
};

// Keep existing utility functions for backwards compatibility
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
pub fn grayscale(data: &mut [u8]) {
    let len = data.len();
    let mut i = 0;
    while i < len {
        let r = data[i] as f32;
        let g = data[i + 1] as f32;
        let b = data[i + 2] as f32;

        let gray = (0.299 * r + 0.587 * g + 0.114 * b).round() as u8;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;

        i += 4;
    }
}
