import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/base.css'
import './styles/navbar.css'
import './styles/home.css'
import './styles/portfolio.css'
import './styles/about.css'
import './styles/contact.css'
import './styles/footer.css'
import './styles/admin.css'
import './styles/client-portal.css'
import './styles/demos.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
