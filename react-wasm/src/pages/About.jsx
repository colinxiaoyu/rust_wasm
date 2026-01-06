import './About.scss'

export default function About() {
  return (
    <div className="page-container">
      <div className="about-content">
        <h1>关于本项目</h1>

        <section className="info-section">
          <h2>项目简介</h2>
          <p>
            这是一个结合了 React 和 WebAssembly (WASM) 技术的现代化 Web 应用示例。
            项目展示了如何将 Rust 编写的高性能代码编译为 WASM 模块，并在 React 应用中使用。
          </p>
        </section>

        <section className="info-section">
          <h2>技术栈</h2>
          <ul className="tech-list">
            <li>
              <strong>React 18</strong> - 现代化的前端框架
            </li>
            <li>
              <strong>Vite</strong> - 快速的构建工具
            </li>
            <li>
              <strong>React Router</strong> - 单页应用路由管理
            </li>
            <li>
              <strong>WebAssembly</strong> - 高性能的 Web 字节码
            </li>
            <li>
              <strong>Rust</strong> - 系统级编程语言
            </li>
          </ul>
        </section>

        <section className="info-section">
          <h2>功能特性</h2>
          <ul className="feature-list">
            <li>基于 React Router 的路由系统</li>
            <li>响应式侧边栏导航</li>
            <li>WASM 驱动的图片处理功能</li>
            <li>实时颜色调整预览</li>
            <li>现代化的 UI 设计</li>
          </ul>
        </section>

        <section className="info-section">
          <h2>开发者信息</h2>
          <p>
            本项目旨在展示如何在实际项目中集成 WebAssembly，提供高性能的计算能力。
            适合学习 React、WASM 和 Rust 集成开发的开发者参考。
          </p>
        </section>
      </div>
    </div>
  )
}
