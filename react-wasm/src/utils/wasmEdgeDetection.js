/**
 * WebAssembly 边缘检测工具包装器
 * 使用 Rust WebAssembly 实现高性能边缘检测
 */

import init, {
  sobel_edge_detection,
  extract_contour_points as wasm_extract_contour_points,
  simplify_path as wasm_simplify_path,
  group_contours as wasm_group_contours
} from '../wasm_pkg/wasm_lib.js'

let wasmInitialized = false

/**
 * 初始化 WASM 模块
 */
export async function initWasm() {
  if (!wasmInitialized) {
    try {
      await init()
      wasmInitialized = true
      console.log('✅ WASM module initialized')
    } catch (error) {
      console.error('❌ Failed to initialize WASM:', error)
      throw error
    }
  }
}

/**
 * 从图像数据中检测边缘（使用 Rust Sobel 算子）
 * @param {ImageData} imageData - Canvas ImageData
 * @param {number} threshold - 边缘检测阈值 (default: 50.0)
 * @returns {ImageData} 边缘图像数据
 */
export function detectEdges(imageData, threshold = 50.0) {
  const width = imageData.width
  const height = imageData.height
  const data = imageData.data

  console.log(`执行 Rust WASM 边缘检测: ${width}x${height}, 阈值=${threshold}`)

  // 调用 Rust WASM 函数
  const edgeData = sobel_edge_detection(data, width, height, threshold)

  return new ImageData(new Uint8ClampedArray(edgeData), width, height)
}

/**
 * 提取轮廓点
 * @param {ImageData} edgeData - 边缘图像数据
 * @returns {Array<{x: number, y: number}>} 轮廓点数组
 */
export function extractContourPoints(edgeData) {
  const width = edgeData.width
  const height = edgeData.height
  const data = edgeData.data

  console.log(`提取轮廓点: ${width}x${height}`)

  // 调用 Rust WASM 函数，返回 [x1, y1, x2, y2, ...]
  const pointsArray = wasm_extract_contour_points(data, width, height)

  // 转换为 {x, y} 对象数组
  const points = []
  for (let i = 0; i < pointsArray.length; i += 2) {
    points.push({
      x: pointsArray[i],
      y: pointsArray[i + 1]
    })
  }

  console.log(`✅ 提取到 ${points.length} 个轮廓点`)
  return points
}

/**
 * 轮廓点转换为路径（Douglas-Peucker 简化算法）
 * @param {Array<{x: number, y: number}>} points - 轮廓点
 * @param {number} epsilon - 简化容差 (default: 3.0)
 * @returns {Array<{x: number, y: number}>} 简化后的路径点
 */
export function simplifyPath(points, epsilon = 3.0) {
  if (points.length < 3) return points

  console.log(`简化路径: ${points.length} 个点, epsilon=${epsilon}`)

  // 转换为 [x1, y1, x2, y2, ...] 格式
  const flatPoints = new Float32Array(points.length * 2)
  for (let i = 0; i < points.length; i++) {
    flatPoints[i * 2] = points[i].x
    flatPoints[i * 2 + 1] = points[i].y
  }

  // 调用 Rust WASM 函数
  const simplifiedArray = wasm_simplify_path(flatPoints, epsilon)

  // 转换回 {x, y} 对象数组
  const simplified = []
  for (let i = 0; i < simplifiedArray.length; i += 2) {
    simplified.push({
      x: simplifiedArray[i],
      y: simplifiedArray[i + 1]
    })
  }

  console.log(`✅ 简化后: ${simplified.length} 个点`)
  return simplified
}

/**
 * 对轮廓点进行聚类分组（按连通性）
 * @param {Array<{x: number, y: number}>} points - 轮廓点
 * @param {number} maxDistance - 最大连接距离 (default: 5.0)
 * @param {number} maxPoints - 最大处理点数 (default: 10000)
 * @returns {Array<Array<{x: number, y: number}>>} 分组后的轮廓
 */
export function groupContours(points, maxDistance = 5.0, maxPoints = 10000) {
  if (points.length === 0) return []

  console.log(`分组轮廓: ${points.length} 个点, maxDistance=${maxDistance}`)

  // 转换为 [x1, y1, x2, y2, ...] 格式 (使用 u32)
  const flatPoints = new Uint32Array(points.length * 2)
  for (let i = 0; i < points.length; i++) {
    flatPoints[i * 2] = points[i].x
    flatPoints[i * 2 + 1] = points[i].y
  }

  // 调用 Rust WASM 函数
  const contoursData = wasm_group_contours(flatPoints, maxDistance, maxPoints)

  // contoursData 是嵌套数组: [[[x1, y1], [x2, y2], ...], ...]
  const contours = contoursData.map(contour =>
    contour.map(([x, y]) => ({ x, y }))
  )

  console.log(`✅ 分组后得到 ${contours.length} 个轮廓`)
  return contours
}

/**
 * 对轮廓进行排序（按周长从大到小）
 * @param {Array<Array<{x: number, y: number}>>} contours - 轮廓数组
 * @returns {Array<Array<{x: number, y: number}>>} 排序后的轮廓
 */
export function sortContoursBySize(contours) {
  return contours.sort((a, b) => {
    const perimeterA = calculatePerimeter(a)
    const perimeterB = calculatePerimeter(b)
    return perimeterB - perimeterA
  })
}

function calculatePerimeter(points) {
  let perimeter = 0
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x
    const dy = points[i + 1].y - points[i].y
    perimeter += Math.sqrt(dx * dx + dy * dy)
  }
  return perimeter
}
