struct Uniforms {
  width: u32,
  height: u32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var inputTexture: texture_2d<f32>;
@group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;

fn rgb_to_gray(color: vec3<f32>) -> f32 {
  return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
}

fn sobel_edge_detection(x: i32, y: i32) -> f32 {
  let sobel_x = array<array<f32, 3>, 3>(
    array<f32,3>(-1.0, 0.0, 1.0),
    array<f32,3>(-2.0, 0.0, 2.0),
    array<f32,3>(-1.0, 0.0, 1.0)
  );
  let sobel_y = array<array<f32, 3>, 3>(
    array<f32,3>(-1.0,-2.0,-1.0),
    array<f32,3>(0.0,0.0,0.0),
    array<f32,3>(1.0,2.0,1.0)
  );

  var gx: f32 = 0.0;
  var gy: f32 = 0.0;

  for (var i: i32 = -1; i <= 1; i = i + 1) {
    for (var j: i32 = -1; j <= 1; j = j + 1) {
      let px = clamp(x + i, 0, i32(uniforms.width) - 1);
      let py = clamp(y + j, 0, i32(uniforms.height) - 1);
      let color = textureLoad(inputTexture, vec2<i32>(px, py), 0);
      let gray = rgb_to_gray(color.rgb);

      gx = gx + gray * sobel_x[i + 1][j + 1];
      gy = gy + gray * sobel_y[i + 1][j + 1];
    }
  }

  // 最大可能值是 1020，归一化到 0-1
  let magnitude = abs(gx) + abs(gy);
  return clamp(magnitude / 1020.0, 0.0, 1.0);
}

@compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let x = i32(gid.x);
  let y = i32(gid.y);

  if (x >= i32(uniforms.width) || y >= i32(uniforms.height)) {
    return;
  }

  let edge = sobel_edge_detection(x, y);
  let color = vec4<f32>(edge, edge, edge, 1.0);
  textureStore(outputTexture, vec2<i32>(x,y), color);
}
