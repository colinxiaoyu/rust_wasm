import { useEffect, useRef, useState } from 'react'
import styles from './GrayscaleSobelWGSLPage.module.scss'
// 导入 WGSL Shader 代码
import shaderCode from '../shaders/grayscaleSobel.wgsl?raw'

export default function GrayscaleSobelWGSLPage() {
  const canvasRef = useRef(null)
  const originalCanvasRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [originalImageData, setOriginalImageData] = useState(null)
  const [isProcessed, setIsProcessed] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const deviceRef = useRef(null)
  const pipelineRef = useRef(null)

  useEffect(() => {
    initWebGPU()
  }, [])

  const initWebGPU = async () => {
    try {
      // 检查浏览器是否支持 WebGPU
      if (!navigator.gpu) {
        throw new Error('WebGPU not supported on this browser.')
      }

      // 请求 GPU 适配器
      const adapter = await navigator.gpu.requestAdapter()
      if (!adapter) {
        throw new Error('No appropriate GPUAdapter found.')
      }

      // 请求 GPU 设备
      const device = await adapter.requestDevice()
      deviceRef.current = device

      // 创建计算管道
      const shaderModule = device.createShaderModule({
        code: shaderCode,
      })

      const pipeline = device.createComputePipeline({
        layout: 'auto',
        compute: {
          module: shaderModule,
          entryPoint: 'main',
        },
      })

      pipelineRef.current = pipeline
      setReady(true)
      setError(null)
    } catch (err) {
      console.error('WebGPU initialization error:', err)
      setError(err.message)
    }
  }

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

        if (!canvas || !originalCanvas) {
          console.error('Canvas elements not found')
          return
        }

        const ctx = canvas.getContext('2d')
        const originalCtx = originalCanvas.getContext('2d')

        canvas.width = img.width
        canvas.height = img.height
        originalCanvas.width = img.width
        originalCanvas.height = img.height

        ctx.drawImage(img, 0, 0)
        originalCtx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        setOriginalImageData(imageData)
        setIsProcessed(false)
      }, 0)
    }
  }

  const applyGrayscaleSobel = async () => {
    if (!originalImageData || !deviceRef.current || !pipelineRef.current) return

    setProcessing(true)

    try {
      const device = deviceRef.current
      const pipeline = pipelineRef.current

      const width = originalImageData.width
      const height = originalImageData.height

      // 计算对齐的 bytesPerRow (必须是 256 的倍数)
      const actualBytesPerRow = width * 4
      const bytesPerRow = Math.ceil(actualBytesPerRow / 256) * 256

      // 创建 uniform buffer
      const uniformBuffer = device.createBuffer({
        size: 8, // 2 * u32
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })

      device.queue.writeBuffer(
        uniformBuffer,
        0,
        new Uint32Array([width, height])
      )

      // 如果需要对齐，创建填充后的数据
      let textureData
      if (bytesPerRow === actualBytesPerRow) {
        // 不需要填充
        textureData = originalImageData.data
      } else {
        // 需要添加填充字节
        textureData = new Uint8Array(bytesPerRow * height)
        for (let row = 0; row < height; row++) {
          const srcOffset = row * actualBytesPerRow
          const dstOffset = row * bytesPerRow
          textureData.set(
            originalImageData.data.subarray(
              srcOffset,
              srcOffset + actualBytesPerRow
            ),
            dstOffset
          )
        }
      }

      // 创建输入纹理
      const inputTexture = device.createTexture({
        size: [width, height],
        format: 'rgba8unorm',
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
      })

      device.queue.writeTexture(
        { texture: inputTexture },
        textureData,
        { bytesPerRow: bytesPerRow },
        [width, height]
      )

      // 创建输出纹理
      const outputTexture = device.createTexture({
        size: [width, height],
        format: 'rgba8unorm',
        usage:
          GPUTextureUsage.STORAGE_BINDING |
          GPUTextureUsage.COPY_SRC |
          GPUTextureUsage.RENDER_ATTACHMENT,
      })

      // 创建 bind group
      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: { buffer: uniformBuffer },
          },
          {
            binding: 1,
            resource: inputTexture.createView(),
          },
          {
            binding: 2,
            resource: outputTexture.createView(),
          },
        ],
      })

      // 创建命令编码器
      const commandEncoder = device.createCommandEncoder()

      // 计算 pass
      const passEncoder = commandEncoder.beginComputePass()
      passEncoder.setPipeline(pipeline)
      passEncoder.setBindGroup(0, bindGroup)
      passEncoder.dispatchWorkgroups(
        Math.ceil(width / 8),
        Math.ceil(height / 8)
      )
      passEncoder.end()

      // 创建输出 buffer 用于读取结果
      const outputBuffer = device.createBuffer({
        size: bytesPerRow * height,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      })

      commandEncoder.copyTextureToBuffer(
        { texture: outputTexture },
        { buffer: outputBuffer, bytesPerRow: bytesPerRow },
        [width, height]
      )

      // 提交命令
      device.queue.submit([commandEncoder.finish()])

      // 读取结果
      await outputBuffer.mapAsync(GPUMapMode.READ)
      const paddedData = new Uint8ClampedArray(outputBuffer.getMappedRange())

      // 移除填充字节，提取实际图像数据
      const imageDataArray = new Uint8ClampedArray(width * height * 4)

      if (bytesPerRow === actualBytesPerRow) {
        // 不需要移除填充
        imageDataArray.set(paddedData)
      } else {
        // 移除每行的填充字节
        for (let row = 0; row < height; row++) {
          const srcOffset = row * bytesPerRow
          const dstOffset = row * actualBytesPerRow
          imageDataArray.set(
            paddedData.subarray(srcOffset, srcOffset + actualBytesPerRow),
            dstOffset
          )
        }
      }

      outputBuffer.unmap()

      // 更新 canvas
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        const imageData = new ImageData(imageDataArray, width, height)
        ctx.putImageData(imageData, 0, 0)
        setIsProcessed(true)
      }

      // 清理资源
      uniformBuffer.destroy()
      inputTexture.destroy()
      outputTexture.destroy()
      outputBuffer.destroy()
    } catch (err) {
      console.error('WebGPU processing error:', err)
      alert('处理图片时出错: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  const restoreOriginal = () => {
    if (!originalImageData) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.putImageData(originalImageData, 0, 0)
    setIsProcessed(false)
  }

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = isProcessed ? 'webgpu-sobel-edge.png' : 'image.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className={styles.pageContainer}>
      <h1>图像灰度化与边缘检测 - WebGPU</h1>
      <p className={styles.pageDescription}>
        使用 WGSL (WebGPU Shading Language) 实现 GPU 加速的图像处理
      </p>

      {error && (
        <div className={styles.errorBox}>
          <h3>WebGPU 不可用</h3>
          <p>{error}</p>
          <p className={styles.infoText}>
            请使用支持 WebGPU 的浏览器（Chrome 113+, Edge 113+）并确保 WebGPU
            已启用。
          </p>
        </div>
      )}

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
            {!ready && !error && (
              <p className={styles.loadingText}>正在初始化 WebGPU...</p>
            )}
          </div>

          <div className={styles.buttonGroup}>
            <button
              onClick={applyGrayscaleSobel}
              disabled={!imageLoaded || processing || !ready}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              {processing ? '处理中...' : 'GPU 加速边缘检测'}
            </button>

            <button
              onClick={restoreOriginal}
              disabled={!imageLoaded || !isProcessed}
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
            <h3>WebGPU 算法原理</h3>
            <div className={styles.algorithmSection}>
              <h4>1. 计算着色器 (Compute Shader)</h4>
              <p>使用 WGSL 编写的并行计算程序：</p>
              <code>@compute @workgroup_size(8, 8)</code>
              <p className={styles.infoText}>
                每个工作组处理 8×8 像素块，充分利用 GPU 的并行计算能力。
              </p>
            </div>
            <div className={styles.algorithmSection}>
              <h4>2. 灰度转换（GPU 并行）</h4>
              <p>在 GPU 上并行计算灰度值：</p>
              <code>Gray = 0.299×R + 0.587×G + 0.114×B</code>
              <p className={styles.infoText}>
                每个像素的灰度转换同时进行，性能远超 CPU 实现。
              </p>
            </div>
            <div className={styles.algorithmSection}>
              <h4>3. Sobel 边缘检测（GPU 卷积）</h4>
              <p>在 GPU 上并行计算梯度：</p>
              <code>
                Gx = [-1,0,1; -2,0,2; -1,0,1]
                <br />
                Gy = [-1,-2,-1; 0,0,0; 1,2,1]
                <br />G = √(Gx² + Gy²)
              </code>
              <p className={styles.infoText}>
                所有像素的卷积计算并行执行，处理速度比 CPU 快数十倍。
              </p>
            </div>
            <div className={styles.performanceSection}>
              <h4>💡 性能优势</h4>
              <p className={styles.infoText}>
                WebGPU 利用显卡的并行计算能力，可以同时处理数千个像素，
                对于高分辨率图像（4K, 8K）效果尤其明显。
              </p>
            </div>
          </div>
        </div>

        <div className={styles.canvasSection}>
          {!imageLoaded && (
            <div className={styles.placeholder}>
              <div className={styles.placeholderIcon}>🎮</div>
              <p>请上传图片体验 GPU 加速处理</p>
            </div>
          )}

          {imageLoaded && (
            <div className={styles.canvasGrid}>
              <div className={styles.canvasWrapper}>
                <h4>原图</h4>
                <canvas
                  ref={originalCanvasRef}
                  className={styles.canvasDisplay}
                />
              </div>

              <div className={styles.canvasWrapper}>
                <div className={styles.canvasHeader}>
                  <h4>{isProcessed ? 'GPU 边缘检测结果' : '处理后'}</h4>
                  {processing && (
                    <div className={styles.processingBadge}>
                      <div className={styles.miniSpinner}></div>
                      <span>GPU 处理中...</span>
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
