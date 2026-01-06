import { Link, Outlet, useLocation } from 'react-router-dom'
import { getMenuItems } from '../router/routes'
import './MainLayout.scss'

export default function MainLayout() {
  const location = useLocation()
  const menuItems = getMenuItems()

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>React + WASM</h2>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <Link
              key={item.name}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
