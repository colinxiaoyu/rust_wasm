use std::fs;

pub struct BMPImage {
    pub width: usize,
    pub height: usize,
    pub data: Vec<u8>,
    pub header: Vec<u8>,     // 文件头 + 信息头
    pub pixel_offset: usize, // 像素起始位置
}

pub fn load_bmp(path: &str) -> BMPImage {
    let bytes = fs::read(path).expect("read file failed");

    // 1. 校验 BMP
    if &bytes[0..2] != b"BM" {
        panic!("Not a BMP file");
    }

    // 2. 像素数据偏移
    let pixel_offset = u32::from_le_bytes(bytes[10..14].try_into().unwrap()) as usize;

    // 3. 宽高
    let width = i32::from_le_bytes(bytes[18..22].try_into().unwrap()) as usize;
    let height = i32::from_le_bytes(bytes[22..26].try_into().unwrap()) as usize;

    // 4. 位深
    let bpp = u16::from_le_bytes(bytes[28..30].try_into().unwrap());

    if bpp != 24 {
        panic!("Only support 24-bit BMP");
    }

    // 5. 每行 padding 计算
    let row_bytes = width * 3;
    let padding = (4 - (row_bytes % 4)) % 4;

    let mut data = vec![0u8; width * height * 3];

    // 6. 读取像素（BMP 是 bottom-up）
    let mut src = pixel_offset;

    for y in 0..height {
        let dst_y = height - 1 - y; // 翻转
        for x in 0..width {
            let b = bytes[src];
            let g = bytes[src + 1];
            let r = bytes[src + 2];

            let dst = (dst_y * width + x) * 3;
            data[dst] = r;
            data[dst + 1] = g;
            data[dst + 2] = b;

            src += 3;
        }
        src += padding;
    }

    BMPImage {
        width,
        height,
        data,
        header: bytes[..pixel_offset].to_vec(),
        pixel_offset,
    }
}

pub fn grayscale(img: &mut BMPImage) {
    for i in (0..img.data.len()).step_by(3) {
        let r = img.data[i] as u16;
        let g = img.data[i + 1] as u16;
        let b = img.data[i + 2] as u16;

        let gray = ((r + g + b) / 3) as u8;
        img.data[i] = gray;
        img.data[i + 1] = gray;
        img.data[i + 2] = gray;
    }
}

pub fn invert(img: &mut BMPImage) {
    for v in img.data.iter_mut() {
        *v = 255 - *v
    }
}

pub fn save_bmp(path: &str, img: &BMPImage) {
    let width = img.width;
    let height = img.height;
    let row_bytes = width * 3;
    let padding = (4 - (row_bytes % 4)) % 4;

    let mut file_bytes = img.header.clone();

    for y in 0..height {
        let src_y = height - 1 - y;
        for x in 0..width {
            let src = (src_y * width + x) * 3;
            let r = img.data[src];
            let g = img.data[src + 1];
            let b = img.data[src + 2];
            file_bytes.push(b);
            file_bytes.push(g);
            file_bytes.push(r);
        }
        for _ in 0..padding {
            file_bytes.push(0);
        }
    }
    fs::write(path, &file_bytes).expect("write file failed");
}
