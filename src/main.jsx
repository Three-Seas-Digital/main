import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/base.css'
import './styles/navbar.css'
import './styles/footer.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Dismiss the HTML loader
const loader = document.getElementById('app-loader');
if (loader) {
  loader.classList.add('hide');
  setTimeout(() => loader.remove(), 600);
}
