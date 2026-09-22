import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#141414',
            color: '#FAFAF7',
            border: '1px solid #242424',
            fontFamily: 'Space Grotesk, sans-serif',
          },
          success: {
            iconTheme: { primary: '#2ED573', secondary: '#0A0A0A' },
          },
          error: {
            iconTheme: { primary: '#FF4757', secondary: '#0A0A0A' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
