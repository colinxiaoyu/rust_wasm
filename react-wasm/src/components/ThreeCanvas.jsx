import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import {
  initWasm,
  detectEdges,
  extractContourPoints,
  simplifyPath,
  groupContours,
  sortContoursBySize
} from '../utils/wasmEdgeDetection'

const ThreeCanvas = forwardRef(({ width = 600, height = 600, onControlsChange, onModelLoaded }, ref) => {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const controlsRef = useRef(null)
  const modelRef = useRef(null)
  const renderTargetRef = useRef(null)
  const gridHelperRef = useRef(null)
  const axesHelperRef = useRef(null)

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    // 渲染到 RenderTarget 并提取轮廓
    extractContours: async () => {
      // 确保 WASM 已初始化
      await initWasm()
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !renderTargetRef.current) {
        console.error('Canvas components not ready')
        return null
      }

      try {
        console.log('开始渲染到 RenderTarget...')

        // 临时隐藏网格和轴辅助线，只渲染模型
        const gridVisible = gridHelperRef.current ? gridHelperRef.current.visible : false
        const axesVisible = axesHelperRef.current ? axesHelperRef.current.visible : false

        if (gridHelperRef.current) gridHelperRef.current.visible = false
        if (axesHelperRef.current) axesHelperRef.current.visible = false

        // 渲染到 RenderTarget
        rendererRef.current.setRenderTarget(renderTargetRef.current)
        rendererRef.current.render(sceneRef.current, cameraRef.current)
        rendererRef.current.setRenderTarget(null)

        // 恢复网格和轴的可见性
        if (gridHelperRef.current) gridHelperRef.current.visible = gridVisible
        if (axesHelperRef.current) axesHelperRef.current.visible = axesVisible

        console.log('读取像素数据...')

        // 读取像素数据
        const pixelBuffer = new Uint8Array(width * height * 4)
        rendererRef.current.readRenderTargetPixels(
          renderTargetRef.current,
          0, 0,
          width, height,
          pixelBuffer
        )

        console.log('创建 ImageData...')

        // 创建 ImageData
        const imageData = new ImageData(new Uint8ClampedArray(pixelBuffer), width, height)

        console.log('执行边缘检测 (Rust WASM)...')

        // 边缘检测（使用 Rust WASM，阈值 50.0）
        const edgeData = detectEdges(imageData, 50.0)

        console.log('提取轮廓点...')

        // 提取轮廓点
        const contourPoints = extractContourPoints(edgeData)
        console.log(`提取到 ${contourPoints.length} 个边缘点`)

        if (contourPoints.length === 0) {
          console.warn('未检测到边缘点')
          return []
        }

        console.log('分组轮廓...')

        // 分组轮廓
        const contours = groupContours(contourPoints, 5)
        console.log(`分组后得到 ${contours.length} 个轮廓`)

        if (contours.length === 0) {
          console.warn('未生成轮廓')
          return []
        }

        console.log('排序轮廓...')

        // 排序（最大的轮廓在前）
        const sortedContours = sortContoursBySize(contours)

        console.log('简化路径...')

        // 简化路径，只保留前 5 个最大的轮廓
        const topContours = sortedContours.slice(0, 5)
        const simplifiedContours = topContours.map((contour, index) => {
          console.log(`简化轮廓 ${index + 1}/${topContours.length}, 点数: ${contour.length}`)
          return simplifyPath(contour, 3.0)
        })

        console.log('轮廓提取完成！')
        return simplifiedContours
      } catch (error) {
        console.error('提取轮廓时出错:', error)
        return null
      }
    },

    // 获取当前渲染的图像数据（用于调试）
    getRenderTargetImage: () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !renderTargetRef.current) {
        return null
      }

      // 临时隐藏网格和轴辅助线
      const gridVisible = gridHelperRef.current ? gridHelperRef.current.visible : false
      const axesVisible = axesHelperRef.current ? axesHelperRef.current.visible : false

      if (gridHelperRef.current) gridHelperRef.current.visible = false
      if (axesHelperRef.current) axesHelperRef.current.visible = false

      rendererRef.current.setRenderTarget(renderTargetRef.current)
      rendererRef.current.render(sceneRef.current, cameraRef.current)
      rendererRef.current.setRenderTarget(null)

      // 恢复网格和轴的可见性
      if (gridHelperRef.current) gridHelperRef.current.visible = gridVisible
      if (axesHelperRef.current) axesHelperRef.current.visible = axesVisible

      const pixelBuffer = new Uint8Array(width * height * 4)
      rendererRef.current.readRenderTargetPixels(
        renderTargetRef.current,
        0, 0,
        width, height,
        pixelBuffer
      )

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      const imageData = new ImageData(new Uint8ClampedArray(pixelBuffer), width, height)
      ctx.putImageData(imageData, 0, 0)

      return canvas.toDataURL('image/png')
    },

    loadModel: (file) => {
      if (!sceneRef.current) {
        alert('场景尚未初始化，请稍后再试')
        return
      }

      const loader = new OBJLoader()
      const url = URL.createObjectURL(file)

      loader.load(
        url,
        (obj) => {
          // 移除旧模型
          if (modelRef.current) {
            sceneRef.current.remove(modelRef.current)
          }

          // 调整模型大小和位置
          const box = new THREE.Box3().setFromObject(obj)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())

          const maxDim = Math.max(size.x, size.y, size.z)
          const scale = 5 / maxDim
          obj.scale.multiplyScalar(scale)

          obj.position.sub(center.multiplyScalar(scale))
          obj.position.y = 0

          sceneRef.current.add(obj)
          modelRef.current = obj

          URL.revokeObjectURL(url)

          // 通知父组件模型已加载
          if (onModelLoaded) {
            onModelLoaded()
          }
        },
        (xhr) => {
          console.log((xhr.loaded / xhr.total * 100) + '% loaded')
        },
        (error) => {
          console.error('Error loading OBJ:', error)
          alert('加载 OBJ 模型失败，请确保文件格式正确')
        }
      )
    },
    captureView: () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return null

      rendererRef.current.render(sceneRef.current, cameraRef.current)
      return rendererRef.current.domElement.toDataURL('image/png')
    },
    getCamera: () => cameraRef.current,
    getControls: () => controlsRef.current,
    getScene: () => sceneRef.current,
    getRenderer: () => rendererRef.current
  }))

  useEffect(() => {
    if (!canvasRef.current) return

    // 创建场景
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a1a)

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    )
    camera.position.set(0, 5, 10)

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvasRef.current,
      preserveDrawingBuffer: true
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)

    // 创建 RenderTarget
    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    })
    renderTargetRef.current = renderTarget

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 5)
    scene.add(directionalLight)

    // 添加网格地面
    const gridHelper = new THREE.GridHelper(20, 20)
    scene.add(gridHelper)
    gridHelperRef.current = gridHelper

    // 添加轴辅助线
    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)
    axesHelperRef.current = axesHelper

    // 添加控制器
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enablePan = true
    controls.panSpeed = 1.0
    controls.screenSpacePanning = true
    controls.enableZoom = true
    controls.zoomSpeed = 1.2
    controls.minDistance = 1
    controls.maxDistance = 100

    // 监听相机变化
    controls.addEventListener('change', () => {
      if (onControlsChange) {
        onControlsChange(camera, controls)
      }
    })

    // 添加示例立方体
    const geometry = new THREE.BoxGeometry(2, 2, 2)
    const material = new THREE.MeshPhongMaterial({ color: 0x3498db })
    const cube = new THREE.Mesh(geometry, material)
    cube.position.y = 1
    scene.add(cube)
    modelRef.current = cube

    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer
    controlsRef.current = controls

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // 清理函数
    return () => {
      renderer.dispose()
      renderTarget.dispose()
      controls.dispose()
    }
  }, [width, height, onControlsChange, onModelLoaded])

  return <canvas ref={canvasRef} className="three-canvas" />
})

ThreeCanvas.displayName = 'ThreeCanvas'

export default ThreeCanvas
