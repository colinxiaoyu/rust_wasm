import { useEffect, useRef, useState } from 'react'
import styles from './ReColorPage.module.scss'

export default function ReColorPage () {
  const canvasRef = useRef(null)
  const originalCanvasRef = useRef(null)
  const workerRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [color, setColor] = useState({ r: 255, g: 0, b: 0 })
  const [enabledChannels, setEnabledChannels] = useState({ r: true, g: true, b: true })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [originalImageData, setOriginalImageData] = useState(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    // 创建 Web Worker
    workerRef.current = new Worker(new URL('../worker.js', import.meta.url), {
      type: 'module'
    })

    // 监听 Worker 消息
    workerRef.current.onmessage = (e) => {
      const { type, data, error } = e.data

      switch (type) {
        case 'ready':
          setReady(true)
          break

        case 'recolor_complete':
          const canvas = canvasRef.current
          if (canvas) {
            const ctx = canvas.getContext('2d')
            const imageData = new ImageData(
              new Uint8ClampedArray(data.data),
              data.width,
              data.height
            )
            ctx.putImageData(imageData, 0, 0)
          }
          setProcessing(false)
          break

        case 'error':
          console.error('Worker error:', error)
          alert('处理图片时出错: ' + error)
          setProcessing(false)
          break
      }
    }

    // 清理函数
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [])

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const img = new Image()
    img.src = URL.createObjectURL(file)

    img.onload = () => {
      setImageLoaded(true)

      setTimeout(() => {
        const canvas = canvasRef.current
        const originalCanvas = originalCanvasRef.current

        if (!canvas || !originalCanvas) return

        const ctx = canvas.getContext('2d')
        const originalCtx = originalCanvas.getContext('2d')

        // 限制最大尺寸
        const MAX_WIDTH = 800
        const MAX_HEIGHT = 600

        let displayWidth = img.width
        let displayHeight = img.height

        if (displayWidth > MAX_WIDTH || displayHeight > MAX_HEIGHT) {
          const widthRatio = MAX_WIDTH / displayWidth
          const heightRatio = MAX_HEIGHT / displayHeight
          const scale = Math.min(widthRatio, heightRatio)

          displayWidth = Math.floor(displayWidth * scale)
          displayHeight = Math.floor(displayHeight * scale)
        }

        canvas.width = displayWidth
        canvas.height = displayHeight
        originalCanvas.width = displayWidth
        originalCanvas.height = displayHeight

        ctx.drawImage(img, 0, 0, displayWidth, displayHeight)
        originalCtx.drawImage(img, 0, 0, displayWidth, displayHeight)

        // 保存原始图像数据
        const imageData = ctx.getImageData(0, 0, displayWidth, displayHeight)
        setOriginalImageData(imageData)

        // 应用初始颜色
        applyRecolor()
      }, 0)
    }
  }

  const applyRecolor = () => {
    if (!originalImageData || !workerRef.current) return

    setProcessing(true)

    // 发送图像数据到 Worker 处理
    workerRef.current.postMessage({
      type: 'recolor',
      data: {
        imageData: {
          data: originalImageData.data,
          width: originalImageData.width,
          height: originalImageData.height
        },
        r: color.r,
        g: color.g,
        b: color.b,
        useR: enabledChannels.r,
        useG: enabledChannels.g,
        useB: enabledChannels.b
      }
    })
  }

  const handleColorChange = (colorType, value) => {
    const newColor = { ...color, [colorType]: parseInt(value) }
    setColor(newColor)

    if (imageLoaded && originalImageData) {
      applyRecolor()
    }
  }

  const handleChannelToggle = (channel) => {
    const newChannels = { ...enabledChannels, [channel]: !enabledChannels[channel] }
    setEnabledChannels(newChannels)

    if (imageLoaded && originalImageData) {
      applyRecolor()
    }
  }

  // 更新 applyRecolor 的依赖
  useEffect(() => {
    if (imageLoaded && originalImageData) {
      applyRecolor()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, enabledChannels])

  return (
    <div className={styles.pageContainer}>
      <h1>WASM 图片处理演示</h1>
      <p className={styles.pageDescription}>上传图片并选择性修改颜色通道</p>

      <div className={styles.demoContainer}>
        <div className={styles.controlsPanel}>
          <div className={styles.controlGroup}>
            <label>上传图片</label>
            <input
              type="file"
              accept="image/*"
              disabled={!ready}
              onChange={handleFile}
              className={styles.fileInput}
            />
            {!ready && <p className={styles.loadingText}>正在加载 WASM 模块...</p>}
          </div>

          <div className={styles.colorControls}>
            <div className={styles.controlGroup}>
              <div className={styles.labelWithCheckbox}>
                <label>红色 (R): {color.r}</label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={enabledChannels.r}
                    onChange={() => handleChannelToggle('r')}
                    disabled={!imageLoaded}
                  />
                  <span>启用</span>
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={color.r}
                onChange={(e) => handleColorChange('r', e.target.value)}
                disabled={!imageLoaded || !enabledChannels.r}
              />
            </div>

            <div className={styles.controlGroup}>
              <div className={styles.labelWithCheckbox}>
                <label>绿色 (G): {color.g}</label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={enabledChannels.g}
                    onChange={() => handleChannelToggle('g')}
                    disabled={!imageLoaded}
                  />
                  <span>启用</span>
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={color.g}
                onChange={(e) => handleColorChange('g', e.target.value)}
                disabled={!imageLoaded || !enabledChannels.g}
              />
            </div>

            <div className={styles.controlGroup}>
              <div className={styles.labelWithCheckbox}>
                <label>蓝色 (B): {color.b}</label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={enabledChannels.b}
                    onChange={() => handleChannelToggle('b')}
                    disabled={!imageLoaded}
                  />
                  <span>启用</span>
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={color.b}
                onChange={(e) => handleColorChange('b', e.target.value)}
                disabled={!imageLoaded || !enabledChannels.b}
              />
            </div>

            <div className={styles.colorPreview}>
              <label>预览颜色</label>
              <div
                className={styles.colorBox}
                style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
              />
            </div>

            <div className={styles.infoBox}>
              <h3>💡 使用提示</h3>
              <p>✓ 启用通道：修改该颜色通道</p>
              <p>✗ 禁用通道：保持原图该颜色通道不变</p>
              <p>例如：只启用红色通道可以创建红色滤镜效果</p>
            </div>
          </div>
        </div>

        <div className={styles.canvasSection}>
          {!imageLoaded && (
            <div className={styles.placeholder}>
              <p>请上传图片开始处理</p>
            </div>
          )}

          {imageLoaded && (
            <div className={styles.canvasGrid}>
              <div className={styles.canvasWrapper}>
                <h4>原图</h4>
                <canvas ref={originalCanvasRef} className={styles.canvasDisplay} />
              </div>

              <div className={styles.canvasWrapper}>
                <div className={styles.canvasHeader}>
                  <h4>处理后</h4>
                  {processing && (
                    <div className={styles.processingBadge}>
                      <div className={styles.miniSpinner}></div>
                      <span>处理中...</span>
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} className={styles.canvasDisplay} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
