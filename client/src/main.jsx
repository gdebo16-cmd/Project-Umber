import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'

// Put the saved color scheme back on the page (same as theme.js did)
document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
