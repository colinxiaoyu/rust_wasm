import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import * as fabric from 'fabric'

const FabricCanvas = forwardRef(({ width = 600, height = 600, mode = 'view' }, ref) => {
  const fabricCanvasRef = useRef(null)

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    // 绘制轮廓路径（矢量化）
    drawContourPaths: (contours) => {
      if (!fabricCanvasRef.current || !contours || contours.length === 0) return

      // 清除之前的轮廓路径
      const objects = fabricCanvasRef.current.getObjects()
      objects.forEach(obj => {
        if (obj.isContour) {
          fabricCanvasRef.current.remove(obj)
        }
      })

      // 绘制每个轮廓
      contours.forEach((contour, index) => {
        if (contour.length < 2) return

        // 创建路径字符串
        const pathString = contour.map((point, i) => {
          if (i === 0) {
            return `M ${point.x} ${point.y}`
          } else {
            return `L ${point.x} ${point.y}`
          }
        }).join(' ') + ' Z' // Z 表示闭合路径

        // 创建 Fabric Path 对象
        const path = new fabric.Path(pathString, {
          fill: 'transparent',
          stroke: index === 0 ? '#00ff00' : '#ffff00', // 第一个轮廓用绿色，其他用黄色
          strokeWidth: 2,
          selectable: mode === 'annotate',
          evented: mode === 'annotate',
          isContour: true,
          objectCaching: false
        })

        fabricCanvasRef.current.add(path)
      })

      fabricCanvasRef.current.renderAll()
    },

    // 清除轮廓路径
    clearContours: () => {
      if (!fabricCanvasRef.current) return

      const objects = fabricCanvasRef.current.getObjects()
      objects.forEach(obj => {
        if (obj.isContour) {
          fabricCanvasRef.current.remove(obj)
        }
      })

      fabricCanvasRef.current.renderAll()
    },

    // 添加文本标注
    addText: () => {
      if (!fabricCanvasRef.current) return

      const text = new fabric.IText('标注文本', {
        left: 100,
        top: 100,
        fontSize: 16,
        fill: '#ffeb3b',
        stroke: '#000000',
        strokeWidth: 0.5,
        fontFamily: 'Arial',
        hasControls: true,
        hasBorders: true,
        cornerColor: '#00ff00',
        cornerSize: 8
      })

      fabricCanvasRef.current.add(text)
      fabricCanvasRef.current.setActiveObject(text)
      fabricCanvasRef.current.renderAll()
    },

    // 添加箭头标注
    addArrow: () => {
      if (!fabricCanvasRef.current) return

      const line = new fabric.Line([50, 50, 150, 150], {
        stroke: '#ff5722',
        strokeWidth: 3,
        selectable: true,
        hasControls: true,
        hasBorders: true
      })

      fabricCanvasRef.current.add(line)
      fabricCanvasRef.current.setActiveObject(line)
      fabricCanvasRef.current.renderAll()
    },

    // 添加矩形标注
    addRect: () => {
      if (!fabricCanvasRef.current) return

      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 80,
        fill: 'transparent',
        stroke: '#4caf50',
        strokeWidth: 2,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        cornerColor: '#00ff00',
        cornerSize: 8
      })

      fabricCanvasRef.current.add(rect)
      fabricCanvasRef.current.setActiveObject(rect)
      fabricCanvasRef.current.renderAll()
    },

    // 添加圆形标注
    addCircle: () => {
      if (!fabricCanvasRef.current) return

      const circle = new fabric.Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: 'transparent',
        stroke: '#2196f3',
        strokeWidth: 2,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        cornerColor: '#00ff00',
        cornerSize: 8
      })

      fabricCanvasRef.current.add(circle)
      fabricCanvasRef.current.setActiveObject(circle)
      fabricCanvasRef.current.renderAll()
    },

    // 删除选中的对象
    deleteSelected: () => {
      if (!fabricCanvasRef.current) return

      const activeObject = fabricCanvasRef.current.getActiveObject()
      if (activeObject) {
        fabricCanvasRef.current.remove(activeObject)
        fabricCanvasRef.current.renderAll()
      }
    },

    // 清空所有对象
    clearAll: () => {
      if (!fabricCanvasRef.current) return

      if (confirm('确定要清空所有内容吗？')) {
        fabricCanvasRef.current.clear()
        fabricCanvasRef.current.renderAll()
      }
    },

    // 渲染
    render: () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.renderAll()
      }
    }
  }))

  useEffect(() => {
    if (!fabricCanvasRef.current) {
      const canvas = new fabric.Canvas('annotation-canvas', {
        width: width,
        height: height,
        backgroundColor: 'transparent',
        selection: mode === 'annotate'
      })
      fabricCanvasRef.current = canvas
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose()
        fabricCanvasRef.current = null
      }
    }
  }, [])

  // 更新模式
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.selection = mode === 'annotate'
      fabricCanvasRef.current.forEachObject((obj) => {
        // 只有非轮廓对象可以在标注模式下编辑
        if (!obj.isContour) {
          obj.selectable = mode === 'annotate'
          obj.evented = mode === 'annotate'
        } else {
          // 轮廓对象始终可选
          obj.selectable = mode === 'annotate'
          obj.evented = mode === 'annotate'
        }
      })
      fabricCanvasRef.current.renderAll()
    }
  }, [mode])

  return (
    <>
      <canvas id="annotation-canvas" className="fabric-canvas" />
      {mode === 'annotate' && (
        <div className="mode-indicator">
          ✏️ 标注模式
        </div>
      )}
    </>
  )
})

FabricCanvas.displayName = 'FabricCanvas'

export default FabricCanvas
