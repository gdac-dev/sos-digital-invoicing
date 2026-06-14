import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { LangProvider } from './context/LangContext.jsx'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1E293B', color: '#f1f5f9', border: '1px solid #334155', fontFamily: 'Poppins, sans-serif', fontSize: '13.5px' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#1E293B' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1E293B' } },
          }}
        />
      </AuthProvider>
    </LangProvider>
  </StrictMode>
)
