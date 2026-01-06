import { useRef, useState } from 'react'
import ThreeCanvas from '../components/ThreeCanvas'
import FabricCanvas from '../components/FabricCanvas'
import './Annotation3D.scss'

export default function Annotation3D() {
  const threeCanvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)

  const [mode, setMode] = useState('view') // view, annotate
  const [autoExtract, setAutoExtract] = useState(true) // 自动提取轮廓

  // 处理文件上传
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.name.toLowerCase().endsWith('.obj')) {
      threeCanvasRef.current?.loadModel(file)
    } else {
      alert('请选择 OBJ 格式的3D模型文件')
    }
  }

  // 模型加载完成后的回调
  const handleModelLoaded = () => {
    console.log('模型加载完成')
    if (autoExtract) {
      // 延迟提取轮廓，确保模型已完全渲染
      setTimeout(() => {
        extractAndDrawContours()
      }, 100)
    }
  }

  // 提取并绘制轮廓
  const extractAndDrawContours = async () => {
    if (!threeCanvasRef.current || !fabricCanvasRef.current) {
      console.error('Canvas refs not ready')
      return
    }

    try {
      console.log('========== 开始提取轮廓 (Rust WASM) ==========')
      const startTime = performance.now()

      const contours = await threeCanvasRef.current.extractContours()

      const endTime = performance.now()
      console.log(`轮廓提取耗时: ${(endTime - startTime).toFixed(2)}ms`)

      if (contours && contours.length > 0) {
        console.log(`✅ 成功提取 ${contours.length} 个轮廓`)
        contours.forEach((contour, i) => {
          console.log(`  轮廓 ${i + 1}: ${contour.length} 个点`)
        })
        fabricCanvasRef.current.drawContourPaths(contours)
      } else if (contours && contours.length === 0) {
        console.warn('⚠️ 未提取到轮廓（可能是阈值太高或模型太简单）')
      } else {
        console.error('❌ 轮廓提取失败')
      }

      console.log('========================================')
    } catch (error) {
      console.error('❌ 提取轮廓时发生错误:', error)
    }
  }

  // Three.js 控制器变化时的回调
  const handleControlsChange = () => {
    if (autoExtract) {
      // 使用防抖，避免频繁更新
      clearTimeout(window.contourUpdateTimeout)
      window.contourUpdateTimeout = setTimeout(() => {
        extractAndDrawContours()
      }, 100)
    }
  }

  // 清除轮廓
  const clearContours = () => {
    fabricCanvasRef.current?.clearContours()
  }

  // 添加文本标注
  const addTextAnnotation = () => {
    fabricCanvasRef.current?.addText()
  }

  // 添加箭头标注
  const addArrowAnnotation = () => {
    fabricCanvasRef.current?.addArrow()
  }

  // 添加矩形标注
  const addRectAnnotation = () => {
    fabricCanvasRef.current?.addRect()
  }

  // 添加圆形标注
  const addCircleAnnotation = () => {
    fabricCanvasRef.current?.addCircle()
  }

  // 删除选中的对象
  const deleteSelected = () => {
    fabricCanvasRef.current?.deleteSelected()
  }

  // 清空所有对象
  const clearAll = () => {
    fabricCanvasRef.current?.clearAll()
  }

  // 捕获当前视图
  const captureView = () => {
    const imageData = threeCanvasRef.current?.captureView()
    if (imageData) {
      const link = document.createElement('a')
      link.href = imageData
      link.download = `3d-view-${Date.now()}.png`
      link.click()
    }
  }

  // 查看 RenderTarget 图像（调试用）
  const viewRenderTarget = () => {
    const imageData = threeCanvasRef.current?.getRenderTargetImage()
    if (imageData) {
      const win = window.open()
      win.document.write(`<img src="${imageData}" />`)
    }
  }

  return (
    <div className="annotation3d-page">

      <div className="toolbar">
        <div className="toolbar-section">
          <label className="file-upload-btn">
            📁 加载 OBJ 模型
            <input
              type="file"
              accept=".obj"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div className="toolbar-section">
          <button
            className={mode === 'view' ? 'active' : ''}
            onClick={() => setMode('view')}
          >
            👁️ 查看模式
          </button>
          <button
            className={mode === 'annotate' ? 'active' : ''}
            onClick={() => setMode('annotate')}
          >
            ✏️ 标注模式
          </button>
        </div>

        <div className="toolbar-section">
          <button
            className={autoExtract ? 'active' : ''}
            onClick={() => setAutoExtract(!autoExtract)}
          >
            {autoExtract ? '🔄 自动提取' : '⏸️ 手动提取'}
          </button>
          <button onClick={extractAndDrawContours}>
            🔍 提取轮廓
          </button>
          <button onClick={clearContours}>
            🧹 清除轮廓
          </button>
        </div>

        {mode === 'annotate' && (
          <>
            <div className="toolbar-section">
              <button onClick={addTextAnnotation}>📝 文本</button>
              <button onClick={addRectAnnotation}>⬜ 矩形</button>
              <button onClick={addCircleAnnotation}>⭕ 圆形</button>
              <button onClick={addArrowAnnotation}>➡️ 箭头</button>
            </div>

            <div className="toolbar-section">
              <button onClick={deleteSelected} className="delete-btn">
                🗑️ 删除选中
              </button>
              <button onClick={clearAll} className="clear-btn">
                🧹 清空全部
              </button>
            </div>
          </>
        )}

        <div className="toolbar-section">
          <button onClick={captureView}>📸 捕获视图</button>
          <button onClick={viewRenderTarget}>🔬 查看渲染目标</button>
        </div>
      </div>

      <div className="canvas-wrapper">
        <div className="canvas-container">
          <ThreeCanvas
            ref={threeCanvasRef}
            width={600}
            height={600}
            onControlsChange={handleControlsChange}
            onModelLoaded={handleModelLoaded}
          />
          <div className="canvas-label">Three.js 3D 视图</div>
        </div>

        <div className="canvas-container">
          <FabricCanvas
            ref={fabricCanvasRef}
            width={600}
            height={600}
            mode={mode}
          />
          <div className="canvas-label">Fabric.js 轮廓视图</div>
        </div>
      </div>

      <div className="info-panel">
        <h3>使用说明</h3>
        <ul>
          <li>点击「加载 OBJ 模型」上传 3D 模型文件</li>
          <li>加载后自动使用 Sobel 边缘检测提取模型轮廓</li>
          <li>轮廓以矢量路径形式显示在右侧，可编辑</li>
          <li>旋转 3D 模型时，轮廓会实时更新（自动提取模式）</li>
          <li>切换到「标注模式」后可以编辑轮廓和添加标注</li>
          <li>绿色轮廓是主轮廓，黄色是次要轮廓</li>
          <li>使用「查看渲染目标」可以调试 RenderTarget 输出</li>
        </ul>

        <h3>技术特性</h3>
        <ul>
          <li>✅ Three.js RenderTarget 离屏渲染</li>
          <li>✅ Sobel 算子边缘检测</li>
          <li>✅ Douglas-Peucker 路径简化</li>
          <li>✅ 轮廓聚类和排序</li>
          <li>✅ SVG 矢量路径（可无限缩放）</li>
          <li>✅ Fabric.js 路径编辑</li>
        </ul>
      </div>
    </div>
  )
}
