import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import { router } from './router'
import { cleanupDemoData } from './utils/demoDataCleanup'

cleanupDemoData()

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister())
    })

    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys
          .filter((key) => key.startsWith('qms-'))
          .forEach((key) => caches.delete(key))
      })
    }
  })
}

/**
 * QMS Enterprise 4.0 - Root Entry Point
 * Note: StrictMode disabled temporarily to resolve dispatcher initialization issue with React 19 + Recharts
 */
createRoot(document.getElementById('root')!).render(
  <>
    <RouterProvider router={router} />
    <Toaster 
      position="top-right"
      toastOptions={{
        style: {
          background: '#1a1a25',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      }}
    />
  </>
)
