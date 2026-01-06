import './Home.scss'

export default function Home() {
  return (
    <div className="page-container">
      <div className="hero-section">
        <h1>欢迎使用 React + WASM 应用</h1>
        <p className="subtitle">体验 WebAssembly 与 React 的强大结合</p>

        <div className="features">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>高性能</h3>
            <p>利用 WebAssembly 实现近乎原生的执行速度</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🦀</div>
            <h3>Rust 驱动</h3>
            <p>使用 Rust 编写安全、高效的 WASM 模块</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚛️</div>
            <h3>React 集成</h3>
            <p>无缝集成到现代 React 应用中</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>图片处理</h3>
            <p>实时处理图片，体验 WASM 的强大性能</p>
          </div>
        </div>
      </div>
    </div>
  )
}
