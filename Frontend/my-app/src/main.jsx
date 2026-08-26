import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#fff',
          color: '#1e293b',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '12px 16px',
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
        success: {
          iconTheme: {
            primary: '#16a34a',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#dc2626',
            secondary: '#fff',
          },
        },
      }}
    />
    <App />
  </StrictMode>,
)
