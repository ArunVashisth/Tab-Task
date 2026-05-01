import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, Check, X, Maximize2 } from 'lucide-react'

export default function CropModal({ imageSrc, onDone, onCancel }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [drag, setDrag] = useState(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const SIZE = 400

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !imgLoaded) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, SIZE, SIZE)
    ctx.save()
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.translate(SIZE / 2 + offset.x, SIZE / 2 + offset.y)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(zoom, zoom)
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2, img.naturalWidth, img.naturalHeight)
    ctx.restore()
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = 1
    for (let i = 1; i < 3; i++) {
      const p = (SIZE / 3) * i
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, SIZE); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(SIZE, p); ctx.stroke()
    }
    ctx.restore()
  }, [imgLoaded, rotation, zoom, offset])

  useEffect(() => { draw() }, [draw])

  const exportCrop = () => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const out = document.createElement('canvas')
    out.width = SIZE
    out.height = SIZE
    const ctx = out.getContext('2d')
    ctx.save()
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.translate(SIZE / 2 + offset.x, SIZE / 2 + offset.y)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(zoom, zoom)
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2, img.naturalWidth, img.naturalHeight)
    ctx.restore()
    out.toBlob(blob => { if (blob) onDone(blob) }, 'image/jpeg', 0.92)
  }

  const onMouseDown = (e) => {
    e.preventDefault()
    const { clientX: x, clientY: y } = e.touches ? e.touches[0] : e
    setDrag({ startX: x, startY: y, ox: offset.x, oy: offset.y })
  }

  const onMouseMove = useCallback((e) => {
    if (!drag) return
    const { clientX: x, clientY: y } = e.touches ? e.touches[0] : e
    setOffset({ x: drag.ox + x - drag.startX, y: drag.oy + y - drag.startY })
  }, [drag])

  const onMouseUp = () => setDrag(null)

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('touchmove', onMouseMove, { passive: false })
    window.addEventListener('touchend', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchmove', onMouseMove)
      window.removeEventListener('touchend', onMouseUp)
    }
  }, [onMouseMove])

  const onWheel = (e) => {
    e.preventDefault()
    setZoom(z => Math.min(3, Math.max(0.5, z + (e.deltaY < 0 ? 0.1 : -0.1))))
  }

  const rotate = (deg) => setRotation(r => r + deg)
  const resetAll = () => { setRotation(0); setZoom(1); setOffset({ x: 0, y: 0 }) }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <motion.div initial={{ scale: 0.88, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88 }}
        transition={{ type: 'spring', damping: 22 }}
        className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-dark-border">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-dark-text">Crop Photo</h2>
            <p className="text-xs text-gray-400 dark:text-dark-muted mt-0.5">Drag to move · Scroll to zoom</p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-gray-400 transition-colors">
            <X size={17} />
          </button>
        </div>
        <div className="flex items-center justify-center p-5 bg-gray-900">
          <canvas
            ref={canvasRef}
            width={SIZE} height={SIZE}
            style={{ width: SIZE, height: SIZE, borderRadius: '50%', cursor: drag ? 'grabbing' : 'grab' }}
            onMouseDown={onMouseDown}
            onTouchStart={onMouseDown}
            onWheel={onWheel}
          />
          <img ref={imgRef} src={imageSrc} alt="" className="hidden"
            onLoad={() => {
              const img = imgRef.current
              if (img) setZoom(Math.max(1, SIZE / Math.min(img.naturalWidth, img.naturalHeight)))
              setImgLoaded(true)
            }} />
        </div>
        <div className="px-5 py-4 space-y-4 border-t border-gray-100 dark:border-dark-border">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600 dark:text-dark-muted">Zoom</span>
              <span className="text-xs text-gray-400">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-dark-text transition-colors">
                <ZoomOut size={16} />
              </button>
              <input type="range" min="50" max="300" value={Math.round(zoom * 100)}
                onChange={e => setZoom(Number(e.target.value) / 100)}
                className="flex-1 accent-primary-600 h-1.5 rounded-full" />
              <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-dark-text transition-colors">
                <ZoomIn size={16} />
              </button>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600 dark:text-dark-muted">Rotate</span>
              <span className="text-xs text-gray-400">{rotation}°</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => rotate(-90)} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-dark-text transition-colors">
                <RotateCcw size={16} />
              </button>
              <input type="range" min="-180" max="180" value={rotation}
                onChange={e => setRotation(Number(e.target.value))}
                className="flex-1 accent-primary-600 h-1.5 rounded-full" />
              <button onClick={() => rotate(90)} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-dark-text transition-colors">
                <RotateCw size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button onClick={resetAll} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-dark-text transition-colors">
              <Maximize2 size={13} /> Reset
            </button>
            <div className="flex gap-2 ml-auto">
              <button onClick={onCancel} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <motion.button onClick={exportCrop} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5">
                <Check size={14} /> Apply
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
