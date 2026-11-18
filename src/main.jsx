import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { initAuth } from './utils/auth'
import { supabaseConfigured } from './lib/supabase'

const root = createRoot(document.getElementById('root'))

if (!supabaseConfigured) {
  root.render(
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1rem', fontFamily: 'system-ui, sans-serif', background: '#f4f7f8', color: '#13232b' }}>
      <div style={{ maxWidth: 520, background: '#fff', borderRadius: 12, padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,.08)' }}>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 .75rem' }}>Falta configurar la conexión</h1>
        <p style={{ lineHeight: 1.6, margin: '0 0 .75rem' }}>
          Esta publicación no tiene las variables <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.
        </p>
        <p style={{ lineHeight: 1.6, margin: 0 }}>
          Agrégalas en Vercel (Settings → Environment Variables) y vuelve a publicar con Redeploy.
        </p>
      </div>
    </div>,
  )
} else {
  // Recupera la sesión de Supabase antes de mostrar la app.
  initAuth().finally(() => root.render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
  ))
}
