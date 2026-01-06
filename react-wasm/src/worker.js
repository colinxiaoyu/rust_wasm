import init, { grayscale, recolor_selective } from './wasm_pkg/wasm_lib.js'

let wasmReady = false

// 初始化 WASM 模块
init().then(() => {
  wasmReady = true
  self.postMessage({ type: 'ready' })
})

// 监听主线程消息
self.onmessage = async (e) => {
  const { type, data } = e.data

  if (!wasmReady) {
    self.postMessage({
      type: 'error',
      error: 'WASM module not initialized yet'
    })
    return
  }

  try {
    switch (type) {
      case 'grayscale': {
        const { imageData } = data
        const processedData = new Uint8ClampedArray(imageData.data)

        grayscale(processedData)

        self.postMessage({
          type: 'grayscale_complete',
          data: {
            width: imageData.width,
            height: imageData.height,
            data: processedData
          }
        }, [processedData.buffer])
        break
      }

      case 'recolor': {
        const { imageData, r, g, b, useR, useG, useB } = data
        const processedData = new Uint8ClampedArray(imageData.data)

        recolor_selective(processedData, r, g, b, useR, useG, useB)

        self.postMessage({
          type: 'recolor_complete',
          data: {
            width: imageData.width,
            height: imageData.height,
            data: processedData
          }
        }, [processedData.buffer])
        break
      }

      default:
        self.postMessage({
          type: 'error',
          error: `Unknown message type: ${type}`
        })
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message
    })
  }
}
