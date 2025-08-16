// import { StrictMode } from 'react' // Removed to prevent double-rendering in development
import ReactDOM from 'react-dom/client'
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'

import './styles.css'
import reportWebVitals from './reportWebVitals.ts'

import TaskListHome from './components/TaskListHome.tsx'
import HomePage from './components/HomePage.tsx'
import TaskDetail from './components/TaskDetail.tsx'
import SharedTaskView from './components/SharedTaskView.tsx'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: TaskListHome,
})

const createTaskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create',
  component: HomePage,
})

const taskDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/task/$taskId',
  component: TaskDetail,
})

const sharedTaskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shared/$taskId',
  component: SharedTaskView,
})

const routeTree = rootRoute.addChildren([indexRoute, createTaskRoute, taskDetailRoute, sharedTaskRoute])

const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <RouterProvider router={router} />
  )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
