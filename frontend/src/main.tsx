import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n' // i18n configuration - must be imported before App
import './index.css'
import App from './App.tsx'
import { initErrorReporting } from './lib/errorReporter'

initErrorReporting()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
