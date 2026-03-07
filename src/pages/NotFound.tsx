import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function NotFound() {
  useEffect(() => { document.title = 'Page Not Found — Three Seas Digital'; }, []);
  return (
    <div className="page not-found-page">
      <div className="not-found-content">
        <img src="/images/brand-icon.png" alt="Three Seas Digital" className="not-found-icon" style={{ width: 64, height: 64 }} />
        <h1>404</h1>
        <h2>Lost at Sea</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            Back to Home <ArrowRight size={16} />
          </Link>
          <Link to="/pricing" className="btn btn-outline">
            View Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
