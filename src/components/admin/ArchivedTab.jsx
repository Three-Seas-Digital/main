import { useState } from 'react';
import {
  FolderKanban, Mail, Phone, Trash2,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function ArchivedTab() {
  const { appointments, updateFollowUp, deleteAppointment, currentUser } = useAppContext();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const archivedItems = appointments.filter((a) => a.followUp && a.followUp.status === 'archived');

  const handleUnarchive = (apptId) => {
    updateFollowUp(apptId, { status: 'pending' });
  };

  return (
    <div className="archived-tab">
      <div className="archived-header">
        <h3><FolderKanban size={20} /> Follow-ups Archived</h3>
        <span className="archived-count">{archivedItems.length} item{archivedItems.length !== 1 ? 's' : ''}</span>
      </div>

      {archivedItems.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={48} />
          <p>No archived items</p>
        </div>
      ) : (
        <div className="archived-list">
          {archivedItems.map((appt) => (
            <div key={appt.id} className="archived-card">
              <div className="archived-card-header">
                <strong>{appt.name}</strong>
                <span className="archived-date">Archived</span>
              </div>
              <div className="archived-card-meta">
                <span><Mail size={12} /> {appt.email}</span>
                {appt.phone && <span><Phone size={12} /> {appt.phone}</span>}
                {appt.service && <span>Service: {appt.service.replace('-', ' ')}</span>}
              </div>
              {appt.followUp?.note && (
                <div className="archived-card-note">
                  <p>{appt.followUp.note}</p>
                </div>
              )}
              <div className="archived-card-actions">
                <button className="btn btn-sm btn-primary" onClick={() => handleUnarchive(appt.id)}>
                  <FolderKanban size={14} /> Restore
                </button>
                {canDelete && (
                  deleteConfirm === appt.id ? (
                    <div className="archived-delete-confirm">
                      <span>Delete permanently?</span>
                      <button className="btn btn-sm btn-danger" onClick={() => { deleteAppointment(appt.id); setDeleteConfirm(null); }}>
                        <Trash2 size={14} /> Yes
                      </button>
                      <button className="btn btn-sm btn-outline" onClick={() => setDeleteConfirm(null)}>No</button>
                    </div>
                  ) : (
                    <button className="btn btn-sm btn-danger-outline" onClick={() => setDeleteConfirm(appt.id)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
