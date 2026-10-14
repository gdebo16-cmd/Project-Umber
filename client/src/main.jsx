import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'

// Put the saved color scheme back on the page (same as theme.js did)
document.documentElement.setAttribute('data-theme', localStorage.getItem('siteTheme') || 'default');
document.documentElement.setAttribute('data-background', localStorage.getItem('siteBackground') || 'default');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
