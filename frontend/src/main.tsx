import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'hsl(222, 47%, 9%)',
          color: 'hsl(213, 31%, 95%)',
          border: '1px solid hsl(222, 47%, 18%)',
          borderRadius: '10px',
          fontSize: '14px',
        },
        success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: 'white' } },
      }}
    />
  </React.StrictMode>,
)
