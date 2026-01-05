use image_analysis::bmp::{grayscale, load_bmp, save_bmp};

fn main() {
    let mut img = load_bmp("public/test.bmp");

    println!("{} x {}", img.width, img.height);
    println!("First pixel RGB: {:?}", &img.data[0..3]);

    grayscale(&mut img);

    save_bmp("out/test.bmp", &mut img);
}
