import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import LeadsPage from './LeadsPage.tsx'

// No router library in this project — the kiosk is a single-page state
// machine (see App.tsx's `view` state) and /leads is the one other page
// (a staff-facing leads list), so a plain pathname check covers it without
// pulling in react-router for two routes.
const page = window.location.pathname.startsWith('/leads') ? <LeadsPage /> : <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>{page}</StrictMode>,
)
