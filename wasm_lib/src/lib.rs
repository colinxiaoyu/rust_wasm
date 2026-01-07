use wasm_bindgen::prelude::*;
use web_sys::console;

// Export edge detection module
pub mod edge_detection;

// Re-export the main edge detection functions
pub use edge_detection::{
    extract_contour_points, group_contours, simplify_path, sobel_edge_detection,
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

/// data: RGBA 像素数组
/// width, height: 图像尺寸
#[wasm_bindgen]
pub fn grayscale_sobel(data: &mut [u8], width: u32, height: u32) {
    let w = width as usize;
    let h = height as usize;

    // 1️⃣ 先生成灰度图（f32，精度够用）
    let mut gray = vec![0f32; w * h];

    for y in 0..h {
        for x in 0..w {
            let i = (y * w + x) * 4;
            let r = data[i] as f32;
            let g = data[i + 1] as f32;
            let b = data[i + 2] as f32;

            // ITU-R BT.601
            gray[y * w + x] = 0.299 * r + 0.587 * g + 0.114 * b;
        }
    }

    // 2️⃣ Sobel 卷积（跳过边界）
    for y in 1..h - 1 {
        for x in 1..w - 1 {
            let idx = y * w + x;

            let gx = -gray[(y - 1) * w + (x - 1)] + gray[(y - 1) * w + (x + 1)]
                - 2.0 * gray[y * w + (x - 1)]
                + 2.0 * gray[y * w + (x + 1)]
                - gray[(y + 1) * w + (x - 1)]
                + gray[(y + 1) * w + (x + 1)];

            let gy = -gray[(y - 1) * w + (x - 1)]
                - 2.0 * gray[(y - 1) * w + x]
                - gray[(y - 1) * w + (x + 1)]
                + gray[(y + 1) * w + (x - 1)]
                + 2.0 * gray[(y + 1) * w + x]
                + gray[(y + 1) * w + (x + 1)];

            // 工程中常用近似（比 sqrt 快）
            let magnitude = (gx.abs() + gy.abs()).min(255.0);

            let out = (idx * 4) as usize;
            let v = magnitude as u8;

            data[out] = v;
            data[out + 1] = v;
            data[out + 2] = v;
            // alpha 不动
        }
    }
}
