import { useState } from 'react';
import {
  FolderKanban, Mail, Phone, Trash2, Users, Building2, Calendar, RotateCcw, AlertTriangle,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { TierBadge } from './adminUtils';

export default function ArchivedTab() {
  const {
    appointments, updateFollowUp, deleteAppointment,
    clients, restoreClient, permanentlyDeleteClient,
    hasPermission,
  } = useAppContext();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [permDeleteInput, setPermDeleteInput] = useState('');
  const [activeSection, setActiveSection] = useState('clients');
  const canDelete = hasPermission('delete_clients');

  const archivedClients = clients.filter((c) => c.status === 'archived');
  const archivedFollowUps = appointments.filter((a) => a.followUp && a.followUp.status === 'archived');

  const handleUnarchiveFollowUp = (apptId) => {
    updateFollowUp(apptId, { status: 'pending' });
  };

  const handleRestoreClient = (clientId) => {
    restoreClient(clientId);
  };

  const handlePermDeleteClient = (clientId) => {
    permanentlyDeleteClient(clientId);
    setDeleteConfirm(null);
    setPermDeleteInput('');
  };

  return (
    <div className="archived-tab">
      {/* Section Toggles */}
      <div className="archived-section-toggles">
        <button
          className={`archived-section-btn ${activeSection === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveSection('clients')}
        >
          <Users size={16} /> Archived Clients
          {archivedClients.length > 0 && <span className="tab-badge">{archivedClients.length}</span>}
        </button>
        <button
          className={`archived-section-btn ${activeSection === 'followups' ? 'active' : ''}`}
          onClick={() => setActiveSection('followups')}
        >
          <FolderKanban size={16} /> Archived Follow-Ups
          {archivedFollowUps.length > 0 && <span className="tab-badge">{archivedFollowUps.length}</span>}
        </button>
      </div>

      {/* Archived Clients Section */}
      {activeSection === 'clients' && (
        <>
          <div className="archived-header">
            <h3><Users size={20} /> Archived Clients</h3>
            <span className="archived-count">{archivedClients.length} client{archivedClients.length !== 1 ? 's' : ''}</span>
          </div>

          {archivedClients.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <p>No archived clients</p>
              <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Clients you archive will appear here</span>
            </div>
          ) : (
            <div className="archived-list">
              {archivedClients.map((client) => (
                <div key={client.id} className="archived-card">
                  <div className="archived-card-header">
                    <strong>{client.name}</strong>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <TierBadge tier={client.tier || 'free'} />
                      <span className="archived-date">Archived</span>
                    </div>
                  </div>
                  <div className="archived-card-meta">
                    <span><Mail size={12} /> {client.email}</span>
                    {client.phone && <span><Phone size={12} /> {client.phone}</span>}
                    {client.businessName && <span><Building2 size={12} /> {client.businessName}</span>}
                    {client.archivedAt && (
                      <span><Calendar size={12} /> {new Date(client.archivedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  {client.archivedBy && (
                    <div className="archived-card-note">
                      <p>Archived by: {client.archivedBy}</p>
                    </div>
                  )}
                  <div className="archived-card-actions">
                    <button className="btn btn-sm btn-primary" onClick={() => handleRestoreClient(client.id)}>
                      <RotateCcw size={14} /> Restore
                    </button>
                    {canDelete && (
                      deleteConfirm === client.id ? (
                        <div className="archived-delete-confirm">
                          <span><AlertTriangle size={14} /> Type <strong>DELETE</strong> to confirm permanent deletion:</span>
                          <input
                            type="text"
                            value={permDeleteInput}
                            onChange={(e) => setPermDeleteInput(e.target.value)}
                            placeholder="Type DELETE"
                            className="delete-confirm-input"
                            autoFocus
                          />
                          {permDeleteInput === 'DELETE' ? (
                            <button className="btn btn-sm btn-danger" onClick={() => handlePermDeleteClient(client.id)}>
                              <Trash2 size={14} /> Permanently Delete
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-outline" onClick={() => { setDeleteConfirm(null); setPermDeleteInput(''); }}>Cancel</button>
                          )}
                        </div>
                      ) : (
                        <button className="btn btn-sm btn-danger-outline" onClick={() => setDeleteConfirm(client.id)}>
                          <Trash2 size={14} /> Permanently Delete
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Archived Follow-Ups Section */}
      {activeSection === 'followups' && (
        <>
          <div className="archived-header">
            <h3><FolderKanban size={20} /> Archived Follow-Ups</h3>
            <span className="archived-count">{archivedFollowUps.length} item{archivedFollowUps.length !== 1 ? 's' : ''}</span>
          </div>

          {archivedFollowUps.length === 0 ? (
            <div className="empty-state">
              <FolderKanban size={48} />
              <p>No archived follow-ups</p>
              <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Archived follow-ups will appear here</span>
            </div>
          ) : (
            <div className="archived-list">
              {archivedFollowUps.map((appt) => (
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
                    <button className="btn btn-sm btn-primary" onClick={() => handleUnarchiveFollowUp(appt.id)}>
                      <RotateCcw size={14} /> Restore
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
        </>
      )}
    </div>
  );
}
