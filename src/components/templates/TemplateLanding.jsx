import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';

const templates = {
  6:  lazy(() => import('./NovaDashboard')),
  7:  lazy(() => import('./SaaSLaunch')),
  8:  lazy(() => import('./MedicalPlus')),
  9:  lazy(() => import('./TechStartup')),
  10: lazy(() => import('./FinancePro')),
  11: lazy(() => import('./EventLaunch')),
  12: lazy(() => import('./AppPromo')),
  13: lazy(() => import('./StartupPitch')),
  14: lazy(() => import('./ProductHunt')),
  15: lazy(() => import('./CourseSales')),
  16: lazy(() => import('./ConsultingCo')),
  17: lazy(() => import('./LuxeRealty')),
  18: lazy(() => import('./AnalyticsPro')),
  19: lazy(() => import('./CRMPanel')),
  20: lazy(() => import('./ProjectTracker')),
  21: lazy(() => import('./ArtisanGallery')),
  22: lazy(() => import('./PixelStudio')),
  23: lazy(() => import('./DevPortfolio')),
};

function TemplateLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#0a0f1c', color: '#fff',
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#3ECF8E', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
        }} />
        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Loading template...</p>
      </div>
    </div>
  );
}

export default function TemplateLanding() {
  const { id } = useParams();
  const Template = templates[id];

  if (!Template) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#0a0f1c', color: '#fff',
        fontFamily: "'Space Grotesk', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: 8 }}>404</h1>
          <p style={{ opacity: 0.6 }}>Template not found</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<TemplateLoader />}>
      <Template />
    </Suspense>
  );
}
