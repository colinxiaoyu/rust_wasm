import { useEffect, useRef, useState } from 'react'
import init, { recolor } from './wasm_pkg/wasm_lib'

export default function App () {
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    init().then(() => setReady(true))
  }, [])

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const img = new Image()
    img.src = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, img.width, img.height)

      // 调用 WASM 改色（红色示例）
      recolor(imageData.data, 255, 0, 0)

      ctx.putImageData(imageData, 0, 0)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>React + WASM 图片改色</h2>

      <input
        type="file"
        accept="image/*"
        disabled={!ready}
        onChange={handleFile}
      />

      <br />
      <br />

      <canvas ref={canvasRef} />
    </div>
  )
}
