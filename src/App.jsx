import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Portfolio from './pages/Portfolio';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Register from './pages/Register';
import ClientSignup from './pages/ClientSignup';
import NotFound from './pages/NotFound';
import { StarterShowcase, BusinessShowcase, PremiumShowcase, EnterpriseShowcase } from './pages/PortfolioLanding';
import './index.css';

// Site info — single source of truth for contact details
export const SITE_INFO = {
  phone: '',       // TODO: Add your real phone number
  email: 'hello@threeseasdigital.com',
  address: '',     // TODO: Add your real business address
  name: 'Three Seas Digital',
};

const DEMO_PATHS = ['/portfolio/starter', '/portfolio/business', '/portfolio/premium', '/portfolio/enterprise'];

function AppLayout() {
  const location = useLocation();
  const isDemo = DEMO_PATHS.includes(location.pathname);

  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/starter" element={<StarterShowcase />} />
          <Route path="/portfolio/business" element={<BusinessShowcase />} />
          <Route path="/portfolio/premium" element={<PremiumShowcase />} />
          <Route path="/portfolio/enterprise" element={<EnterpriseShowcase />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/services" element={<ClientSignup />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isDemo && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AppProvider>
  );
}
