import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import AppShell from './components/AppShell'
import WelcomeScreen from './components/WelcomeScreen'
import './i18n'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<WelcomeScreen />} />
        </Route>
        <Route path="/scan" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
