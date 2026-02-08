import { useState, useEffect } from 'react';
import { Timer, PlayCircle, StopCircle, Plus } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function TimeTracker({ clientId, projectId, taskId }) {
  const { addTimeEntry, timeEntries, currentUser } = useAppContext();
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ hours: '', description: '', date: new Date().toISOString().split('T')[0] });

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setStartTime(Date.now());
    setIsTracking(true);
    setElapsed(0);
  };

  const handleStop = () => {
    if (elapsed > 60) { // Only save if more than 1 minute
      const hours = (elapsed / 3600).toFixed(2);
      addTimeEntry({
        clientId,
        projectId,
        taskId,
        hours: parseFloat(hours),
        description: 'Time tracked',
        date: new Date().toISOString().split('T')[0],
        billable: true,
      });
    }
    setIsTracking(false);
    setStartTime(null);
    setElapsed(0);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualForm.hours) return;
    addTimeEntry({
      clientId,
      projectId,
      taskId,
      hours: parseFloat(manualForm.hours),
      description: manualForm.description,
      date: manualForm.date,
      billable: true,
    });
    setManualForm({ hours: '', description: '', date: new Date().toISOString().split('T')[0] });
    setShowManual(false);
  };

  // Get total hours for this project
  const projectHours = timeEntries
    .filter((e) => e.projectId === projectId)
    .reduce((sum, e) => sum + e.hours, 0);

  return (
    <div className="time-tracker">
      <div className="time-tracker-header">
        <Timer size={16} />
        <span>Time Tracking</span>
        <span className="time-tracker-total">{projectHours.toFixed(1)}h logged</span>
      </div>

      <div className="time-tracker-controls">
        {isTracking ? (
          <>
            <div className="time-tracker-display">{formatTime(elapsed)}</div>
            <button className="btn btn-sm btn-danger" onClick={handleStop}>
              <StopCircle size={14} /> Stop
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-sm btn-primary" onClick={handleStart}>
              <PlayCircle size={14} /> Start Timer
            </button>
            <button className="btn btn-sm btn-outline" onClick={() => setShowManual(!showManual)}>
              <Plus size={14} /> Manual Entry
            </button>
          </>
        )}
      </div>

      {showManual && (
        <form onSubmit={handleManualSubmit} className="time-tracker-form">
          <div className="time-tracker-form-row">
            <input
              type="number"
              step="0.25"
              min="0"
              placeholder="Hours"
              value={manualForm.hours}
              onChange={(e) => setManualForm({ ...manualForm, hours: e.target.value })}
              required
            />
            <input
              type="date"
              value={manualForm.date}
              onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
            />
          </div>
          <input
            type="text"
            placeholder="Description (optional)"
            value={manualForm.description}
            onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
          />
          <div className="time-tracker-form-actions">
            <button type="submit" className="btn btn-sm btn-primary">Add</button>
            <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowManual(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
