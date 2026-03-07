import { useState, useMemo } from 'react';
import {
  CalendarDays, Clock, CheckCircle,
} from 'lucide-react';
import { StatusBadge, formatDisplayDate } from './adminUtils';

export default function KanbanView({ appointments, users, onAssign, onStatusChange, canManage, STAFF_COLORS }) {
  const [draggedAppt, setDraggedAppt] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Get all approved staff members
  const staffMembers = useMemo(() => users.filter((u) => u.role !== 'pending'), [users]);

  // Group appointments by assignee
  const unassigned = useMemo(() => appointments.filter((a) => !a.assignedTo), [appointments]);
  const getAssignedTo = (userId) => appointments.filter((a) => a.assignedTo === userId);

  const handleDragStart = (e, appt) => {
    setDraggedAppt(appt);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', appt.id);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, userId) => {
    e.preventDefault();
    if (draggedAppt && canManage) {
      onAssign(draggedAppt.id, userId === 'unassigned' ? null : userId);
    }
    setDraggedAppt(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedAppt(null);
    setDragOverColumn(null);
  };

  const renderCard = (appt, staffColor) => {
    const assignedUser = appt.assignedTo ? users.find((u) => u.id === appt.assignedTo) : null;
    return (
      <div
        key={appt.id}
        className={`kanban-card ${draggedAppt?.id === appt.id ? 'dragging' : ''}`}
        draggable={canManage}
        onDragStart={(e) => handleDragStart(e, appt)}
        onDragEnd={handleDragEnd}
        style={staffColor ? { borderLeftColor: staffColor } : {}}
      >
        <div className="kanban-card-header">
          <strong>{appt.name}</strong>
          <StatusBadge status={appt.status} />
        </div>
        <div className="kanban-card-meta">
          <span><CalendarDays size={12} /> {formatDisplayDate(appt.date)}</span>
          <span><Clock size={12} /> {appt.time}</span>
        </div>
        {appt.service && <div className="kanban-card-service">{appt.service.replace('-', ' ')}</div>}
        {assignedUser && (
          <div className="kanban-card-assignee">
            <span className="staff-dot" style={{ background: assignedUser.color || STAFF_COLORS[0] }}></span>
            {assignedUser.name}
          </div>
        )}
        {canManage && (
          <div className="kanban-card-actions">
            {appt.status === 'pending' && (
              <button className="btn btn-xs btn-confirm" onClick={() => onStatusChange(appt.id, 'confirmed')}>
                <CheckCircle size={12} /> Confirm
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="kanban-board">
      {/* Unassigned Column */}
      <div
        className={`kanban-column ${dragOverColumn === 'unassigned' ? 'drag-over' : ''}`}
        onDragOver={(e) => handleDragOver(e, 'unassigned')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'unassigned')}
      >
        <div className="kanban-column-header">
          <h4>Unassigned</h4>
          <span className="kanban-count">{unassigned.length}</span>
        </div>
        <div className="kanban-column-content">
          {unassigned.map((appt) => renderCard(appt, null))}
          {unassigned.length === 0 && <p className="kanban-empty">No unassigned appointments</p>}
        </div>
      </div>

      {/* Staff Columns */}
      {staffMembers.map((staff, index) => {
        const staffAppts = getAssignedTo(staff.id);
        const staffColor = staff.color || STAFF_COLORS[index % STAFF_COLORS.length];
        return (
          <div
            key={staff.id}
            className={`kanban-column ${dragOverColumn === staff.id ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, staff.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, staff.id)}
          >
            <div className="kanban-column-header" style={{ borderTopColor: staffColor }}>
              <div className="kanban-staff-info">
                <span className="staff-avatar" style={{ background: staffColor }}>{staff.name.charAt(0).toUpperCase()}</span>
                <div>
                  <h4>{staff.name}</h4>
                  <span className="staff-role">{staff.role}</span>
                </div>
              </div>
              <span className="kanban-count">{staffAppts.length}</span>
            </div>
            <div className="kanban-column-content">
              {staffAppts.map((appt) => renderCard(appt, staffColor))}
              {staffAppts.length === 0 && <p className="kanban-empty">Drop appointments here</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
