import Home from '../pages/Home'
import ReColorPage from '../pages/ReColorPage'
import GrayscalePage from '../pages/GrayscalePage'
import GrayscaleSobelPage from '../pages/GrayscaleSobelPage'
import Annotation3D from '../pages/Annotation3D'
import FabricDemo from '../pages/FabricDemo'
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
    index: true,
  },
  {
    path: '/recolor_page',
    name: 'recolor',
    label: '改色处理',
    icon: '🖼️',
    element: ReColorPage,
  },
  {
    path: '/grayscale_page',
    name: 'grayscale',
    label: '灰度处理',
    icon: '⚫',
    element: GrayscalePage,
  },
  {
    path: '/grayscale_sobel_page',
    name: 'grayscale_sobel',
    label: '灰度sobel处理',
    icon: '⚫',
    element: GrayscaleSobelPage,
  },

  {
    path: '/annotation3d_page',
    name: 'annotation3d',
    label: '3D标注',
    icon: '🎯',
    element: Annotation3D,
  },
  {
    path: '/fabric_demo_page',
    name: 'fabricdemo',
    label: 'Fabric演示',
    icon: '🎨',
    element: FabricDemo,
  },
  {
    path: '/about_page',
    name: 'about',
    label: '关于',
    icon: 'ℹ️',
    element: About,
  },
  {
    path: '/settings_page',
    name: 'settings',
    label: '设置',
    icon: '⚙️',
    element: Settings,
  },
]

// 获取菜单项（用于侧边栏）
export const getMenuItems = () => {
  return routes.map((route) => ({
    path: route.path,
    label: route.label,
    icon: route.icon,
    name: route.name,
  }))
}
