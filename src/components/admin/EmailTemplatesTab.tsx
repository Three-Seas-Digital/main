import { useState } from 'react';
import { Mail, Plus, Edit3, Trash2, Save, X, RotateCcw } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const CATEGORY_OPTIONS = ['general', 'invoice', 'follow-up', 'project', 'onboarding'];
const DEFAULT_IDS = ['invoice-reminder', 'appointment-confirmation', 'follow-up', 'project-complete', 'welcome'];

export default function EmailTemplatesTab() {
  const {
    emailTemplates, addEmailTemplate, updateEmailTemplate,
    deleteEmailTemplate, resetEmailTemplates,
  } = useAppContext();

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', subject: '', body: '', category: 'general' });
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', subject: '', body: '', category: 'general' });

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditForm({ name: t.name, subject: t.subject, body: t.body, category: t.category || 'general' });
  };

  const saveEdit = () => {
    if (!editForm.name || !editForm.subject) return;
    updateEmailTemplate(editingId, editForm);
    setEditingId(null);
  };

  const handleCreate = () => {
    if (!newForm.name || !newForm.subject) return;
    addEmailTemplate(newForm);
    setNewForm({ name: '', subject: '', body: '', category: 'general' });
    setShowNew(false);
  };

  const handleDelete = (id) => {
    const result = deleteEmailTemplate(id);
    if (!result.success) alert(result.error);
  };

  return (
    <div className="email-templates-tab">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={20} /> Email Templates
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm btn-outline" onClick={resetEmailTemplates}>
            <RotateCcw size={14} /> Reset Defaults
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => setShowNew(!showNew)}>
            <Plus size={14} /> New Template
          </button>
        </div>
      </div>

      <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '16px' }}>
        Merge fields: <code>{'{clientName}'}</code>, <code>{'{invoiceId}'}</code>, <code>{'{amount}'}</code>, <code>{'{dueDate}'}</code>, <code>{'{projectName}'}</code>.
        The <strong>Welcome</strong> template body is used in the branded HTML welcome email sent during onboarding.
      </p>

      {showNew && (
        <div style={{ background: 'var(--gray-50, #f9fafb)', border: '1px solid var(--gray-200, #e5e7eb)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>New Template</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <input className="form-input" placeholder="Template name" value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} />
            <select className="form-input" value={newForm.category} onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}>
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <input className="form-input" placeholder="Subject line" value={newForm.subject} onChange={(e) => setNewForm({ ...newForm, subject: e.target.value })} style={{ width: '100%', marginBottom: '12px' }} />
          <textarea className="form-input" placeholder="Email body text..." value={newForm.body} onChange={(e) => setNewForm({ ...newForm, body: e.target.value })} rows={6} style={{ width: '100%', marginBottom: '12px', resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-sm btn-primary" onClick={handleCreate}><Save size={14} /> Create</button>
            <button className="btn btn-sm btn-outline" onClick={() => setShowNew(false)}><X size={14} /> Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {emailTemplates.map((t) => (
          <div key={t.id} style={{ background: 'var(--gray-50, #f9fafb)', border: '1px solid var(--gray-200, #e5e7eb)', borderRadius: '8px', padding: '16px' }}>
            {editingId === t.id ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <input className="form-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  <select className="form-input" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                    {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <input className="form-input" value={editForm.subject} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })} style={{ width: '100%', marginBottom: '12px' }} />
                <textarea className="form-input" value={editForm.body} onChange={(e) => setEditForm({ ...editForm, body: e.target.value })} rows={6} style={{ width: '100%', marginBottom: '12px', resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-sm btn-primary" onClick={saveEdit}><Save size={14} /> Save</button>
                  <button className="btn btn-sm btn-outline" onClick={() => setEditingId(null)}><X size={14} /> Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '1rem' }}>{t.name}</strong>
                    <span style={{ marginLeft: '8px', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--gray-200, #e5e7eb)', color: 'var(--gray-600, #4b5563)' }}>{t.category || 'general'}</span>
                    {DEFAULT_IDS.includes(t.id) && <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#6b7280' }}>(default)</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-sm btn-outline" onClick={() => startEdit(t)}><Edit3 size={14} /></button>
                    {!DEFAULT_IDS.includes(t.id) && (
                      <button className="btn btn-sm btn-outline" style={{ color: '#ef4444' }} onClick={() => handleDelete(t.id)}><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>
                  <strong>Subject:</strong> {t.subject}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', whiteSpace: 'pre-wrap', maxHeight: '80px', overflow: 'hidden' }}>
                  {t.body}
                </div>
              </>
            )}
          </div>
        ))}
        {emailTemplates.length === 0 && (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px' }}>No email templates. Click "Reset Defaults" to restore built-in templates.</p>
        )}
      </div>
    </div>
  );
}
