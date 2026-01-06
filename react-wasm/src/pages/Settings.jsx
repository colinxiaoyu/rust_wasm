import { useState } from 'react'
import './Settings.scss'

export default function Settings() {
  const [theme, setTheme] = useState('light')
  const [language, setLanguage] = useState('zh-CN')
  const [notifications, setNotifications] = useState(true)

  return (
    <div className="page-container">
      <div className="settings-content">
        <h1>设置</h1>

        <div className="settings-section">
          <h2>外观设置</h2>
          <div className="setting-item">
            <div className="setting-info">
              <label>主题模式</label>
              <p>选择应用的显示主题</p>
            </div>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
              <option value="auto">跟随系统</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h2>语言设置</h2>
          <div className="setting-item">
            <div className="setting-info">
              <label>界面语言</label>
              <p>选择应用显示语言</p>
            </div>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
              <option value="ja-JP">日本語</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h2>通知设置</h2>
          <div className="setting-item">
            <div className="setting-info">
              <label>桌面通知</label>
              <p>允许应用发送桌面通知</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2>关于</h2>
          <div className="about-info">
            <p>版本: 1.0.0</p>
            <p>构建时间: 2024-01-06</p>
            <p>技术栈: React + WebAssembly + Rust</p>
          </div>
        </div>
      </div>
    </div>
  )
}
