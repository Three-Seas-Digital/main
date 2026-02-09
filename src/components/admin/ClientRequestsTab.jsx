import { useState, useMemo } from 'react';
import {
  Clock, Mail, Phone, CheckCircle, XCircle,
  UserPlus, UserCheck, Building2,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function ClientRequestsTab() {
  const { clients, approveClient, rejectClient } = useAppContext();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectConfirm, setRejectConfirm] = useState(null);

  const pendingClients = useMemo(() => clients.filter((c) => c.status === 'pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [clients]);

  const handleApprove = (id) => {
    approveClient(id);
    setSelectedRequest(null);
  };

  const handleReject = (id) => {
    rejectClient(id);
    setRejectConfirm(null);
    setSelectedRequest(null);
  };

  const selected = selectedRequest ? pendingClients.find((c) => c.id === selectedRequest) : null;

  return (
    <div className="client-requests-tab">
      <div className="requests-header">
        <h2><UserPlus size={20} /> Client Requests</h2>
        <p>{pendingClients.length} pending registration{pendingClients.length !== 1 ? 's' : ''}</p>
      </div>

      {pendingClients.length === 0 ? (
        <div className="requests-empty">
          <UserCheck size={48} />
          <h3>No pending requests</h3>
          <p>New client registrations will appear here for approval</p>
        </div>
      ) : (
        <div className="requests-layout">
          <div className="requests-list">
            {pendingClients.map((client) => (
              <div
                key={client.id}
                className={`request-card ${selectedRequest === client.id ? 'selected' : ''}`}
                onClick={() => setSelectedRequest(client.id)}
              >
                <div className="request-card-header">
                  <div className="request-avatar">{client.name.charAt(0).toUpperCase()}</div>
                  <div className="request-info">
                    <strong>{client.name}</strong>
                    <span>{client.email}</span>
                  </div>
                </div>
                <div className="request-meta">
                  <span><Clock size={12} /> {new Date(client.createdAt).toLocaleDateString()}</span>
                  {client.businessName && <span><Building2 size={12} /> {client.businessName}</span>}
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div className="request-detail">
              <div className="request-detail-header">
                <div className="request-detail-avatar">{selected.name.charAt(0).toUpperCase()}</div>
                <div>
                  <h3>{selected.name}</h3>
                  <span className="request-pending-badge">Pending Approval</span>
                </div>
              </div>

              <div className="request-detail-section">
                <h4>Contact Information</h4>
                <div className="request-detail-grid">
                  <div className="request-field">
                    <label><Mail size={14} /> Email</label>
                    <span>{selected.email}</span>
                  </div>
                  {selected.phone && (
                    <div className="request-field">
                      <label><Phone size={14} /> Phone</label>
                      <span>{selected.phone}</span>
                    </div>
                  )}
                  {selected.businessName && (
                    <div className="request-field">
                      <label><Building2 size={14} /> Business</label>
                      <span>{selected.businessName}</span>
                    </div>
                  )}
                </div>
              </div>

              {(selected.street || selected.city) && (
                <div className="request-detail-section">
                  <h4>Address</h4>
                  <p className="request-address">
                    {selected.street && <>{selected.street}<br /></>}
                    {selected.city && <>{selected.city}, {selected.state} {selected.zip}</>}
                  </p>
                </div>
              )}

              <div className="request-detail-section">
                <h4>Registration Details</h4>
                <div className="request-detail-grid">
                  <div className="request-field">
                    <label>Registered</label>
                    <span>{new Date(selected.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="request-field">
                    <label>Auth Method</label>
                    <span>{selected.authMethod === 'google' ? 'Google Account' : 'Email/Password'}</span>
                  </div>
                  <div className="request-field">
                    <label>Source</label>
                    <span>{selected.source || 'Self-registration'}</span>
                  </div>
                </div>
              </div>

              <div className="request-actions">
                {rejectConfirm === selected.id ? (
                  <div className="reject-confirm">
                    <span>Reject this request?</span>
                    <button className="btn btn-danger btn-sm" onClick={() => handleReject(selected.id)}>
                      <XCircle size={14} /> Confirm Reject
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => setRejectConfirm(null)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <button className="btn btn-primary" onClick={() => handleApprove(selected.id)}>
                      <CheckCircle size={16} /> Approve Client
                    </button>
                    <button className="btn btn-outline-danger" onClick={() => setRejectConfirm(selected.id)}>
                      <XCircle size={16} /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
