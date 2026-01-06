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

#[wasm_bindgen]
pub fn recolor_selective(
    data: &mut [u8],
    r: u8,
    g: u8,
    b: u8,
    use_r: bool,
    use_g: bool,
    use_b: bool,
) {
    let len = data.len();
    let mut i = 0;

    while i < len {
        if use_r {
            data[i] = r;
        }
        if use_g {
            data[i + 1] = g;
        }
        if use_b {
            data[i + 2] = b;
        }
        i += 4;
    }
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
