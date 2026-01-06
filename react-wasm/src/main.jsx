import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import { routes } from './router/routes'
import './index.scss'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {routes.map(route => {
            const Component = route.element
            return route.index ? (
              <Route key={route.name} index element={<Component />} />
            ) : (
              <Route key={route.name} path={route.path} element={<Component />} />
            )
          })}
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
