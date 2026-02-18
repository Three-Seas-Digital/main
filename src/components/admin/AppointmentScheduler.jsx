import { useState, useMemo } from 'react';
import { CalendarDays, Clock, CheckCircle } from 'lucide-react';
import Calendar from '../Calendar';
import { useAppContext } from '../../context/AppContext';

export const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM',
  '3:00 PM', '4:00 PM', '5:00 PM',
];

export default function AppointmentScheduler({
  onSchedule,
  existingDate = '',
  existingTime = '',
  existingApptId = null,
  linkedName = '',
  linkedEmail = '',
  linkedPhone = '',
  linkedService = '',
}) {
  const { getBookedTimesForDate } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(existingDate);
  const [selectedTime, setSelectedTime] = useState(existingTime);
  const [message, setMessage] = useState('');

  const isReschedule = !!existingApptId;

  const bookedTimes = useMemo(() => {
    if (!selectedDate) return [];
    return getBookedTimesForDate(selectedDate, existingApptId);
  }, [selectedDate, existingApptId, getBookedTimesForDate]);

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) return;
    onSchedule({
      date: selectedDate,
      time: selectedTime,
      message,
      name: linkedName,
      email: linkedEmail,
      phone: linkedPhone,
      service: linkedService,
    });
    if (!isReschedule) {
      setSelectedDate('');
      setSelectedTime('');
      setMessage('');
    }
  };

  return (
    <div className="appt-scheduler">
      <div className="appt-scheduler-row">
        <div className="appt-scheduler-calendar">
          <label><CalendarDays size={14} /> Select Date</label>
          <Calendar onDateSelect={setSelectedDate} selectedDate={selectedDate} />
        </div>
        <div className="appt-scheduler-times">
          <label><Clock size={14} /> Select Time {selectedDate && <span className="appt-date-label">({selectedDate})</span>}</label>
          {!selectedDate ? (
            <p className="appt-hint">Pick a date first</p>
          ) : (
            <div className="appt-time-grid">
              {TIME_SLOTS.map((slot) => {
                const isBooked = bookedTimes.includes(slot);
                const isSelected = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    className={`appt-time-slot${isBooked ? ' appt-time-booked' : ''}${isSelected ? ' appt-time-selected' : ''}`}
                    disabled={isBooked}
                    onClick={() => setSelectedTime(isSelected ? '' : slot)}
                  >
                    {slot}
                    {isBooked && <span className="appt-booked-label">Booked</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {!isReschedule && (
        <div className="appt-scheduler-message">
          <label>Notes (optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Additional notes for this appointment..."
            rows={2}
          />
        </div>
      )}
      <button
        className="btn btn-sm btn-primary appt-schedule-btn"
        disabled={!selectedDate || !selectedTime}
        onClick={handleSchedule}
      >
        <CheckCircle size={14} /> {isReschedule ? 'Reschedule' : 'Schedule Appointment'}
      </button>
    </div>
  );
}
