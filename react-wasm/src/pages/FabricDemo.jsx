import { useEffect, useRef, useState } from 'react'
import * as fabric from 'fabric'
import './FabricDemo.scss'

export default function FabricDemo() {
  const canvasRef = useRef(null)
  const [activeTab, setActiveTab] = useState('shapes')
  const [selectedObject, setSelectedObject] = useState(null)
  const [canvasHistory, setCanvasHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // 初始化 Fabric Canvas
  useEffect(() => {
    if (!canvasRef.current) {
      const canvas = new fabric.Canvas('demo-canvas', {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
        selection: true
      })
      canvasRef.current = canvas

      // 监听对象选择
      canvas.on('selection:created', (e) => {
        setSelectedObject(e.selected[0])
      })
      canvas.on('selection:updated', (e) => {
        setSelectedObject(e.selected[0])
      })
      canvas.on('selection:cleared', () => {
        setSelectedObject(null)
      })

      // 监听对象修改，保存历史
      canvas.on('object:modified', () => {
        saveHistory()
      })
      canvas.on('object:added', () => {
        saveHistory()
      })

      // 添加欢迎文本
      const welcomeText = new fabric.Text('Fabric.js 演示画布', {
        left: 300,
        top: 280,
        fontSize: 32,
        fill: '#3498db',
        fontFamily: 'Arial',
        opacity: 0.5
      })
      canvas.add(welcomeText)
      saveHistory()
    }

    return () => {
      if (canvasRef.current) {
        canvasRef.current.dispose()
        canvasRef.current = null
      }
    }
  }, [])

  // 保存历史记录
  const saveHistory = () => {
    if (!canvasRef.current) return

    const json = JSON.stringify(canvasRef.current.toJSON())
    const newHistory = canvasHistory.slice(0, historyIndex + 1)
    newHistory.push(json)
    setCanvasHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  // 撤销
  const undo = () => {
    if (historyIndex > 0 && canvasRef.current) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      canvasRef.current.loadFromJSON(canvasHistory[newIndex], () => {
        canvasRef.current.renderAll()
      })
    }
  }

  // 重做
  const redo = () => {
    if (historyIndex < canvasHistory.length - 1 && canvasRef.current) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      canvasRef.current.loadFromJSON(canvasHistory[newIndex], () => {
        canvasRef.current.renderAll()
      })
    }
  }

  // ===== 基础图形 =====
  const addRectangle = () => {
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 150,
      height: 100,
      fill: '#e74c3c',
      stroke: '#c0392b',
      strokeWidth: 2,
      rx: 10,
      ry: 10
    })
    canvasRef.current.add(rect)
    canvasRef.current.setActiveObject(rect)
  }

  const addCircle = () => {
    const circle = new fabric.Circle({
      left: 200,
      top: 150,
      radius: 60,
      fill: '#3498db',
      stroke: '#2980b9',
      strokeWidth: 2
    })
    canvasRef.current.add(circle)
    canvasRef.current.setActiveObject(circle)
  }

  const addTriangle = () => {
    const triangle = new fabric.Triangle({
      left: 150,
      top: 100,
      width: 100,
      height: 100,
      fill: '#2ecc71',
      stroke: '#27ae60',
      strokeWidth: 2
    })
    canvasRef.current.add(triangle)
    canvasRef.current.setActiveObject(triangle)
  }

  const addPolygon = () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 50 },
      { x: 80, y: 120 },
      { x: 20, y: 120 }
    ]
    const polygon = new fabric.Polygon(points, {
      left: 250,
      top: 200,
      fill: '#9b59b6',
      stroke: '#8e44ad',
      strokeWidth: 2
    })
    canvasRef.current.add(polygon)
    canvasRef.current.setActiveObject(polygon)
  }

  const addStar = () => {
    const points = []
    const numPoints = 5
    const outerRadius = 50
    const innerRadius = 25

    for (let i = 0; i < numPoints * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const angle = (Math.PI * i) / numPoints
      points.push({
        x: radius * Math.sin(angle),
        y: -radius * Math.cos(angle)
      })
    }

    const star = new fabric.Polygon(points, {
      left: 300,
      top: 150,
      fill: '#f39c12',
      stroke: '#d68910',
      strokeWidth: 2
    })
    canvasRef.current.add(star)
    canvasRef.current.setActiveObject(star)
  }

  // ===== 线条和路径 =====
  const addLine = () => {
    const line = new fabric.Line([50, 50, 300, 200], {
      stroke: '#e74c3c',
      strokeWidth: 4,
      selectable: true
    })
    canvasRef.current.add(line)
    canvasRef.current.setActiveObject(line)
  }

  const addArrow = () => {
    const line = new fabric.Line([100, 100, 300, 100], {
      stroke: '#3498db',
      strokeWidth: 3
    })

    const triangle = new fabric.Triangle({
      left: 300,
      top: 100,
      width: 20,
      height: 20,
      fill: '#3498db',
      originX: 'center',
      originY: 'center',
      angle: 90
    })

    const group = new fabric.Group([line, triangle], {
      left: 150,
      top: 200
    })
    canvasRef.current.add(group)
    canvasRef.current.setActiveObject(group)
  }

  const addCurve = () => {
    const path = new fabric.Path('M 100 100 Q 200 50, 300 100', {
      stroke: '#2ecc71',
      strokeWidth: 4,
      fill: 'transparent',
      selectable: true
    })
    canvasRef.current.add(path)
    canvasRef.current.setActiveObject(path)
  }

  // ===== 文本 =====
  const addText = () => {
    const text = new fabric.IText('双击编辑文本', {
      left: 200,
      top: 200,
      fontSize: 24,
      fill: '#2c3e50',
      fontFamily: 'Arial',
      fontWeight: 'bold'
    })
    canvasRef.current.add(text)
    canvasRef.current.setActiveObject(text)
  }

  const addTextbox = () => {
    const textbox = new fabric.Textbox('这是一个可以自动换行的文本框，你可以调整它的宽度', {
      left: 150,
      top: 250,
      width: 250,
      fontSize: 18,
      fill: '#e74c3c',
      fontFamily: 'Arial',
      textAlign: 'center'
    })
    canvasRef.current.add(textbox)
    canvasRef.current.setActiveObject(textbox)
  }

  // ===== 图片 =====
  const addImageFromURL = () => {
    const imageUrl = 'https://via.placeholder.com/200x150'
    fabric.Image.fromURL(imageUrl, (img) => {
      img.set({
        left: 250,
        top: 200,
        scaleX: 0.8,
        scaleY: 0.8
      })
      canvasRef.current.add(img)
      canvasRef.current.setActiveObject(img)
    })
  }

  const addImageFromFile = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target.result, (img) => {
        const scale = Math.min(300 / img.width, 300 / img.height)
        img.set({
          left: 200,
          top: 150,
          scaleX: scale,
          scaleY: scale
        })
        canvasRef.current.add(img)
        canvasRef.current.setActiveObject(img)
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ===== 高级功能 =====
  const addGradientRect = () => {
    const rect = new fabric.Rect({
      left: 200,
      top: 200,
      width: 200,
      height: 150,
      fill: new fabric.Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: 200, y2: 150 },
        colorStops: [
          { offset: 0, color: '#e74c3c' },
          { offset: 0.5, color: '#f39c12' },
          { offset: 1, color: '#f1c40f' }
        ]
      }),
      rx: 10,
      ry: 10
    })
    canvasRef.current.add(rect)
    canvasRef.current.setActiveObject(rect)
  }

  const addShadowCircle = () => {
    const circle = new fabric.Circle({
      left: 300,
      top: 250,
      radius: 60,
      fill: '#9b59b6',
      shadow: {
        color: 'rgba(0,0,0,0.5)',
        blur: 20,
        offsetX: 10,
        offsetY: 10
      }
    })
    canvasRef.current.add(circle)
    canvasRef.current.setActiveObject(circle)
  }

  const addPatternRect = () => {
    const patternCanvas = document.createElement('canvas')
    patternCanvas.width = 20
    patternCanvas.height = 20
    const ctx = patternCanvas.getContext('2d')

    ctx.fillStyle = '#3498db'
    ctx.fillRect(0, 0, 10, 10)
    ctx.fillRect(10, 10, 10, 10)
    ctx.fillStyle = '#ecf0f1'
    ctx.fillRect(10, 0, 10, 10)
    ctx.fillRect(0, 10, 10, 10)

    const pattern = new fabric.Pattern({
      source: patternCanvas,
      repeat: 'repeat'
    })

    const rect = new fabric.Rect({
      left: 250,
      top: 180,
      width: 180,
      height: 180,
      fill: pattern
    })
    canvasRef.current.add(rect)
    canvasRef.current.setActiveObject(rect)
  }

  // ===== 对象操作 =====
  const deleteSelected = () => {
    const activeObjects = canvasRef.current.getActiveObjects()
    if (activeObjects.length) {
      activeObjects.forEach(obj => canvasRef.current.remove(obj))
      canvasRef.current.discardActiveObject()
      canvasRef.current.renderAll()
    }
  }

  const cloneSelected = () => {
    const activeObject = canvasRef.current.getActiveObject()
    if (activeObject) {
      activeObject.clone((cloned) => {
        cloned.set({
          left: cloned.left + 20,
          top: cloned.top + 20
        })
        canvasRef.current.add(cloned)
        canvasRef.current.setActiveObject(cloned)
        canvasRef.current.renderAll()
      })
    }
  }

  const bringToFront = () => {
    const activeObject = canvasRef.current.getActiveObject()
    if (activeObject) {
      canvasRef.current.bringToFront(activeObject)
    }
  }

  const sendToBack = () => {
    const activeObject = canvasRef.current.getActiveObject()
    if (activeObject) {
      canvasRef.current.sendToBack(activeObject)
    }
  }

  const clearCanvas = () => {
    if (confirm('确定要清空画布吗？')) {
      canvasRef.current.clear()
      canvasRef.current.backgroundColor = '#ffffff'
      canvasRef.current.renderAll()
    }
  }

  // ===== 导出功能 =====
  const exportAsImage = () => {
    const dataURL = canvasRef.current.toDataURL({
      format: 'png',
      quality: 1
    })
    const link = document.createElement('a')
    link.href = dataURL
    link.download = `fabric-demo-${Date.now()}.png`
    link.click()
  }

  const exportAsJSON = () => {
    const json = JSON.stringify(canvasRef.current.toJSON(), null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fabric-demo-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const loadFromJSON = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result)
        canvasRef.current.loadFromJSON(json, () => {
          canvasRef.current.renderAll()
        })
      } catch (error) {
        alert('JSON 文件格式错误')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="fabric-demo-page">
      <div className="page-header">
        <h1>Fabric.js 功能演示</h1>
        <p>探索 Fabric.js 的强大 Canvas 操作能力</p>
      </div>

      <div className="demo-container">
        <div className="sidebar">
          <div className="tabs">
            <button
              className={activeTab === 'shapes' ? 'active' : ''}
              onClick={() => setActiveTab('shapes')}
            >
              基础图形
            </button>
            <button
              className={activeTab === 'lines' ? 'active' : ''}
              onClick={() => setActiveTab('lines')}
            >
              线条路径
            </button>
            <button
              className={activeTab === 'text' ? 'active' : ''}
              onClick={() => setActiveTab('text')}
            >
              文本
            </button>
            <button
              className={activeTab === 'image' ? 'active' : ''}
              onClick={() => setActiveTab('image')}
            >
              图片
            </button>
            <button
              className={activeTab === 'advanced' ? 'active' : ''}
              onClick={() => setActiveTab('advanced')}
            >
              高级特效
            </button>
          </div>

          <div className="tools">
            {activeTab === 'shapes' && (
              <div className="tool-group">
                <h3>基础图形</h3>
                <button onClick={addRectangle}>⬜ 矩形</button>
                <button onClick={addCircle}>⭕ 圆形</button>
                <button onClick={addTriangle}>🔺 三角形</button>
                <button onClick={addPolygon}>⬟ 多边形</button>
                <button onClick={addStar}>⭐ 五角星</button>
              </div>
            )}

            {activeTab === 'lines' && (
              <div className="tool-group">
                <h3>线条和路径</h3>
                <button onClick={addLine}>📏 直线</button>
                <button onClick={addArrow}>➡️ 箭头</button>
                <button onClick={addCurve}>〰️ 曲线</button>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="tool-group">
                <h3>文本工具</h3>
                <button onClick={addText}>📝 文本</button>
                <button onClick={addTextbox}>📄 文本框</button>
              </div>
            )}

            {activeTab === 'image' && (
              <div className="tool-group">
                <h3>图片工具</h3>
                <button onClick={addImageFromURL}>🌐 网络图片</button>
                <label className="file-button">
                  📁 本地图片
                  <input
                    type="file"
                    accept="image/*"
                    onChange={addImageFromFile}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="tool-group">
                <h3>高级特效</h3>
                <button onClick={addGradientRect}>🌈 渐变矩形</button>
                <button onClick={addShadowCircle}>🌑 阴影圆形</button>
                <button onClick={addPatternRect}>🎨 图案矩形</button>
              </div>
            )}

            <div className="tool-group">
              <h3>对象操作</h3>
              <button onClick={cloneSelected} disabled={!selectedObject}>
                📋 克隆
              </button>
              <button onClick={deleteSelected} disabled={!selectedObject}>
                🗑️ 删除
              </button>
              <button onClick={bringToFront} disabled={!selectedObject}>
                ⬆️ 置顶
              </button>
              <button onClick={sendToBack} disabled={!selectedObject}>
                ⬇️ 置底
              </button>
            </div>

            <div className="tool-group">
              <h3>画布操作</h3>
              <button onClick={undo} disabled={historyIndex <= 0}>
                ↶ 撤销
              </button>
              <button onClick={redo} disabled={historyIndex >= canvasHistory.length - 1}>
                ↷ 重做
              </button>
              <button onClick={clearCanvas} className="danger">
                🧹 清空
              </button>
            </div>

            <div className="tool-group">
              <h3>导出/导入</h3>
              <button onClick={exportAsImage}>🖼️ 导出图片</button>
              <button onClick={exportAsJSON}>💾 导出 JSON</button>
              <label className="file-button">
                📂 导入 JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={loadFromJSON}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="canvas-area">
          <canvas id="demo-canvas"></canvas>

          {selectedObject && (
            <div className="object-info">
              <h4>选中对象信息</h4>
              <p>类型: {selectedObject.type}</p>
              <p>位置: ({Math.round(selectedObject.left)}, {Math.round(selectedObject.top)})</p>
              {selectedObject.width && <p>宽度: {Math.round(selectedObject.width * (selectedObject.scaleX || 1))}</p>}
              {selectedObject.height && <p>高度: {Math.round(selectedObject.height * (selectedObject.scaleY || 1))}</p>}
              {selectedObject.radius && <p>半径: {Math.round(selectedObject.radius * (selectedObject.scaleX || 1))}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="feature-showcase">
        <h2>Fabric.js 核心特性</h2>
        <div className="features">
          <div className="feature-item">
            <div className="feature-icon">🎨</div>
            <h3>丰富的图形</h3>
            <p>支持矩形、圆形、多边形、路径等多种图形</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">✏️</div>
            <h3>交互编辑</h3>
            <p>拖拽、缩放、旋转、文本编辑等交互操作</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🌈</div>
            <h3>样式特效</h3>
            <p>渐变、阴影、图案填充等高级样式</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🖼️</div>
            <h3>图片处理</h3>
            <p>加载、裁剪、滤镜等图片操作功能</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">💾</div>
            <h3>序列化</h3>
            <p>JSON 导出/导入，保存和恢复画布状态</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">⚡</div>
            <h3>高性能</h3>
            <p>优化的渲染引擎，流畅处理大量对象</p>
          </div>
        </div>
      </div>
    </div>
  )
}
