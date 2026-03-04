import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mail, MapPin, Send, Linkedin, Github } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    budget: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const leftPanel = leftPanelRef.current;
    const rightPanel = rightPanelRef.current;

    if (!section || !leftPanel || !rightPanel) return;

    const ctx = gsap.context(() => {
      // Flowing section - elements reveal as they come into view
      gsap.fromTo(
        leftPanel,
        { y: '10vh', opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'top 45%',
            scrub: 0.5,
          },
        }
      );

      gsap.fromTo(
        rightPanel,
        { y: '10vh', opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            end: 'top 40%',
            scrub: 0.5,
          },
        }
      );

      // Form fields stagger reveal
      const formFields = rightPanel.querySelectorAll('.form-field');
      gsap.fromTo(
        formFields,
        { y: 12, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 60%',
            end: 'top 30%',
            scrub: 0.5,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({ name: '', email: '', company: '', budget: '', message: '' });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative min-h-screen py-20 lg:py-32 z-[70]"
    >
      <div className="px-6 lg:px-[6vw]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-[4vw]">
          {/* Left Editorial Panel */}
          <div
            ref={leftPanelRef}
            className="w-full lg:w-[46vw] glass-panel p-6 lg:p-10"
          >
            <span className="micro-label block mb-6">CONTACT</span>

            <div className="mb-6">
              <h2 className="font-heading font-bold text-[clamp(36px,5vw,72px)] leading-[0.95] tracking-[-0.02em]">
                <span className="text-[#F2F5FA]">LET'S</span>
                <br />
                <span className="text-outline text-[#F2F5FA]">TALK</span>
              </h2>
            </div>

            <p className="text-[#A7AFBF] text-base lg:text-lg leading-relaxed mb-8 max-w-md">
              Tell us what you're building. We'll reply within 2 business days.
            </p>

            <div className="space-y-4">
              <a
                href="mailto:hello@threeseas.digital"
                className="flex items-center gap-3 text-[#F2F5FA] hover:text-[#FF6A00] transition-colors"
              >
                <Mail size={20} />
                <span>hello@threeseas.digital</span>
              </a>

              <div className="flex items-center gap-3 text-[#A7AFBF]">
                <MapPin size={20} />
                <span>Remote-first • UTC−8 to UTC+2</span>
              </div>
            </div>
          </div>

          {/* Right Info Panel (Form) */}
          <div
            ref={rightPanelRef}
            className="w-full lg:w-[34vw] glass-panel p-6 lg:p-8"
          >
            <h3 className="font-heading font-semibold text-xl text-[#F2F5FA] mb-6">
              Start a project
            </h3>

            {isSubmitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[rgba(255,106,0,0.2)] flex items-center justify-center mx-auto mb-4">
                  <Send size={28} className="text-[#FF6A00]" />
                </div>
                <h4 className="font-heading font-semibold text-lg text-[#F2F5FA] mb-2">
                  Message sent!
                </h4>
                <p className="text-[#A7AFBF]">
                  We'll get back to you within 2 business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-field">
                  <label className="block text-sm text-[#A7AFBF] mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-[rgba(5,6,11,0.5)] border border-[rgba(242,245,250,0.1)] rounded-lg px-4 py-3 text-[#F2F5FA] placeholder-[#A7AFBF] focus:outline-none focus:border-[#FF6A00] transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div className="form-field">
                  <label className="block text-sm text-[#A7AFBF] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-[rgba(5,6,11,0.5)] border border-[rgba(242,245,250,0.1)] rounded-lg px-4 py-3 text-[#F2F5FA] placeholder-[#A7AFBF] focus:outline-none focus:border-[#FF6A00] transition-colors"
                    placeholder="you@company.com"
                  />
                </div>

                <div className="form-field">
                  <label className="block text-sm text-[#A7AFBF] mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full bg-[rgba(5,6,11,0.5)] border border-[rgba(242,245,250,0.1)] rounded-lg px-4 py-3 text-[#F2F5FA] placeholder-[#A7AFBF] focus:outline-none focus:border-[#FF6A00] transition-colors"
                    placeholder="Company name"
                  />
                </div>

                <div className="form-field">
                  <label className="block text-sm text-[#A7AFBF] mb-2">
                    Budget
                  </label>
                  <select
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className="w-full bg-[rgba(5,6,11,0.5)] border border-[rgba(242,245,250,0.1)] rounded-lg px-4 py-3 text-[#F2F5FA] focus:outline-none focus:border-[#FF6A00] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#0B0E14]">
                      Select budget range
                    </option>
                    <option value="10k-25k" className="bg-[#0B0E14]">
                      $10k - $25k
                    </option>
                    <option value="25k-50k" className="bg-[#0B0E14]">
                      $25k - $50k
                    </option>
                    <option value="50k-100k" className="bg-[#0B0E14]">
                      $50k - $100k
                    </option>
                    <option value="100k+" className="bg-[#0B0E14]">
                      $100k+
                    </option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="block text-sm text-[#A7AFBF] mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full bg-[rgba(5,6,11,0.5)] border border-[rgba(242,245,250,0.1)] rounded-lg px-4 py-3 text-[#F2F5FA] placeholder-[#A7AFBF] focus:outline-none focus:border-[#FF6A00] transition-colors resize-none"
                    placeholder="Tell us about your project..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-[#05060B] border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send message
                      <Send size={18} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-10 border-t border-[rgba(242,245,250,0.08)]">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-sm text-[#A7AFBF] hover:text-[#F2F5FA] transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-sm text-[#A7AFBF] hover:text-[#F2F5FA] transition-colors"
              >
                Terms
              </a>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-[rgba(242,245,250,0.05)] flex items-center justify-center text-[#A7AFBF] hover:text-[#F2F5FA] hover:bg-[rgba(242,245,250,0.1)] transition-all"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-[rgba(242,245,250,0.05)] flex items-center justify-center text-[#A7AFBF] hover:text-[#F2F5FA] hover:bg-[rgba(242,245,250,0.1)] transition-all"
              >
                <Github size={18} />
              </a>
            </div>

            <p className="text-sm text-[#A7AFBF]">
              © Three Seas Digital
            </p>
          </div>
        </footer>
      </div>
    </section>
  );
}
