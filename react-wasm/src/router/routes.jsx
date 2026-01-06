import Home from '../pages/Home'
import ReColorPage from '../pages/ReColorPage'
import GrayscalePage from '../pages/GrayscalePage'
import About from '../pages/About'
import Settings from '../pages/Settings'

// 路由配置
export const routes = [
  {
    path: '/',
    name: 'home',
    label: '首页',
    icon: '🏠',
    element: Home,
    index: true
  },
  {
    path: '/recolor_page',
    name: 'recolor',
    label: '改色处理',
    icon: '🖼️',
    element: ReColorPage
  },
  {
    path: '/grayscale_page',
    name: 'grayscale',
    label: '灰度处理',
    icon: '⚫',
    element: GrayscalePage
  },
  {
    path: '/about_page',
    name: 'about',
    label: '关于',
    icon: 'ℹ️',
    element: About
  },
  {
    path: '/settings_page',
    name: 'settings',
    label: '设置',
    icon: '⚙️',
    element: Settings
  }
]

// 获取菜单项（用于侧边栏）
export const getMenuItems = () => {
  return routes.map(route => ({
    path: route.path,
    label: route.label,
    icon: route.icon,
    name: route.name
  }))
}
