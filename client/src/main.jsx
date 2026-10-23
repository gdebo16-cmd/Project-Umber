import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/themes.css'
import './styles/components.css'
import App from './App.jsx'

// Put the saved color scheme back on the page (same as theme.js did)
document.documentElement.setAttribute('data-theme', localStorage.getItem('siteTheme') || 'default');
document.documentElement.setAttribute('data-background', localStorage.getItem('siteBackground') || 'default');
document.documentElement.setAttribute('data-display', localStorage.getItem('siteDisplay') || 'standard');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
