import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';

const values = [
  {
    title: 'Innovation First',
    desc: 'We stay ahead of the curve, adopting new technologies and approaches to deliver cutting-edge solutions.',
  },
  {
    title: 'Client Partnership',
    desc: 'We treat every project as a partnership. Your success is our success, and we go the extra mile to ensure it.',
  },
  {
    title: 'Quality Craftsmanship',
    desc: 'Every pixel, every line of code, every strategy is crafted with precision and care.',
  },
  {
    title: 'Transparent Communication',
    desc: 'No jargon, no surprises. We keep you informed and involved at every stage of the process.',
  },
];

export default function About() {
  useEffect(() => { document.title = 'About Us — Three Seas Digital'; }, []);
  return (
    <div className="page">
      {/* Hero */}
      <section className="page-hero">
        <div className="page-hero-bg">
          <img
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920&h=600&fit=crop"
            alt="About Us"
          />
          <div className="hero-overlay" />
        </div>
        <div className="page-hero-content">
          <h1>About Us</h1>
          <p>The people and values behind Three Seas Digital</p>
        </div>
      </section>

      {/* Our Story */}
      <section className="section">
        <div className="container">
          <div className="about-story-grid">
            <div className="about-story-text">
              <h2>Our Story</h2>
              <p>
                Three Seas Digital was founded with a simple belief: every
                business deserves a powerful digital presence. What started as a
                small team with big ambitions has grown into a full-service
                digital agency serving clients across industries.
              </p>
              <p>
                We've navigated the ever-changing digital landscape together,
                learning, adapting, and perfecting our craft along the way. Our
                name reflects our reach — spanning seas to connect brands with
                their audiences wherever they are.
              </p>
              <p>
                Today, we combine creativity with technology to build digital
                experiences that don't just look great — they deliver real
                results.
              </p>
            </div>
            <div className="about-story-image">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=500&fit=crop"
                alt="Our office"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="section values-section">
        <div className="container">
          <div className="section-header">
            <h2>Our Values</h2>
            <p>The principles that guide everything we do</p>
          </div>
          <div className="values-grid">
            {values.map((v, i) => (
              <div key={v.title} className="value-card">
                <div className="value-number">{String(i + 1).padStart(2, '0')}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Team */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Our Team</h2>
            <p>Dedicated professionals building your digital future</p>
          </div>
          <div className="team-growing">
            <div className="team-growing-icon"><Users size={48} /></div>
            <h3>A Growing Team</h3>
            <p>
              Three Seas Digital is a lean, focused agency where every team member
              wears multiple hats. We bring together expertise in design, development,
              strategy, and marketing to deliver results that matter.
            </p>
            <p>
              Interested in working with us?{' '}
              <Link to="/contact">Get in touch</Link> — we're always open to
              collaborating with talented people.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <h2>Want to Join Our Crew?</h2>
          <p>
            We're always looking for talented individuals who share our passion
            for great digital work.
          </p>
          <Link to="/contact" className="btn btn-primary btn-lg">
            Get in Touch <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
