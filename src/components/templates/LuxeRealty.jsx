const C = '#f59e0b';
const BG = '#0c0a04';

export default function LuxeRealty() {
  const properties = [
    { name: 'The Pinnacle Penthouse', location: 'Manhattan, NY', price: '$12.5M', beds: 4, baths: 5, sqft: '5,200', tag: 'New' },
    { name: 'Oceanfront Estate', location: 'Malibu, CA', price: '$28.9M', beds: 7, baths: 8, sqft: '12,400', tag: 'Featured' },
    { name: 'Modern Hillside Villa', location: 'Beverly Hills, CA', price: '$8.7M', beds: 5, baths: 6, sqft: '7,800', tag: 'Open House' },
  ];

  return (
    <div style={{ background: BG, color: '#fef3c7', fontFamily: "'Playfair Display', 'Georgia', serif", minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&display=swap');
        @keyframes lrFadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes lrShimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        @keyframes lrGoldLine { from { width:0; } to { width:60px; } }
        .lr-card { background:rgba(245,158,11,0.03); border:1px solid rgba(245,158,11,0.1); border-radius:12px; overflow:hidden; animation:lrFadeUp 0.7s ease-out both; transition:transform 0.4s,box-shadow 0.4s; }
        .lr-card:hover { transform:translateY(-6px); box-shadow:0 20px 40px rgba(245,158,11,0.08); }
        .lr-prop-img { height:220px; background:linear-gradient(135deg,rgba(245,158,11,0.15),rgba(217,119,6,0.08)); display:flex; align-items:center; justify-content:center; font-size:3rem; opacity:0.3; }
        .lr-gold-line { height:2px; background:linear-gradient(90deg,${C},${C}00); animation:lrGoldLine 1s ease-out both; margin:16px auto; }
        .lr-stat { text-align:center; }
      `}</style>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: 'blur(12px)', background: `${BG}dd` }}>
        <div style={{ fontWeight: 700, fontSize: '1.3rem', letterSpacing: '0.05em' }}>LUXE<span style={{ color: C }}>.</span></div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif" }}>
          {['Properties', 'Agents', 'About'].map(l => <a key={l} href="#" style={{ color: '#d4a850', opacity: 0.7, textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 600 }}>{l}</a>)}
          <button style={{ padding: '10px 24px', background: 'transparent', color: C, border: `1px solid ${C}44`, borderRadius: 2, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.72rem', fontFamily: "'Inter', sans-serif" }}>Schedule Tour</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px', background: `radial-gradient(ellipse at 50% 30%, rgba(245,158,11,0.06) 0%, transparent 70%)` }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: C, marginBottom: 20, fontFamily: "'Inter', sans-serif" }}>Luxury Real Estate</div>
        <h1 style={{ fontSize: 'clamp(3rem, 7vw, 5rem)', fontWeight: 700, lineHeight: 1.05, margin: '0 0 8px', color: '#fffbeb' }}>
          Live Beyond<br />Extraordinary
        </h1>
        <div className="lr-gold-line" />
        <p style={{ fontSize: '1.05rem', color: '#d4a850', opacity: 0.6, maxWidth: 460, margin: '16px auto 40px', lineHeight: 1.8, fontFamily: "'Inter', sans-serif", fontStyle: 'italic' }}>
          Curated luxury properties in the world's most prestigious addresses.
        </p>
        <button style={{ padding: '16px 44px', background: 'transparent', color: C, border: `1px solid ${C}55`, borderRadius: 2, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif", transition: 'all 0.3s' }}>
          View Collection
        </button>
      </section>

      {/* Stats */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, borderTop: '1px solid rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.08)' }}>
        {[
          { val: '$2.4B', label: 'Total Sales' },
          { val: '340+', label: 'Properties Sold' },
          { val: '98%', label: 'Client Satisfaction' },
          { val: '25+', label: 'Years Experience' },
        ].map((s, i) => (
          <div key={i} className="lr-stat">
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: C }}>{s.val}</div>
            <div style={{ fontSize: '0.72rem', color: '#d4a850', opacity: 0.4, marginTop: 4, fontFamily: "'Inter', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Featured Properties */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: C, marginBottom: 8, fontFamily: "'Inter', sans-serif" }}>Curated Selection</div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 700, color: '#fffbeb' }}>Featured Properties</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {properties.map((p, i) => (
            <div key={i} className="lr-card" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="lr-prop-img" style={{ position: 'relative' }}>
                🏛️
                <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 12px', background: C, color: '#000', fontSize: '0.68rem', fontWeight: 700, borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Inter', sans-serif" }}>{p.tag}</div>
              </div>
              <div style={{ padding: '24px 20px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fffbeb', marginBottom: 4 }}>{p.name}</h3>
                <div style={{ fontSize: '0.82rem', color: '#d4a850', opacity: 0.5, marginBottom: 12, fontFamily: "'Inter', sans-serif" }}>{p.location}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem', color: '#d4a850', opacity: 0.4, marginBottom: 16, fontFamily: "'Inter', sans-serif" }}>
                  <span>{p.beds} Beds</span><span>{p.baths} Baths</span><span>{p.sqft} sqft</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 700, color: C }}>{p.price}</span>
                  <button style={{ padding: '8px 16px', background: 'transparent', color: C, border: `1px solid ${C}33`, borderRadius: 2, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Inter', sans-serif" }}>View</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '100px 24px', background: `radial-gradient(ellipse at 50% 70%, rgba(245,158,11,0.04) 0%, transparent 70%)` }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fffbeb', marginBottom: 8 }}>Your Dream Home Awaits</h2>
        <div className="lr-gold-line" />
        <p style={{ color: '#d4a850', opacity: 0.5, marginTop: 16, marginBottom: 32, fontFamily: "'Inter', sans-serif" }}>Schedule a private viewing with our luxury specialists.</p>
        <button style={{ padding: '16px 44px', background: C, color: '#000', border: 'none', borderRadius: 2, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>Contact Us</button>
      </section>

      <footer style={{ borderTop: `1px solid ${C}08`, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: '#475569', fontFamily: "'Inter', sans-serif" }}>Luxe Realty &mdash; A Three Seas Digital Template</div>
      </footer>
    </div>
  );
}
