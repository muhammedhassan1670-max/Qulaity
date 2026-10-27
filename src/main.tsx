import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import { router } from './router'

// Handle Vite dynamic import / chunk update errors gracefully across deploys
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const lastReload = sessionStorage.getItem('last_chunk_reload');
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    sessionStorage.setItem('last_chunk_reload', now.toString());
    window.location.reload();
  }
});

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
