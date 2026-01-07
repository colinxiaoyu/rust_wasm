console.log('worker.js: script started')

let wasmReady = false
let wasmModule = null

import('./wasm_pkg/wasm_lib.js')
  .then((module) => {
    wasmModule = module
    return module.default() // 调用 init 函数
  })
  .then(() => {
    wasmReady = true
    self.postMessage({ type: 'ready' })
  })
  .catch((err) => {
    self.postMessage({ type: 'error', error: err.message })
  })

// 监听主线程消息
self.onmessage = async (e) => {
  const { type, data } = e.data

  if (!wasmReady) {
    self.postMessage({
      type: 'error',
      error: 'WASM module not initialized yet',
    })
    return
  }

  try {
    switch (type) {
      case 'grayscale': {
        const { imageData } = data
        const processedData = new Uint8ClampedArray(imageData.data)

        wasmModule.grayscale(processedData)

        self.postMessage(
          {
            type: 'grayscale_complete',
            data: {
              width: imageData.width,
              height: imageData.height,
              data: processedData,
            },
          },
          [processedData.buffer]
        )
        break
      }
      case 'grayscale_sobel': {
        const { imageData } = data
        const processedData = new Uint8ClampedArray(imageData.data)
        wasmModule.grayscale_sobel(
          processedData,
          imageData.width,
          imageData.height
        )
        self.postMessage(
          {
            type: 'grayscale_sobel_complete',
            data: {
              width: imageData.width,
              height: imageData.height,
              data: processedData,
            },
          },
          [processedData.buffer]
        )
        break
      }

      case 'recolor': {
        const { imageData, r, g, b, useR, useG, useB } = data
        const processedData = new Uint8ClampedArray(imageData.data)

        wasmModule.recolor_selective(processedData, r, g, b, useR, useG, useB)

        self.postMessage(
          {
            type: 'recolor_complete',
            data: {
              width: imageData.width,
              height: imageData.height,
              data: processedData,
            },
          },
          [processedData.buffer]
        )
        break
      }

      default:
        self.postMessage({
          type: 'error',
          error: `Unknown message type: ${type}`,
        })
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message,
    })
  }
}
