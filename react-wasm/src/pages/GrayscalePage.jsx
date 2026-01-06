import { useEffect, useRef, useState } from 'react'
import styles from './GrayscalePage.module.scss'

export default function GrayscalePage () {
  const canvasRef = useRef(null)
  const originalCanvasRef = useRef(null)
  const workerRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [originalImageData, setOriginalImageData] = useState(null)
  const [isGrayscale, setIsGrayscale] = useState(false)
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

        case 'grayscale_complete':
          const canvas = canvasRef.current
          if (canvas) {
            const ctx = canvas.getContext('2d')
            const imageData = new ImageData(
              new Uint8ClampedArray(data.data),
              data.width,
              data.height
            )
            ctx.putImageData(imageData, 0, 0)
            setIsGrayscale(true)
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
      // 先设置 imageLoaded 为 true，让 canvas 渲染到 DOM
      setImageLoaded(true)

      // 使用 setTimeout 确保 canvas 已经渲染
      setTimeout(() => {
        const canvas = canvasRef.current
        const originalCanvas = originalCanvasRef.current

        if (!canvas || !originalCanvas) {
          console.error('Canvas elements not found')
          return
        }

        const ctx = canvas.getContext('2d')
        const originalCtx = originalCanvas.getContext('2d')

        // 设置画布尺寸
        canvas.width = img.width
        canvas.height = img.height
        originalCanvas.width = img.width
        originalCanvas.height = img.height

        // 绘制原图
        ctx.drawImage(img, 0, 0)
        originalCtx.drawImage(img, 0, 0)

        // 保存原始图像数据
        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        setOriginalImageData(imageData)
        setIsGrayscale(false)
      }, 0)
    }
  }

  const applyGrayscale = () => {
    if (!originalImageData || !workerRef.current) return

    setProcessing(true)

    // 发送图像数据到 Worker 处理
    workerRef.current.postMessage({
      type: 'grayscale',
      data: {
        imageData: {
          data: originalImageData.data,
          width: originalImageData.width,
          height: originalImageData.height
        }
      }
    })
  }

  const restoreOriginal = () => {
    if (!originalImageData) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.putImageData(originalImageData, 0, 0)
    setIsGrayscale(false)
  }

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = isGrayscale ? 'grayscale-image.png' : 'image.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className={styles.pageContainer}>
      <h1>灰度处理 - WASM</h1>
      <p className={styles.pageDescription}>使用 WebAssembly 将彩色图片转换为灰度图片</p>

      <div className={styles.grayscaleContainer}>
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

          <div className={styles.buttonGroup}>
            <button
              onClick={applyGrayscale}
              disabled={!imageLoaded || processing}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              {processing ? '处理中...' : '应用灰度效果'}
            </button>

            <button
              onClick={restoreOriginal}
              disabled={!imageLoaded || !isGrayscale}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              恢复原图
            </button>

            <button
              onClick={downloadImage}
              disabled={!imageLoaded}
              className={`${styles.btn} ${styles.btnSuccess}`}
            >
              下载图片
            </button>
          </div>

          <div className={styles.infoBox}>
            <h3>灰度转换算法</h3>
            <p>使用加权平均法计算灰度值：</p>
            <code>Gray = 0.299×R + 0.587×G + 0.114×B</code>
            <p className={styles.infoText}>
              这个公式基于人眼对不同颜色的敏感度，
              对绿色最敏感，其次是红色，对蓝色最不敏感。
            </p>
          </div>
        </div>

        <div className={styles.canvasSection}>
          {!imageLoaded && (
            <div className={styles.placeholder}>
              <div className={styles.placeholderIcon}>🖼️</div>
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
                  <h4>{isGrayscale ? '灰度图' : '处理后'}</h4>
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
