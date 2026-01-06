use wasm_bindgen::prelude::*;

/// Sobel 边缘检测
/// 输入：RGBA 图像数据（一维数组，格式：[R, G, B, A, R, G, B, A, ...]）
/// 输出：边缘图像数据（相同格式）
#[wasm_bindgen]
pub fn sobel_edge_detection(
    data: &[u8],
    width: u32,
    height: u32,
    threshold: f32,
) -> Vec<u8> {
    let w = width as usize;
    let h = height as usize;
    let mut edge_data = vec![0u8; data.len()];

    // Sobel 算子
    let sobel_x: [[i32; 3]; 3] = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    let sobel_y: [[i32; 3]; 3] = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

    for y in 1..h - 1 {
        for x in 1..w - 1 {
            let mut gx = 0.0;
            let mut gy = 0.0;

            // 应用 Sobel 算子
            for ky in 0..3 {
                for kx in 0..3 {
                    let py = y + ky - 1;
                    let px = x + kx - 1;
                    let idx = (py * w + px) * 4;

                    // 转换为灰度
                    let gray = (data[idx] as f32 + data[idx + 1] as f32 + data[idx + 2] as f32) / 3.0;

                    gx += gray * sobel_x[ky][kx] as f32;
                    gy += gray * sobel_y[ky][kx] as f32;
                }
            }

            // 计算梯度幅值
            let magnitude = (gx * gx + gy * gy).sqrt();
            let value = if magnitude > threshold { 255 } else { 0 };

            let idx = (y * w + x) * 4;
            edge_data[idx] = value;
            edge_data[idx + 1] = value;
            edge_data[idx + 2] = value;
            edge_data[idx + 3] = 255;
        }
    }

    edge_data
}

/// 提取轮廓点
/// 输入：边缘图像数据
/// 输出：轮廓点坐标数组 [x1, y1, x2, y2, ...]
#[wasm_bindgen]
pub fn extract_contour_points(data: &[u8], width: u32, height: u32) -> Vec<u32> {
    let w = width as usize;
    let h = height as usize;
    let mut points = Vec::new();

    for y in 0..h {
        for x in 0..w {
            let idx = (y * w + x) * 4;
            if data[idx] > 128 {
                points.push(x as u32);
                points.push(y as u32);
            }
        }
    }

    points
}

/// Douglas-Peucker 路径简化算法
#[wasm_bindgen]
pub fn simplify_path(points: &[f32], epsilon: f32) -> Vec<f32> {
    if points.len() < 6 {
        // 少于 3 个点（每个点 2 个坐标）
        return points.to_vec();
    }

    let n = points.len() / 2;
    let mut markers = vec![false; n];
    markers[0] = true;
    markers[n - 1] = true;

    // 使用栈实现迭代版本
    let mut stack = vec![(0, n - 1)];

    while let Some((start_idx, end_idx)) = stack.pop() {
        if end_idx - start_idx <= 1 {
            continue;
        }

        let start_x = points[start_idx * 2];
        let start_y = points[start_idx * 2 + 1];
        let end_x = points[end_idx * 2];
        let end_y = points[end_idx * 2 + 1];

        let mut max_distance = 0.0;
        let mut max_index = start_idx;

        // 计算所有中间点到直线的距离
        for i in (start_idx + 1)..end_idx {
            let px = points[i * 2];
            let py = points[i * 2 + 1];
            let distance = perp_distance(px, py, start_x, start_y, end_x, end_y);

            if distance > max_distance {
                max_distance = distance;
                max_index = i;
            }
        }

        if max_distance > epsilon {
            markers[max_index] = true;
            stack.push((start_idx, max_index));
            stack.push((max_index, end_idx));
        }
    }

    // 收集标记的点
    let mut simplified = Vec::new();
    for (i, &marked) in markers.iter().enumerate() {
        if marked {
            simplified.push(points[i * 2]);
            simplified.push(points[i * 2 + 1]);
        }
    }

    simplified
}

/// 计算点到直线的垂直距离
fn perp_distance(px: f32, py: f32, x1: f32, y1: f32, x2: f32, y2: f32) -> f32 {
    let dx = x2 - x1;
    let dy = y2 - y1;
    let norm = (dx * dx + dy * dy).sqrt();

    if norm == 0.0 {
        return ((px - x1) * (px - x1) + (py - y1) * (py - y1)).sqrt();
    }

    ((dy * px - dx * py + x2 * y1 - y2 * x1).abs()) / norm
}

/// 轮廓聚类 - 使用迭代 DFS
#[wasm_bindgen]
pub fn group_contours(points: &[u32], max_distance: f32, max_points: usize) -> JsValue {
    let n = points.len() / 2;

    // 采样（如果点太多）
    let sampled_points: Vec<(f32, f32)> = if n > max_points {
        let step = (n as f32 / max_points as f32).ceil() as usize;
        (0..n)
            .step_by(step)
            .map(|i| (points[i * 2] as f32, points[i * 2 + 1] as f32))
            .collect()
    } else {
        (0..n)
            .map(|i| (points[i * 2] as f32, points[i * 2 + 1] as f32))
            .collect()
    };

    let mut visited = vec![false; sampled_points.len()];
    let mut contours = Vec::new();

    for start_idx in 0..sampled_points.len() {
        if visited[start_idx] {
            continue;
        }

        let contour = iterative_dfs(start_idx, &sampled_points, &mut visited, max_distance);

        if contour.len() > 10 {
            // 过滤太小的轮廓
            contours.push(contour);
        }
    }

    // 转换为 JS 数组
    serde_wasm_bindgen::to_value(&contours).unwrap()
}

/// 迭代 DFS 实现
fn iterative_dfs(
    start_idx: usize,
    points: &[(f32, f32)],
    visited: &mut [bool],
    max_distance: f32,
) -> Vec<(f32, f32)> {
    let mut contour = Vec::new();
    let mut stack = vec![start_idx];
    visited[start_idx] = true;

    while let Some(idx) = stack.pop() {
        contour.push(points[idx]);

        // 查找邻居
        for (i, &point) in points.iter().enumerate() {
            if visited[i] {
                continue;
            }

            let dist = distance(points[idx], point);
            if dist <= max_distance {
                visited[i] = true;
                stack.push(i);
            }
        }

        // 限制单个轮廓的大小
        if contour.len() > 5000 {
            break;
        }
    }

    contour
}

/// 计算两点之间的欧氏距离
fn distance(p1: (f32, f32), p2: (f32, f32)) -> f32 {
    let dx = p2.0 - p1.0;
    let dy = p2.1 - p1.1;
    (dx * dx + dy * dy).sqrt()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sobel_edge_detection() {
        // 创建一个简单的测试图像（3x3，黑白边界）
        let mut data = vec![0u8; 3 * 3 * 4];

        // 上半部分白色，下半部分黑色
        for y in 0..3 {
            for x in 0..3 {
                let idx = (y * 3 + x) * 4;
                if y < 2 {
                    data[idx] = 255; // R
                    data[idx + 1] = 255; // G
                    data[idx + 2] = 255; // B
                }
                data[idx + 3] = 255; // A
            }
        }

        let result = sobel_edge_detection(&data, 3, 3, 50.0);

        // 中间行应该检测到边缘
        let middle_idx = (1 * 3 + 1) * 4;
        assert!(result[middle_idx] > 0);
    }

    #[test]
    fn test_simplify_path() {
        // 创建一条直线上的点
        let points = vec![0.0, 0.0, 1.0, 1.0, 2.0, 2.0, 3.0, 3.0];
        let simplified = simplify_path(&points, 0.5);

        // 应该只保留起点和终点
        assert_eq!(simplified.len(), 4); // 2 个点 * 2 个坐标
        assert_eq!(simplified[0], 0.0);
        assert_eq!(simplified[1], 0.0);
        assert_eq!(simplified[2], 3.0);
        assert_eq!(simplified[3], 3.0);
    }
}
