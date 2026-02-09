//main.jsx                                                                                         
import 'bootstrap/dist/css/bootstrap.min.css';
import { StrictMode } from 'react'
import { ReactDOM , createRoot } from 'react-dom/client'
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
    <App />
    </AuthProvider>
  </StrictMode>,
) 