import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { SalesProvider } from './context/SalesContext';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

// Lazy-load heavier pages for code splitting
const About = lazy(() => import('./pages/About'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Contact = lazy(() => import('./pages/Contact'));
const Admin = lazy(() => import('./pages/Admin'));
const Register = lazy(() => import('./pages/Register'));
const ClientSignup = lazy(() => import('./pages/ClientSignup'));
const StarterShowcase = lazy(() => import('./pages/PortfolioLanding').then(m => ({ default: m.StarterShowcase })));
const BusinessShowcase = lazy(() => import('./pages/PortfolioLanding').then(m => ({ default: m.BusinessShowcase })));
const PremiumShowcase = lazy(() => import('./pages/PortfolioLanding').then(m => ({ default: m.PremiumShowcase })));
const EnterpriseShowcase = lazy(() => import('./pages/PortfolioLanding').then(m => ({ default: m.EnterpriseShowcase })));

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
      <div className="page-spinner" />
    </div>
  );
}

const DEMO_PATHS = ['/portfolio/starter', '/portfolio/business', '/portfolio/premium', '/portfolio/enterprise'];

function AppLayout() {
  const location = useLocation();
  const isDemo = DEMO_PATHS.includes(location.pathname);

  return (
    <>
      <Navbar />
      <main>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </ErrorBoundary>
      </main>
      {!isDemo && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <SalesProvider>
          <AppProvider>
            <BrowserRouter>
              <AppLayout />
            </BrowserRouter>
          </AppProvider>
        </SalesProvider>
      </FinanceProvider>
    </AuthProvider>
  );
}
