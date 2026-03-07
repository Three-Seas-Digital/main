import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { SalesProvider } from './context/SalesContext';
import { AppProvider } from './context/AppContext';
import { initSync } from './api/sync';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NotFound from './pages/NotFound';

// Auto-reload on stale chunk errors (after deployment, cached index.html may reference old hashes)
function lazyRetry<T extends React.ComponentType<any>>(loader: () => Promise<{ default: T }>) {
  return lazy(() =>
    loader().catch(() => {
      const reloaded = sessionStorage.getItem('chunk_reload');
      if (!reloaded) {
        sessionStorage.setItem('chunk_reload', '1');
        window.location.reload();
      }
      // If we already reloaded once, surface the error normally
      return loader();
    })
  );
}

// Lazy-load heavier pages for code splitting
const Home = lazyRetry(() => import('./pages/Home'));
const About = lazyRetry(() => import('./pages/About'));
const Portfolio = lazyRetry(() => import('./pages/Portfolio'));
const Contact = lazyRetry(() => import('./pages/Contact'));
const Admin = lazyRetry(() => import('./pages/Admin'));
const Register = lazyRetry(() => import('./pages/Register'));
const ClientSignup = lazyRetry(() => import('./pages/ClientSignup'));
const StarterShowcase = lazy(() => import('./pages/PortfolioLanding').then(m => ({ default: m.StarterShowcase })));
const BusinessShowcase = lazy(() => import('./pages/PortfolioLanding').then(m => ({ default: m.BusinessShowcase })));
const PremiumShowcase = lazy(() => import('./pages/PortfolioLanding').then(m => ({ default: m.PremiumShowcase })));
const EnterpriseShowcase = lazy(() => import('./pages/PortfolioLanding').then(m => ({ default: m.EnterpriseShowcase })));
const Templates = lazyRetry(() => import('./pages/Templates'));
const TemplatesSignIn = lazyRetry(() => import('./pages/TemplatesSignIn'));
const Checkout = lazyRetry(() => import('./pages/Checkout'));

const Account = lazyRetry(() => import('./pages/Account'));
const TemplateLanding = lazyRetry(() => import('./components/templates/TemplateLanding'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
      <div className="page-spinner" />
    </div>
  );
}

const DEMO_PATHS = ['/pricing/starter', '/pricing/business', '/pricing/premium', '/pricing/enterprise'];
const HIDE_NAVBAR_PATHS = ['/templates', '/checkout', '/templates/preview'];

// Runs initSync once after all providers are mounted.
// Non-blocking — app renders immediately while sync happens in background.
function SyncInitializer({ children }: { children: React.ReactNode }) {
  const didSync = useRef(false);
  useEffect(() => {
    // Clear stale-chunk reload flag on successful load
    sessionStorage.removeItem('chunk_reload');
    if (didSync.current) return;
    didSync.current = true;
    initSync().catch(() => {
      // Sync failure is non-fatal — app runs in localStorage-only mode
    });
  }, []);
  return children;
}

function AppLayout() {
  const location = useLocation();
  const isDemo = DEMO_PATHS.includes(location.pathname);
  const hideNavbar = HIDE_NAVBAR_PATHS.includes(location.pathname) || location.pathname.startsWith('/templates/preview');
  const hideFooter = isDemo || hideNavbar;

  return (
    <>
      {!hideNavbar && <Navbar />}
      <main>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/pricing" element={<Portfolio />} />
              <Route path="/pricing/starter" element={<StarterShowcase />} />
              <Route path="/pricing/business" element={<BusinessShowcase />} />
              <Route path="/pricing/premium" element={<PremiumShowcase />} />
              <Route path="/pricing/enterprise" element={<EnterpriseShowcase />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/templates/signin" element={<TemplatesSignIn />} />
              <Route path="/templates/preview/:id" element={<TemplateLanding />} />
              <Route path="/checkout" element={<Checkout />} />

              <Route path="/account" element={<Account />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/services" element={<ClientSignup />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      {!hideFooter && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <SalesProvider>
          <AppProvider>
            <SyncInitializer>
              <BrowserRouter>
                <AppLayout />
              </BrowserRouter>
            </SyncInitializer>
          </AppProvider>
        </SalesProvider>
      </FinanceProvider>
    </AuthProvider>
  );
}
