import { useState, useMemo } from 'react';
import {
  Users, UserPlus, AlertCircle, CheckCircle, Ban,
  Shield, Eye, EyeOff, Edit3, Trash2,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { RoleBadge } from './adminUtils';

export default function UserManagement() {
  const { users, addUser, updateUser, deleteUser, currentUser, ROLES, approveUser, rejectUser } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState({});
  const [approveRoles, setApproveRoles] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [rejectConfirm, setRejectConfirm] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', role: 'developer' });
  const resetForm = () => { setForm({ username: '', password: '', name: '', email: '', role: 'developer' }); setShowForm(false); setEditingId(null); setError(''); };
  const handleSubmit = (e) => {
    e.preventDefault(); setError('');
    if (editingId) {
      const updates = { ...form }; if (!updates.password) delete updates.password;
      const result = updateUser(editingId, updates);
      if (!result.success) { setError(result.error); return; }
    } else {
      if (!form.password) { setError('Password is required'); return; }
      const result = addUser(form);
      if (!result.success) { setError(result.error); return; }
    }
    resetForm();
  };
  const startEdit = (user) => { setForm({ username: user.username, password: '', name: user.name, email: user.email, role: user.role }); setEditingId(user.id); setShowForm(true); setError(''); };

  const pendingUsers = useMemo(() => users.filter((u) => u.status === 'pending'), [users]);
  const approvedUsers = useMemo(() => users.filter((u) => u.status !== 'pending' && u.status !== 'rejected'), [users]);
  const rejectedUsers = useMemo(() => users.filter((u) => u.status === 'rejected'), [users]);

  const handleApprove = (userId) => {
    const role = approveRoles[userId] || 'developer';
    approveUser(userId, role);
    setApproveRoles((prev) => { const next = { ...prev }; delete next[userId]; return next; });
  };

  return (
    <div className="user-management">
      <div className="um-header">
        <h2><Users size={20} /> User Management <span className="count-badge">{approvedUsers.length}</span></h2>
        {!showForm && <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true); }}><UserPlus size={16} /> Add User</button>}
      </div>
      {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Pending Registrations */}
      {pendingUsers.length > 0 && (
        <div className="pending-section">
          <h3 className="pending-section-title">
            <AlertCircle size={18} /> Pending Registrations
            <span className="count-badge" style={{ background: 'var(--warning)' }}>{pendingUsers.length}</span>
          </h3>
          <div className="pending-list">
            {pendingUsers.map((user) => (
              <div key={user.id} className="pending-card">
                <div className="pending-card-top">
                  <div className="user-avatar pending-avatar">{user.name.charAt(0).toUpperCase()}</div>
                  <div className="user-info">
                    <div className="user-name-row"><strong>{user.name}</strong><span className="pending-status-tag">Pending</span></div>
                    <span className="user-username">@{user.username}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                </div>
                <div className="pending-card-meta">
                  <span>Registered {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="pending-card-actions">
                  <div className="pending-role-select">
                    <label>Assign Role:</label>
                    <select
                      value={approveRoles[user.id] || 'developer'}
                      onChange={(e) => setApproveRoles((prev) => ({ ...prev, [user.id]: e.target.value }))}
                      className="filter-select"
                    >
                      {Object.entries(ROLES).map(([key, role]) => (
                        <option key={key} value={key}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn btn-sm btn-confirm" onClick={() => handleApprove(user.id)}>
                    <CheckCircle size={14} /> Approve
                  </button>
                  {rejectConfirm === user.id ? (
                    <div className="delete-confirm-inline">
                      <span>Reject?</span>
                      <button className="btn btn-sm btn-delete" onClick={() => { rejectUser(user.id); setRejectConfirm(null); }}>Yes</button>
                      <button className="btn btn-sm btn-outline" onClick={() => setRejectConfirm(null)}>No</button>
                    </div>
                  ) : (
                    <button className="btn btn-sm btn-delete" onClick={() => setRejectConfirm(user.id)}>
                      <Ban size={14} /> Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejected Users */}
      {rejectedUsers.length > 0 && (
        <div className="rejected-section">
          <h3 className="pending-section-title">
            <Ban size={18} /> Rejected
            <span className="count-badge" style={{ background: 'var(--danger)' }}>{rejectedUsers.length}</span>
          </h3>
          <div className="pending-list">
            {rejectedUsers.map((user) => (
              <div key={user.id} className="pending-card rejected-card">
                <div className="pending-card-top">
                  <div className="user-avatar rejected-avatar">{user.name.charAt(0).toUpperCase()}</div>
                  <div className="user-info">
                    <div className="user-name-row"><strong>{user.name}</strong><span className="rejected-status-tag">Rejected</span></div>
                    <span className="user-username">@{user.username}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                </div>
                <div className="pending-card-actions">
                  <div className="pending-role-select">
                    <label>Assign Role:</label>
                    <select
                      value={approveRoles[user.id] || 'developer'}
                      onChange={(e) => setApproveRoles((prev) => ({ ...prev, [user.id]: e.target.value }))}
                      className="filter-select"
                    >
                      {Object.entries(ROLES).map(([key, role]) => (
                        <option key={key} value={key}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn btn-sm btn-confirm" onClick={() => handleApprove(user.id)}>
                    <CheckCircle size={14} /> Approve
                  </button>
                  {deleteConfirm === `rejected-${user.id}` ? (
                    <div className="delete-confirm-inline">
                      <span>Remove?</span>
                      <button className="btn btn-sm btn-delete" onClick={() => { deleteUser(user.id); setDeleteConfirm(null); }}>Yes</button>
                      <button className="btn btn-sm btn-outline" onClick={() => setDeleteConfirm(null)}>No</button>
                    </div>
                  ) : (
                    <button className="btn btn-sm btn-delete" onClick={() => setDeleteConfirm(`rejected-${user.id}`)}>
                      <Trash2 size={14} /> Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="um-form-card">
          <h3>{editingId ? 'Edit User' : 'Register New User'}</h3>
          <form onSubmit={handleSubmit} className="um-form">
            <div className="form-row">
              <div className="form-group"><label>Full Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Username *</label><input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
              <div className="form-group"><label>{editingId ? 'New Password (leave blank to keep)' : 'Password *'}</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingId} /></div>
            </div>
            <div className="form-group">
              <label>Role *</label>
              <div className="role-selector">
                {Object.entries(ROLES).map(([key, role]) => (
                  <label key={key} className={`role-option ${form.role === key ? 'selected' : ''}`}>
                    <input type="radio" name="role" value={key} checked={form.role === key} onChange={(e) => setForm({ ...form, role: e.target.value })} />
                    <div><strong>{role.label}</strong><span>{role.description}</span></div>
                  </label>
                ))}
              </div>
            </div>
            <div className="um-form-actions">
              <button type="submit" className="btn btn-primary btn-sm">{editingId ? 'Update User' : 'Create User'}</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      <div className="users-list">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--dark)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} /> Active Users
        </h3>
        {approvedUsers.map((user) => (
          <div key={user.id} className={`user-card ${user.id === currentUser?.id ? 'current-user' : ''}`}>
            <div className="user-card-top">
              <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <div className="user-name-row"><strong>{user.name}</strong>{user.id === currentUser?.id && <span className="you-badge">You</span>}</div>
                <span className="user-username">@{user.username}</span>
                <span className="user-email">{user.email}</span>
              </div>
              <RoleBadge role={user.role} />
            </div>
            <div className="user-card-meta">
              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              {user.id === currentUser?.id && (
                <div className="user-password-peek">
                  <button className="btn-icon" onClick={() => setShowPasswords((p) => ({ ...p, [user.id]: !p[user.id] }))}>{showPasswords[user.id] ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  {showPasswords[user.id] && <code className="password-reveal">{user.password}</code>}
                </div>
              )}
            </div>
            <div className="user-card-actions">
              <button className="btn btn-sm btn-outline" onClick={() => startEdit(user)}><Edit3 size={14} /> Edit</button>
              {user.id !== '1' && user.id !== currentUser?.id && (
                deleteConfirm === user.id ? (
                  <div className="delete-confirm-inline">
                    <span>Delete?</span>
                    <button className="btn btn-sm btn-delete" onClick={() => { deleteUser(user.id); setDeleteConfirm(null); }}>Yes</button>
                    <button className="btn btn-sm btn-outline" onClick={() => setDeleteConfirm(null)}>No</button>
                  </div>
                ) : (
                  <button className="btn btn-sm btn-delete" onClick={() => setDeleteConfirm(user.id)}><Trash2 size={14} /> Delete</button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
