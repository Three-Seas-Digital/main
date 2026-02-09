import { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle, Mail, Phone, MapPin } from 'lucide-react';
import Calendar from '../components/Calendar';
import { useAppContext } from '../context/AppContext';
import { SITE_INFO } from '../constants';
import FallbackImg from '../components/FallbackImg';

const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM',
  '3:00 PM', '4:00 PM', '5:00 PM',
];

export default function Contact() {
  useEffect(() => { document.title = 'Contact Us — Three Seas Digital'; }, []);
  const { addAppointment, getAppointmentsForDate } = useAppContext();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
  });

  const bookedTimes = selectedDate
    ? getAppointmentsForDate(selectedDate).map((a) => a.time)
    : [];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;

    addAppointment({
      ...form,
      date: selectedDate,
      time: selectedTime,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: '', email: '', phone: '', service: '', message: '' });
      setSelectedDate('');
      setSelectedTime('');
    }, 4000);
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="page">
      <section className="page-hero">
        <div className="page-hero-bg">
          <FallbackImg
            src="/images/contact-hero.jpg"
            alt="Contact"
          />
          <div className="hero-overlay" />
        </div>
        <div className="page-hero-content">
          <h1>Contact Us</h1>
          <p>Schedule a consultation and let's discuss your project</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="contact-grid">
            {/* Left: Calendar & Time Picker */}
            <div className="contact-calendar-side">
              <h2>Pick a Date & Time</h2>
              <Calendar
                onDateSelect={setSelectedDate}
                selectedDate={selectedDate}
                showDots={true}
              />

              {selectedDate && (
                <div className="time-slots">
                  <h3>
                    <Clock size={18} />
                    Available Times for {formatDisplayDate(selectedDate)}
                  </h3>
                  <div className="time-grid">
                    {timeSlots.map((time) => {
                      const booked = bookedTimes.includes(time);
                      return (
                        <button
                          key={time}
                          className={`time-btn ${
                            selectedTime === time ? 'active' : ''
                          } ${booked ? 'booked' : ''}`}
                          onClick={() => !booked && setSelectedTime(time)}
                          disabled={booked}
                        >
                          {time}
                          {booked && <span className="booked-label">Booked</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Contact Form */}
            <div className="contact-form-side">
              {submitted ? (
                <div className="success-message">
                  <CheckCircle size={48} />
                  <h2>Appointment Booked!</h2>
                  <p>
                    We've received your booking for{' '}
                    <strong>{formatDisplayDate(selectedDate)}</strong> at{' '}
                    <strong>{selectedTime}</strong>. We'll send you a confirmation
                    email shortly.
                  </p>
                </div>
              ) : (
                <>
                  <h2>Your Details</h2>
                  <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Service Interested In</label>
                      <select
                        name="service"
                        value={form.service}
                        onChange={handleChange}
                      >
                        <option value="">Select a service</option>
                        <option value="web-design">Web Design</option>
                        <option value="branding">Branding</option>
                        <option value="marketing">Digital Marketing</option>
                        <option value="app-dev">App Development</option>
                        <option value="consulting">Consulting</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Message</label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Tell us about your project..."
                        rows={4}
                      />
                    </div>

                    {selectedDate && selectedTime ? (
                      <div className="booking-summary">
                        <strong>Booking Summary:</strong>{' '}
                        {formatDisplayDate(selectedDate)} at {selectedTime}
                      </div>
                    ) : (
                      <div className="booking-hint">
                        {!selectedDate
                          ? 'Please select a date from the calendar'
                          : 'Please select a time slot'}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary btn-full"
                      disabled={!selectedDate || !selectedTime || !form.name || !form.email}
                    >
                      <Send size={18} />
                      Book Appointment
                    </button>
                  </form>
                </>
              )}

              <div className="contact-info-cards">
                {SITE_INFO.email && (
                  <div className="info-card">
                    <Mail size={20} />
                    <div>
                      <strong>Email</strong>
                      <span>{SITE_INFO.email}</span>
                    </div>
                  </div>
                )}
                {SITE_INFO.phone && (
                  <div className="info-card">
                    <Phone size={20} />
                    <div>
                      <strong>Phone</strong>
                      <span>{SITE_INFO.phone}</span>
                    </div>
                  </div>
                )}
                {SITE_INFO.address && (
                  <div className="info-card">
                    <MapPin size={20} />
                    <div>
                      <strong>Office</strong>
                      <span>{SITE_INFO.address}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
