import { useState, useMemo } from 'react';
import {
  CalendarDays, User, Mail, Phone, Trash2,
  CheckCircle, AlertCircle, BarChart3, Users,
  UserPlus, UserCheck, Edit3, Eye, Plus, X, Tag, FileText,
  ArrowRight, ChevronLeft, ChevronUp, ChevronDown, Briefcase, Send, FolderKanban, Flag,
  DollarSign, Receipt, CreditCard, MapPin,
  RefreshCw, Download, Upload, PhoneForwarded, Lock,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { StatusBadge, FollowUpBadge, TierBadge, formatDisplayDate } from './adminUtils';
import ProjectBoard from './ProjectBoard';
import { downloadDocumentFromR2 } from '../../utils/documentStorage';
import { generateContractPdf, generateProposalPdf, generateIntakePdf } from '../../utils/generateOnboardingPdfs';
import { safeGetItem } from '../../constants';

export default function ClientsTab({ onClientViewed }) {
  const {
    clients, updateClient, addClientNote, deleteClientNote,
    addClientTag, removeClientTag, archiveClient, restoreClient, permanentlyDeleteClient, addClientManually,
    hasPermission, appointments, updateAppointment, updateFollowUp, markFollowUp,
    currentUser, users, STAFF_COLORS,
    addInvoice, markInvoicePaid, unmarkInvoicePaid, deleteInvoice,
    updateClientTier, payments, SUBSCRIPTION_TIERS, RECURRING_FREQUENCIES,
    addClientDocument, deleteClientDocument, DOCUMENT_TYPES,
    changeClientPassword, reopenOnboarding,
  } = useAppContext();
  const canManage = hasPermission('manage_clients');
  const canDelete = hasPermission('delete_clients');
  const [selectedClient, setSelectedClient] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', service: '' });
  const [addError, setAddError] = useState('');
  const [confirmArchive, setConfirmArchive] = useState(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState(null);
  const [confirmReopenOnboarding, setConfirmReopenOnboarding] = useState(null);
  const [showArchivedClients, setShowArchivedClients] = useState(false);
  const [filterTier, setFilterTier] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ title: '', amount: '', dueDate: '', description: '', recurring: false, frequency: 'monthly' });
  const [invoiceError, setInvoiceError] = useState('');
  const [editingClient, setEditingClient] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', businessName: '', phone: '', street: '', city: '', state: '', zip: '', dateOfBirth: '' });
  const [editSuccess, setEditSuccess] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [draggedClient, setDraggedClient] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [editingAppt, setEditingAppt] = useState(null);
  const [apptEditForm, setApptEditForm] = useState({ date: '', time: '', service: '', status: '', message: '' });
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [followUpForm, setFollowUpForm] = useState({ note: '', priority: 'normal', followUpDate: '', status: 'pending' });
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [documentForm, setDocumentForm] = useState({ name: '', type: 'other', description: '' });
  const [documentFile, setDocumentFile] = useState(null);
  const [documentError, setDocumentError] = useState('');
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [deleteDocConfirm, setDeleteDocConfirm] = useState(null);
  const [loadingDocId, setLoadingDocId] = useState(null);
  const [deleteNoteConfirm, setDeleteNoteConfirm] = useState(null);
  const [deleteInvoiceConfirm, setDeleteInvoiceConfirm] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [tempPasswordVisible, setTempPasswordVisible] = useState(false);

  // Select and mark client as viewed
  const handleSelectClient = (clientId) => {
    setSelectedClient(clientId);
    if (onClientViewed) onClientViewed(clientId);
  };

  // Staff members for kanban
  const staffMembers = useMemo(() => users.filter((u) => u.status === 'approved' && u.role !== 'pending'), [users]);

  // Drag and drop handlers
  const handleDragStart = (e, client) => {
    setDraggedClient(client);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };
  const handleDragLeave = () => setDragOverColumn(null);
  const handleDrop = (e, userId) => {
    e.preventDefault();
    if (draggedClient && canManage) {
      updateClient(draggedClient.id, { assignedTo: userId === 'unassigned' ? null : userId });
    }
    setDraggedClient(null);
    setDragOverColumn(null);
  };
  const handleDragEnd = () => { setDraggedClient(null); setDragOverColumn(null); };

  // Active clients (exclude pending and archived)
  const filtered = useMemo(() => clients
    .filter((c) => c.status !== 'pending' && c.status !== 'archived')
    .filter((c) => !c.onboarding || c.onboarding.complete)
    .filter((c) => filterStatus === 'all' || c.status === filterStatus)
    .filter((c) => filterTier === 'all' || (c.tier || 'free') === filterTier)
    .filter((c) => filterService === 'all' || c.service === filterService)
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name-az': return a.name.localeCompare(b.name);
        case 'name-za': return b.name.localeCompare(a.name);
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    }), [clients, filterStatus, filterTier, filterService, search, sortBy]);

  // Archived clients
  const archivedClients = useMemo(() => clients.filter((c) => c.status === 'archived'), [clients]);

  const client = useMemo(() => selectedClient ? clients.find((c) => c.id === selectedClient) : null, [selectedClient, clients]);
  const clientAppointments = useMemo(() => client ? appointments.filter((a) => a.clientId === client.id || a.email?.toLowerCase() === client.email?.toLowerCase()) : [], [client, appointments]);

  const handleAddClient = (e) => {
    e.preventDefault();
    setAddError('');
    const result = addClientManually(addForm);
    if (!result.success) { setAddError(result.error); return; }
    setAddForm({ name: '', email: '', phone: '', service: '' });
    setShowAddForm(false);
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedClient) return;
    addClientNote(selectedClient, newNote);
    setNewNote('');
  };

  const handleAddTag = () => {
    if (!newTag.trim() || !selectedClient) return;
    addClientTag(selectedClient, newTag.trim());
    setNewTag('');
  };

  const handleArchiveClient = (id) => {
    archiveClient(id);
    setConfirmArchive(null);
    if (selectedClient === id) setSelectedClient(null);
  };


  const handleRestoreClient = (id) => {
    restoreClient(id);
  };

  const handlePermanentDelete = (id) => {
    permanentlyDeleteClient(id);
    setConfirmPermanentDelete(null);
  };

  const startEditClient = () => {
    setEditForm({
      name: client.name || '',
      businessName: client.businessName || '',
      phone: client.phone || '',
      street: client.street || '',
      city: client.city || '',
      state: client.state || '',
      zip: client.zip || '',
      dateOfBirth: client.dateOfBirth || '',
    });
    setEditingClient(true);
    setEditSuccess('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMsg({ type: '', text: '' });
    setTempPasswordVisible(false);
  };

  const handleSaveClientEdit = (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return;

    // Handle password change if fields are filled
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) { setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters' }); return; }
      if (newPassword !== confirmPassword) { setPasswordMsg({ type: 'error', text: 'Passwords do not match' }); return; }
      const pwResult = changeClientPassword(client.id, newPassword);
      if (!pwResult.success) { setPasswordMsg({ type: 'error', text: pwResult.error }); return; }
    }

    updateClient(client.id, {
      name: editForm.name.trim(),
      businessName: editForm.businessName.trim(),
      phone: editForm.phone.trim(),
      street: editForm.street.trim(),
      city: editForm.city.trim(),
      state: editForm.state.trim(),
      zip: editForm.zip.trim(),
      dateOfBirth: editForm.dateOfBirth,
    });
    setEditingClient(false);
    setEditSuccess(newPassword ? 'Client info & password updated' : 'Client info updated');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMsg({ type: '', text: '' });
    setTimeout(() => setEditSuccess(''), 3000);
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    setDocumentError('');

    if (!documentFile) {
      setDocumentError('Please select a file');
      return;
    }
    if (!documentForm.name.trim()) {
      setDocumentError('Please enter a document name');
      return;
    }

    // Check file size (max 5MB for localStorage)
    if (documentFile.size > 5 * 1024 * 1024) {
      setDocumentError('File size must be less than 5MB');
      return;
    }

    setUploadingDocument(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = () => {
        addClientDocument(client.id, {
          name: documentForm.name.trim(),
          type: documentForm.type,
          description: documentForm.description.trim(),
          fileData: reader.result,
          fileType: documentFile.type,
          fileSize: documentFile.size,
        });

        // Reset form
        setDocumentForm({ name: '', type: 'other', description: '' });
        setDocumentFile(null);
        setShowDocumentForm(false);
        setUploadingDocument(false);
      };
      reader.onerror = () => {
        setDocumentError('Failed to read file');
        setUploadingDocument(false);
      };
      reader.readAsDataURL(documentFile);
    } catch {
      setDocumentError('Failed to upload document');
      setUploadingDocument(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const fetchDocData = async (doc) => {
    if (doc.fileData) return doc.fileData;
    // Fetch from R2
    try {
      const dataUri = await downloadDocumentFromR2(doc.id);
      if (dataUri) return dataUri;
    } catch { /* ignore */ }
    return null;
  };

  const handleViewDocument = async (doc) => {
    if (doc.fileData) {
      setViewingDocument(doc);
      return;
    }
    setLoadingDocId(doc.id);
    const data = await fetchDocData(doc);
    setLoadingDocId(null);
    setViewingDocument(data ? { ...doc, fileData: data } : doc);
  };

  const downloadDocument = async (doc) => {
    const href = await fetchDocData(doc);
    if (!href) return;
    const link = document.createElement('a');
    link.href = href;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Regenerate a missing onboarding document PDF and upload to R2
  const handleRegenerateDocument = async (doc) => {
    if (!client) return;
    const docType = doc.type; // intake, contract, proposal, welcome_packet
    const tierData = SUBSCRIPTION_TIERS[client.tier] || SUBSCRIPTION_TIERS.free;
    const intakes = safeGetItem('threeseas_bi_intakes', {});
    const intakeData = intakes[client.id] || {};
    const onbEntry = client.onboarding?.documents?.[docType] || {};
    const sigOpts = onbEntry.signatureData ? { signatureData: onbEntry.signatureData, signedAt: onbEntry.signedAt } : {};

    setLoadingDocId(doc.id);
    try {
      let pdfData;
      if (docType === 'contract') {
        pdfData = await generateContractPdf(client, tierData, sigOpts);
      } else if (docType === 'proposal') {
        pdfData = await generateProposalPdf(client, tierData, intakeData, {}, sigOpts);
      } else if (docType === 'intake') {
        pdfData = await generateIntakePdf(client, intakeData);
      }
      if (pdfData) {
        pdfData.description = onbEntry.signatureData
          ? `${doc.name} — signed and approved`
          : `${doc.name} — regenerated`;
        addClientDocument(client.id, pdfData);
        setViewingDocument({ ...doc, fileData: pdfData.fileData });
      }
    } catch (err) {
      console.error('[ClientsTab] Regenerate failed:', err);
    } finally {
      setLoadingDocId(null);
    }
  };

  // Client detail view
  if (client) {
    return (
      <div className="client-detail">
        <button className="btn btn-sm btn-outline client-back" onClick={() => setSelectedClient(null)}>
          <ChevronLeft size={16} /> Back to Clients
        </button>

        <div className="client-profile">
          {editSuccess && <div className="profile-success"><CheckCircle size={16} /> {editSuccess}</div>}
          <div className="client-profile-header">
            <div className="client-avatar-lg">{client.name.charAt(0).toUpperCase()}</div>
            <div className="client-profile-info">
              {editingClient ? (
                <form onSubmit={handleSaveClientEdit} className="admin-edit-client-form">
                  <div className="admin-edit-row">
                    <label><User size={14} /> Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-edit-row">
                    <label><Briefcase size={14} /> Business Name</label>
                    <input type="text" value={editForm.businessName} onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })} placeholder="Company / Business name" />
                  </div>
                  <div className="admin-edit-row">
                    <label><Mail size={14} /> Email</label>
                    <input type="email" value={client.email} disabled />
                  </div>
                  <div className="admin-edit-row">
                    <label><Phone size={14} /> Phone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="admin-edit-row">
                    <label><MapPin size={14} /> Street</label>
                    <input type="text" value={editForm.street} onChange={(e) => setEditForm({ ...editForm, street: e.target.value })} placeholder="123 Main St" />
                  </div>
                  <div className="admin-edit-row-group">
                    <div className="admin-edit-row">
                      <label>City</label>
                      <input type="text" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} placeholder="City" />
                    </div>
                    <div className="admin-edit-row">
                      <label>State</label>
                      <input type="text" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} placeholder="State" />
                    </div>
                    <div className="admin-edit-row">
                      <label>Zip</label>
                      <input type="text" value={editForm.zip} onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })} placeholder="12345" />
                    </div>
                  </div>
                  <div className="admin-edit-row-group" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="admin-edit-row">
                      <label><Lock size={14} /> {client.password ? 'New Password' : 'Set Password'}</label>
                      <input type={tempPasswordVisible ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={client.password ? 'Leave blank to keep current' : 'Set a login password'} />
                    </div>
                    <div className="admin-edit-row">
                      <label>Confirm Password</label>
                      <input type={tempPasswordVisible ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, gridColumn: '1 / -1' }}>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => {
                        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
                        const temp = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                        setNewPassword(temp);
                        setConfirmPassword(temp);
                        setTempPasswordVisible(true);
                        setPasswordMsg({ type: 'info', text: 'Temporary password generated — copy it before saving' });
                      }}>
                        <RefreshCw size={13} /> Generate Temp Password
                      </button>
                      {newPassword && (
                        <button type="button" className="btn btn-sm btn-outline" onClick={() => { navigator.clipboard.writeText(newPassword); setPasswordMsg({ type: 'success', text: 'Copied to clipboard' }); setTimeout(() => setPasswordMsg({ type: '', text: '' }), 2000); }}>
                          <Download size={13} /> Copy
                        </button>
                      )}
                    </div>
                  </div>
                  {passwordMsg.text && (
                    <p style={{ fontSize: '0.82rem', color: passwordMsg.type === 'error' ? '#ef4444' : passwordMsg.type === 'info' ? '#3b82f6' : '#22c55e', margin: '4px 0 0' }}>
                      {passwordMsg.text}
                    </p>
                  )}
                  <div className="admin-edit-actions">
                    <button type="submit" className="btn btn-sm btn-primary">Save</button>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditingClient(false)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <h2>{client.name}</h2>
                  {client.businessName && <p className="client-business-name"><Briefcase size={14} /> {client.businessName}</p>}
                  <div className="client-contact-row">
                    <span><Mail size={14} /> {client.email}</span>
                    {client.phone && <span><Phone size={14} /> {client.phone}</span>}
                    {(client.street || client.city || client.state || client.zip) && (
                      <span><MapPin size={14} /> {[client.street, client.city, client.state, client.zip].filter(Boolean).join(', ')}</span>
                    )}
                    {/* Legacy single address field */}
                    {!client.street && !client.city && client.address && <span><MapPin size={14} /> {client.address}</span>}
                  </div>
                  <div className="client-meta-row">
                    <span className={`client-status-badge ${client.status}`}>
                      {client.status === 'active' ? 'Active' : client.status === 'inactive' ? 'Inactive' : 'VIP'}
                    </span>
                    <TierBadge tier={client.tier} />
                    <span className="client-source-badge" style={{
                      background: client.sourceProspectId ? '#ecfdf5' : client.source === 'self-registered' ? '#eff6ff' : '#f3f4f6',
                      color: client.sourceProspectId ? '#059669' : client.source === 'self-registered' ? '#2563eb' : '#6b7280',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                    }}>
                      {client.sourceProspectId ? 'Pipeline' : client.source === 'self-registered' ? 'Self-registered' : 'Manual'}
                    </span>
                    {client.service && <span className="client-service"><Briefcase size={13} /> {client.service.replace('-', ' ')}</span>}
                    <span className="client-since">Client since {new Date(client.createdAt).toLocaleDateString()}</span>
                  </div>
                </>
              )}
            </div>
            <div className="client-profile-actions">
              {canManage && !editingClient && (
                <button className="btn-edit-client" onClick={startEditClient}>
                  <Edit3 size={14} /> Edit Info
                </button>
              )}
              {canManage && (
                <select value={client.status} onChange={(e) => updateClient(client.id, { status: e.target.value })} className="filter-select">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="vip">VIP</option>
                </select>
              )}
              {canManage && (
                <select value={client.tier || 'free'} onChange={(e) => updateClientTier(client.id, e.target.value)} className="filter-select">
                  {Object.entries(SUBSCRIPTION_TIERS).map(([key, t]) => (
                    <option key={key} value={key}>{t.label} Tier</option>
                  ))}
                </select>
              )}
              {canManage && client.onboarding?.complete && (
                <>
                  {confirmReopenOnboarding === client.id ? (
                    <div className="confirm-delete-row">
                      <span>Send back to onboarding?</span>
                      <button className="btn btn-sm btn-primary" onClick={() => { reopenOnboarding(client.id); setConfirmReopenOnboarding(null); setSelectedClient(null); }}>Yes, Reopen</button>
                      <button className="btn btn-sm btn-outline" onClick={() => setConfirmReopenOnboarding(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="btn btn-sm btn-outline" onClick={() => setConfirmReopenOnboarding(client.id)}>
                      <RefreshCw size={14} /> Back to Onboarding
                    </button>
                  )}
                </>
              )}
              {canDelete && (
                <>
                  {confirmArchive === client.id ? (
                    <div className="confirm-delete-row">
                      <span>Archive this client?</span>
                      <button className="btn btn-sm btn-warning" onClick={() => handleArchiveClient(client.id)}>Yes, Archive</button>
                      <button className="btn btn-sm btn-outline" onClick={() => setConfirmArchive(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="btn btn-sm btn-warning" onClick={() => setConfirmArchive(client.id)}>
                      <Trash2 size={14} /> Archive
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Google Map */}
          {(() => {
            const fullAddress = [client.street, client.city, client.state, client.zip].filter(Boolean).join(', ') || client.address;
            if (!fullAddress) return null;
            return (
              <div className="client-section client-map-section">
                <h4><MapPin size={16} /> Location</h4>
                <div className="client-map-embed">
                  <iframe
                    title="Client location map"
                    width="100%"
                    height="300"
                    style={{ border: 0, borderRadius: 8 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    allowFullScreen
                  />
                </div>
                <div className="client-map-footer">
                  <p className="client-map-address"><MapPin size={13} /> {fullAddress}</p>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                    <MapPin size={14} /> Open in Google Maps
                  </a>
                </div>
              </div>
            );
          })()}

          {/* Project Management (all clients) */}
          <div className="client-section projects-section">
            <ProjectBoard client={client} />
          </div>

          {/* Payments / Invoices */}
          <div className="client-section invoices-section">
            <div className="invoices-header">
              <h4><Receipt size={16} /> Payments & Invoices</h4>
              {canManage && (
                <button className="btn btn-sm btn-primary" onClick={() => setShowInvoiceForm(!showInvoiceForm)}>
                  <Plus size={14} /> {showInvoiceForm ? 'Cancel' : 'New Invoice'}
                </button>
              )}
            </div>

            {/* Summary */}
            {(() => {
              const invoices = client.invoices || [];
              const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
              const totalPaid = invoices.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
              const outstanding = totalBilled - totalPaid;
              const overdueCount = invoices.filter((inv) => inv.status === 'unpaid' && inv.dueDate && new Date(inv.dueDate) < new Date()).length;
              return invoices.length > 0 ? (
                <div className="invoice-summary">
                  <div className="invoice-summary-item">
                    <span>Total Billed</span>
                    <strong>${totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="invoice-summary-item paid">
                    <span>Paid</span>
                    <strong>${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="invoice-summary-item outstanding">
                    <span>Outstanding</span>
                    <strong>${outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  {overdueCount > 0 && (
                    <div className="invoice-summary-item overdue">
                      <span>Overdue</span>
                      <strong>{overdueCount}</strong>
                    </div>
                  )}
                </div>
              ) : null;
            })()}

            {showInvoiceForm && (
              <div className="invoice-form">
                {invoiceError && <div className="login-error">{invoiceError}</div>}
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setInvoiceError('');
                  if (!invoiceForm.title.trim()) { setInvoiceError('Title is required'); return; }
                  if (!invoiceForm.amount || parseFloat(invoiceForm.amount) <= 0) { setInvoiceError('Valid amount is required'); return; }
                  addInvoice(client.id, invoiceForm);
                  setInvoiceForm({ title: '', amount: '', dueDate: '', description: '', recurring: false, frequency: 'monthly' });
                  setShowInvoiceForm(false);
                }}>
                  <div className="form-row">
                    <div className="form-group"><label>Title *</label><input type="text" value={invoiceForm.title} onChange={(e) => setInvoiceForm({ ...invoiceForm, title: e.target.value })} placeholder="e.g. Website Redesign - Phase 1" required /></div>
                    <div className="form-group"><label>Amount ($) *</label><input type="number" step="0.01" min="0" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} placeholder="0.00" required /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Due Date</label><input type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} /></div>
                    <div className="form-group"><label>Description</label><input type="text" value={invoiceForm.description} onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })} placeholder="Optional description" /></div>
                  </div>
                  <div className="form-row recurring-row">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={invoiceForm.recurring} onChange={(e) => setInvoiceForm({ ...invoiceForm, recurring: e.target.checked })} />
                      <RefreshCw size={14} /> Recurring Invoice
                    </label>
                    {invoiceForm.recurring && (
                      <select value={invoiceForm.frequency} onChange={(e) => setInvoiceForm({ ...invoiceForm, frequency: e.target.value })} className="frequency-select">
                        {RECURRING_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    )}
                  </div>
                  <button type="submit" className="btn btn-sm btn-primary"><Receipt size={14} /> Create Invoice</button>
                </form>
              </div>
            )}

            {(client.invoices || []).length === 0 && !showInvoiceForm ? (
              <p className="text-muted">No invoices yet</p>
            ) : (
              <div className="invoices-list">
                {[...(client.invoices || [])].reverse().map((inv) => {
                  const isOverdue = inv.status === 'unpaid' && inv.dueDate && new Date(inv.dueDate) < new Date();
                  return (
                    <div key={inv.id} className={`invoice-card ${inv.status} ${isOverdue ? 'overdue' : ''}`}>
                      <div className="invoice-card-top">
                        <div className="invoice-info">
                          <strong>{inv.title}</strong>
                          {inv.description && <span className="invoice-desc">{inv.description}</span>}
                        </div>
                        <div className="invoice-amount">
                          <span className="invoice-price">${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          <span className={`invoice-status-badge ${inv.status} ${isOverdue ? 'overdue' : ''}`}>
                            {isOverdue ? 'Overdue' : inv.status === 'paid' ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>
                      </div>
                      <div className="invoice-card-meta">
                        <span>Created {new Date(inv.createdAt).toLocaleDateString()}</span>
                        {inv.dueDate && <span>Due {formatDisplayDate(inv.dueDate)}</span>}
                        {inv.paidAt && <span>Paid {new Date(inv.paidAt).toLocaleDateString()}</span>}
                      </div>
                      {canManage && inv.status !== 'paid' && (
                        <div className="invoice-card-actions">
                          <button className="btn btn-sm btn-confirm" onClick={() => markInvoicePaid(client.id, inv.id)}>
                            <CreditCard size={14} /> Mark Paid
                          </button>
                          {deleteInvoiceConfirm === inv.id ? (
                            <div className="delete-confirm-inline">
                              <span>Delete?</span>
                              <button className="btn btn-xs btn-delete" onClick={() => { deleteInvoice(client.id, inv.id); setDeleteInvoiceConfirm(null); }}>Yes</button>
                              <button className="btn btn-xs btn-outline" onClick={() => setDeleteInvoiceConfirm(null)}>No</button>
                            </div>
                          ) : (
                            <button className="btn btn-sm btn-delete" onClick={() => setDeleteInvoiceConfirm(inv.id)}>
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </div>
                      )}
                      {canManage && inv.status === 'paid' && (
                        <div className="invoice-card-actions">
                          <button className="btn btn-sm btn-outline" style={{ color: 'var(--gray-600)', borderColor: 'var(--gray-300)' }} onClick={() => unmarkInvoicePaid(client.id, inv.id)}>
                            Undo Payment
                          </button>
                          {deleteInvoiceConfirm === inv.id ? (
                            <div className="delete-confirm-inline">
                              <span>Delete?</span>
                              <button className="btn btn-xs btn-delete" onClick={() => { deleteInvoice(client.id, inv.id); setDeleteInvoiceConfirm(null); }}>Yes</button>
                              <button className="btn btn-xs btn-outline" onClick={() => setDeleteInvoiceConfirm(null)}>No</button>
                            </div>
                          ) : (
                            <button className="btn btn-sm btn-delete" onClick={() => setDeleteInvoiceConfirm(inv.id)}>
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment History */}
          {(() => {
            const clientPayments = payments.filter((p) => p.clientId === client.id);
            return clientPayments.length > 0 ? (
              <div className="client-section payment-history-section">
                <h4><DollarSign size={16} /> Payment History ({clientPayments.length})</h4>
                <div className="payment-history-list">
                  {[...clientPayments].reverse().map((p) => (
                    <div key={p.id} className="payment-history-item">
                      <div className="payment-history-info">
                        <strong>{p.service} — {p.serviceTier}</strong>
                        <span>{new Date(p.createdAt).toLocaleDateString()} via {p.method.replace('-', ' ')}</span>
                      </div>
                      <div className="payment-history-amount">
                        <strong>${p.amount.toLocaleString()}</strong>
                        <span className="payment-history-status">{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Documents */}
          <div className="client-section documents-section">
            <div className="documents-header">
              <h4><FileText size={16} /> Documents ({(client.documents || []).length})</h4>
              {canManage && (
                <button className="btn btn-sm btn-primary" onClick={() => setShowDocumentForm(!showDocumentForm)}>
                  <Plus size={14} /> {showDocumentForm ? 'Cancel' : 'Upload Document'}
                </button>
              )}
            </div>

            {showDocumentForm && (
              <div className="document-upload-form">
                {documentError && <div className="login-error">{documentError}</div>}
                <form onSubmit={handleDocumentUpload}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Document Name *</label>
                      <input
                        type="text"
                        value={documentForm.name}
                        onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
                        placeholder="e.g. Website Proposal v2"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Document Type</label>
                      <select
                        value={documentForm.type}
                        onChange={(e) => setDocumentForm({ ...documentForm, type: e.target.value })}
                      >
                        {Object.entries(DOCUMENT_TYPES).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description (Optional)</label>
                    <input
                      type="text"
                      value={documentForm.description}
                      onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
                      placeholder="Brief description of the document"
                    />
                  </div>
                  <div className="form-group">
                    <label>File * (Max 5MB)</label>
                    <input
                      type="file"
                      onChange={(e) => setDocumentFile(e.target.files[0])}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.csv"
                    />
                    {documentFile && (
                      <span className="file-selected">
                        Selected: {documentFile.name} ({formatFileSize(documentFile.size)})
                      </span>
                    )}
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={uploadingDocument}>
                    {uploadingDocument ? 'Uploading...' : <><Upload size={14} /> Upload Document</>}
                  </button>
                </form>
              </div>
            )}

            {(client.documents || []).length === 0 && !showDocumentForm ? (
              <p className="text-muted">No documents uploaded yet</p>
            ) : (
              <div className="documents-list">
                {[...(client.documents || [])].reverse().map((doc) => (
                  <div key={doc.id} className="document-card">
                    <div className="document-icon" style={{ background: DOCUMENT_TYPES[doc.type]?.color || '#6b7280' }}>
                      <FileText size={20} />
                    </div>
                    <div className="document-info">
                      <div className="document-name">
                        <strong>{doc.name}</strong>
                        <span className="document-type-badge" style={{ background: `${DOCUMENT_TYPES[doc.type]?.color}20`, color: DOCUMENT_TYPES[doc.type]?.color }}>
                          {DOCUMENT_TYPES[doc.type]?.label || 'Other'}
                        </span>
                      </div>
                      {doc.description && <p className="document-desc">{doc.description}</p>}
                      <div className="document-meta">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>Uploaded by {doc.uploadedBy}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="document-actions">
                      <button className="btn btn-sm btn-outline" onClick={() => handleViewDocument(doc)} title="Preview" disabled={loadingDocId === doc.id}>
                        {loadingDocId === doc.id ? <RefreshCw size={14} className="spin" /> : <Eye size={14} />}
                      </button>
                      <button className="btn btn-sm btn-primary" onClick={() => downloadDocument(doc)} title="Download">
                        <Download size={14} />
                      </button>
                      {canManage && (
                        deleteDocConfirm === doc.id ? (
                          <div className="delete-confirm-inline">
                            <span>Delete?</span>
                            <button className="btn btn-xs btn-delete" onClick={() => { deleteClientDocument(client.id, doc.id); setDeleteDocConfirm(null); }}>Yes</button>
                            <button className="btn btn-xs btn-outline" onClick={() => setDeleteDocConfirm(null)}>No</button>
                          </div>
                        ) : (
                          <button className="btn btn-sm btn-delete" onClick={() => setDeleteDocConfirm(doc.id)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document Preview Modal */}
          {viewingDocument && (
            <div className="modal-overlay" onClick={() => setViewingDocument(null)}>
              <div className="modal-content document-preview-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setViewingDocument(null)} aria-label="Close"><X size={20} /></button>
                <div className="document-preview-header">
                  <h3>{viewingDocument.name}</h3>
                  <span className="document-type-badge" style={{ background: `${DOCUMENT_TYPES[viewingDocument.type]?.color}20`, color: DOCUMENT_TYPES[viewingDocument.type]?.color }}>
                    {DOCUMENT_TYPES[viewingDocument.type]?.label || 'Other'}
                  </span>
                </div>
                {viewingDocument.description && <p className="document-preview-desc">{viewingDocument.description}</p>}
                <div className="document-preview-meta">
                  <span><FileText size={14} /> {formatFileSize(viewingDocument.fileSize)}</span>
                  <span><User size={14} /> {viewingDocument.uploadedBy}</span>
                  <span><CalendarDays size={14} /> {new Date(viewingDocument.uploadedAt).toLocaleString()}</span>
                </div>
                <div className="document-preview-content">
                  {viewingDocument.fileData && viewingDocument.fileType?.startsWith('image/') ? (
                    <img src={viewingDocument.fileData} alt={viewingDocument.name} />
                  ) : viewingDocument.fileData && viewingDocument.fileType === 'application/pdf' ? (
                    <iframe src={viewingDocument.fileData} title={viewingDocument.name} />
                  ) : (
                    <div className="document-no-preview">
                      <FileText size={48} />
                      <p>{viewingDocument.fileData ? 'Preview not available for this file type' : 'Document not found in storage.'}</p>
                      {viewingDocument.fileData ? (
                        <button className="btn btn-primary" onClick={() => downloadDocument(viewingDocument)}>
                          <Download size={16} /> Download to View
                        </button>
                      ) : ['intake', 'contract', 'proposal'].includes(viewingDocument.type) ? (
                        <button className="btn btn-primary" onClick={() => handleRegenerateDocument(viewingDocument)} disabled={loadingDocId === viewingDocument.id}>
                          {loadingDocId === viewingDocument.id ? <><RefreshCw size={16} className="spin" /> Regenerating...</> : <><RefreshCw size={16} /> Regenerate Document</>}
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="client-tags-section">
            <h4><Tag size={16} /> Tags</h4>
            <div className="client-tags">
              {(client.tags || []).map((tag) => (
                <span key={tag} className="client-tag">
                  {tag}
                  {canManage && <button onClick={() => removeClientTag(client.id, tag)}><X size={12} /></button>}
                </span>
              ))}
              {canManage && (
                <div className="add-tag-inline">
                  <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add tag..." onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} />
                  <button onClick={handleAddTag} disabled={!newTag.trim()}><Plus size={14} /></button>
                </div>
              )}
            </div>
          </div>

          {/* Appointment History */}
          <div className="client-section">
            <h4><CalendarDays size={16} /> Appointment History ({clientAppointments.length})</h4>
            {clientAppointments.length === 0 ? (
              <p className="text-muted">No appointments found</p>
            ) : (
              <div className="client-history">
                {clientAppointments.map((appt) => (
                  <div key={appt.id} className="history-item">
                    <div className="history-dot" />
                    <div className="history-content">
                      <div className="history-top">
                        <span>{formatDisplayDate(appt.date)} at {appt.time}</span>
                        <StatusBadge status={appt.status} />
                        {canManage && (
                          <button
                            className="btn btn-xs btn-outline"
                            onClick={() => {
                              setEditingAppt(appt.id);
                              setApptEditForm({ date: appt.date, time: appt.time, service: appt.service || '', status: appt.status, message: appt.message || '' });
                            }}
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        )}
                      </div>
                      {editingAppt === appt.id ? (
                        <div className="appt-edit-form">
                          <div className="form-row">
                            <div className="form-group">
                              <label>Date</label>
                              <input type="date" value={apptEditForm.date} onChange={(e) => setApptEditForm({ ...apptEditForm, date: e.target.value })} />
                            </div>
                            <div className="form-group">
                              <label>Time</label>
                              <input type="time" value={apptEditForm.time} onChange={(e) => setApptEditForm({ ...apptEditForm, time: e.target.value })} />
                            </div>
                            <div className="form-group">
                              <label>Status</label>
                              <select value={apptEditForm.status} onChange={(e) => setApptEditForm({ ...apptEditForm, status: e.target.value })}>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Service</label>
                            <input type="text" value={apptEditForm.service} onChange={(e) => setApptEditForm({ ...apptEditForm, service: e.target.value })} placeholder="Service type" />
                          </div>
                          <div className="form-group">
                            <label>Message</label>
                            <textarea value={apptEditForm.message} onChange={(e) => setApptEditForm({ ...apptEditForm, message: e.target.value })} rows={2} placeholder="Notes..." />
                          </div>
                          <div className="form-actions">
                            <button className="btn btn-sm btn-primary" onClick={() => { updateAppointment(appt.id, apptEditForm); setEditingAppt(null); }}>
                              <CheckCircle size={14} /> Save
                            </button>
                            <button className="btn btn-sm btn-outline" onClick={() => setEditingAppt(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {appt.service && <p>Service: {appt.service.replace('-', ' ')}</p>}
                          {appt.message && <p className="history-msg">"{appt.message}"</p>}
                        </>
                      )}
                      {appt.followUp && (
                        <div className="history-followup">
                          <FollowUpBadge followUp={appt.followUp} />
                          <span>{appt.followUp.note}</span>
                          {canManage && editingFollowUp !== appt.id && (
                            <button
                              className="btn btn-xs btn-outline"
                              onClick={() => {
                                setEditingFollowUp(appt.id);
                                setFollowUpForm({
                                  note: appt.followUp.note || '',
                                  priority: appt.followUp.priority || 'normal',
                                  followUpDate: appt.followUp.followUpDate || '',
                                  status: appt.followUp.status || 'pending',
                                });
                              }}
                            >
                              <Edit3 size={12} />
                            </button>
                          )}
                        </div>
                      )}
                      {editingFollowUp === appt.id && appt.followUp && (
                        <div className="followup-edit-form">
                          <div className="form-row">
                            <div className="form-group">
                              <label>Follow-Up Date</label>
                              <input type="date" value={followUpForm.followUpDate} onChange={(e) => setFollowUpForm({ ...followUpForm, followUpDate: e.target.value })} />
                            </div>
                            <div className="form-group">
                              <label>Priority</label>
                              <select value={followUpForm.priority} onChange={(e) => setFollowUpForm({ ...followUpForm, priority: e.target.value })}>
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Status</label>
                              <select value={followUpForm.status} onChange={(e) => setFollowUpForm({ ...followUpForm, status: e.target.value })}>
                                <option value="pending">Pending</option>
                                <option value="contacted">Contacted</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Note</label>
                            <textarea value={followUpForm.note} onChange={(e) => setFollowUpForm({ ...followUpForm, note: e.target.value })} rows={2} />
                          </div>
                          <div className="form-actions">
                            <button className="btn btn-sm btn-primary" onClick={() => { updateFollowUp(appt.id, followUpForm); setEditingFollowUp(null); }}>
                              <CheckCircle size={14} /> Save
                            </button>
                            <button className="btn btn-sm btn-outline" onClick={() => setEditingFollowUp(null)}>Cancel</button>
                          </div>
                        </div>
                      )}
                      {!appt.followUp && canManage && (
                        <button
                          className="btn btn-xs btn-outline"
                          style={{ marginTop: '0.5rem' }}
                          onClick={() => {
                            setEditingFollowUp(appt.id);
                            setFollowUpForm({ note: '', priority: 'normal', followUpDate: new Date().toISOString().split('T')[0], status: 'pending' });
                          }}
                        >
                          <PhoneForwarded size={12} /> Add Follow-Up
                        </button>
                      )}
                      {editingFollowUp === appt.id && !appt.followUp && (
                        <div className="followup-edit-form">
                          <div className="form-row">
                            <div className="form-group">
                              <label>Follow-Up Date</label>
                              <input type="date" value={followUpForm.followUpDate} onChange={(e) => setFollowUpForm({ ...followUpForm, followUpDate: e.target.value })} />
                            </div>
                            <div className="form-group">
                              <label>Priority</label>
                              <select value={followUpForm.priority} onChange={(e) => setFollowUpForm({ ...followUpForm, priority: e.target.value })}>
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                              </select>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Note *</label>
                            <textarea value={followUpForm.note} onChange={(e) => setFollowUpForm({ ...followUpForm, note: e.target.value })} rows={2} placeholder="Follow-up reason..." />
                          </div>
                          <div className="form-actions">
                            <button
                              className="btn btn-sm btn-primary"
                              disabled={!followUpForm.note.trim()}
                              onClick={() => {
                                markFollowUp(appt.id, followUpForm);
                                setEditingFollowUp(null);
                              }}
                            >
                              <CheckCircle size={14} /> Add Follow-Up
                            </button>
                            <button className="btn btn-sm btn-outline" onClick={() => setEditingFollowUp(null)}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="client-section">
            <h4><FileText size={16} /> Notes ({(client.notes || []).length})</h4>
            {canManage && (
              <div className="add-note">
                <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note about this client..." rows={3} />
                <button className="btn btn-sm btn-primary" onClick={handleAddNote} disabled={!newNote.trim()}><Send size={14} /> Add Note</button>
              </div>
            )}
            {(client.notes || []).length === 0 ? (
              <p className="text-muted">No notes yet</p>
            ) : (
              <div className="notes-list">
                {[...(client.notes || [])].reverse().map((n) => (
                  <div key={n.id} className="note-card">
                    <div className="note-header">
                      <strong>{n.author}</strong>
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                      {canManage && (
                        deleteNoteConfirm === n.id ? (
                          <div className="delete-confirm-inline">
                            <span>Delete?</span>
                            <button className="btn btn-xs btn-delete" onClick={() => { deleteClientNote(client.id, n.id); setDeleteNoteConfirm(null); }}>Yes</button>
                            <button className="btn btn-xs btn-outline" onClick={() => setDeleteNoteConfirm(null)}>No</button>
                          </div>
                        ) : (
                          <button className="note-delete" onClick={() => setDeleteNoteConfirm(n.id)}><Trash2 size={13} /></button>
                        )
                      )}
                    </div>
                    <p>{n.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Clients list view
  const activeFilters = [filterStatus, filterTier, filterService].filter((f) => f !== 'all').length + (search ? 1 : 0);

  return (
    <div className="clients-tab">
      {/* View Toggle */}
      <div className="clients-view-toggle">
        <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><BarChart3 size={16} /> List</button>
        <button className={`view-btn ${viewMode === 'staff' ? 'active' : ''}`} onClick={() => setViewMode('staff')}><Users size={16} /> Staff</button>
      </div>

      {viewMode === 'staff' ? (
        /* Staff Kanban View */
        <div className="clients-kanban">
          {staffMembers.length === 0 ? (
            <div className="empty-state-sm"><p>No staff members found. Add users in the Users tab first.</p></div>
          ) : (
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
                  <span className="kanban-count">{filtered.filter((c) => !c.assignedTo).length}</span>
                </div>
                <div className="kanban-column-content">
                  {filtered.filter((c) => !c.assignedTo).map((client) => (
                    <div
                      key={client.id}
                      className={`kanban-card client-kanban-card ${draggedClient?.id === client.id ? 'dragging' : ''}`}
                      draggable={canManage}
                      onDragStart={(e) => handleDragStart(e, client)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleSelectClient(client.id)}
                    >
                      <div className="kanban-card-header">
                        <strong>{client.name}</strong>
                        <TierBadge tier={client.tier} />
                      </div>
                      <div className="kanban-card-meta">
                        <span><Mail size={12} /> {client.email}</span>
                        {client.phone && <span><Phone size={12} /> {client.phone}</span>}
                      </div>
                      {client.service && <div className="kanban-card-service">{client.service.replace('-', ' ')}</div>}
                    </div>
                  ))}
                  {filtered.filter((c) => !c.assignedTo).length === 0 && <p className="kanban-empty">No unassigned clients</p>}
                </div>
              </div>

              {/* Staff Columns */}
              {staffMembers.map((staff, index) => {
                const staffClients = filtered.filter((c) => c.assignedTo === staff.id);
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
                      <span className="kanban-count">{staffClients.length}</span>
                    </div>
                    <div className="kanban-column-content">
                      {staffClients.map((client) => (
                        <div
                          key={client.id}
                          className={`kanban-card client-kanban-card ${draggedClient?.id === client.id ? 'dragging' : ''}`}
                          style={{ borderLeftColor: staffColor }}
                          draggable={canManage}
                          onDragStart={(e) => handleDragStart(e, client)}
                          onDragEnd={handleDragEnd}
                          onClick={() => handleSelectClient(client.id)}
                        >
                          <div className="kanban-card-header">
                            <strong>{client.name}</strong>
                            <TierBadge tier={client.tier} />
                          </div>
                          <div className="kanban-card-meta">
                            <span><Mail size={12} /> {client.email}</span>
                            {client.phone && <span><Phone size={12} /> {client.phone}</span>}
                          </div>
                          {client.service && <div className="kanban-card-service">{client.service.replace('-', ' ')}</div>}
                        </div>
                      ))}
                      {staffClients.length === 0 && <p className="kanban-empty">Drop clients here</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <>
      <div className="clients-header">
        <div className="clients-search">
          <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="clients-header-right">
          <span className="clients-count">{filtered.length} client{filtered.length !== 1 ? 's' : ''}</span>
          {canManage && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
              <UserPlus size={16} /> {showAddForm ? 'Cancel' : 'Add Client'}
            </button>
          )}
        </div>
      </div>
      <div className="clients-filters">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="vip">VIP</option>
        </select>
        <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="filter-select">
          <option value="all">All Tiers</option>
          {Object.entries(SUBSCRIPTION_TIERS).map(([key, t]) => (
            <option key={key} value={key}>{t.label}</option>
          ))}
        </select>
        <select value={filterService} onChange={(e) => setFilterService(e.target.value)} className="filter-select">
          <option value="all">All Services</option>
          <option value="web-design">Web Design</option>
          <option value="branding">Branding</option>
          <option value="marketing">Digital Marketing</option>
          <option value="app-dev">App Development</option>
          <option value="consulting">Consulting</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name-az">Name A → Z</option>
          <option value="name-za">Name Z → A</option>
        </select>
        {activeFilters > 0 && (
          <button className="btn-clear-filters" onClick={() => { setFilterStatus('all'); setFilterTier('all'); setFilterService('all'); setSortBy('newest'); setSearch(''); }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="um-form-card">
          <h3>Add New Client</h3>
          {addError && <div className="login-error">{addError}</div>}
          <form onSubmit={handleAddClient} className="um-form">
            <div className="form-row">
              <div className="form-group"><label>Name *</label><input type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required /></div>
              <div className="form-group"><label>Email *</label><input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Phone</label><input type="tel" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} /></div>
              <div className="form-group"><label>Service</label><select value={addForm.service} onChange={(e) => setAddForm({ ...addForm, service: e.target.value })}><option value="">Select a service</option><option value="web-design">Web Design</option><option value="branding">Branding</option><option value="marketing">Digital Marketing</option><option value="app-dev">App Development</option><option value="consulting">Consulting</option></select></div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Create Client</button>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state"><UserCheck size={48} /><p>No clients found</p></div>
      ) : (
        <div className="clients-grid">
          {filtered.map((c) => (
            <div key={c.id} className={`client-card ${c.status === 'vip' ? 'vip-card' : ''}`} onClick={() => handleSelectClient(c.id)}>
              <div className="client-card-top">
                <div className={`client-avatar ${c.status === 'vip' ? 'vip-avatar' : ''}`}>{c.name.charAt(0).toUpperCase()}</div>
                <div className="client-card-info">
                  <strong>{c.name} {c.status === 'vip' && <Flag size={13} className="vip-flag" />}</strong>
                  <span>{c.email}</span>
                </div>
                <TierBadge tier={c.tier} />
                <span className={`client-status-dot ${c.status}`} />
              </div>
              <div className="client-card-bottom">
                {c.service && <span className="client-service-tag">{c.service.replace('-', ' ')}</span>}
                <span className="client-source-badge" style={{
                  background: c.sourceProspectId ? '#ecfdf5' : c.source === 'self-registered' ? '#eff6ff' : '#f3f4f6',
                  color: c.sourceProspectId ? '#059669' : c.source === 'self-registered' ? '#2563eb' : '#6b7280',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                }}>
                  {c.sourceProspectId ? 'Pipeline' : c.source === 'self-registered' ? 'Self-registered' : 'Manual'}
                </span>
                <span className="client-card-date">Since {new Date(c.createdAt).toLocaleDateString()}</span>
                {c.status === 'vip' && (c.projects || []).length > 0 && (
                  <span className="client-projects-count"><FolderKanban size={12} /> {(c.projects || []).length} projects</span>
                )}
                {(c.tags || []).length > 0 && (
                  <div className="client-card-tags">
                    {(c.tags || []).slice(0, 3).map((t) => <span key={t} className="mini-tag">{t}</span>)}
                    {(c.tags || []).length > 3 && <span className="mini-tag">+{(c.tags || []).length - 3}</span>}
                  </div>
                )}
              </div>
              {canDelete && (
                <button className="client-card-delete" title="Archive client" onClick={(e) => { e.stopPropagation(); setConfirmArchive(c.id); }}>
                  <Trash2 size={14} />
                </button>
              )}
              <div className="client-card-arrow"><ArrowRight size={16} /></div>
            </div>
          ))}
        </div>
      )}

      {/* Archived Clients Section */}
      {archivedClients.length > 0 && (
        <div className="archived-clients-section">
          <button className="archived-toggle" onClick={() => setShowArchivedClients(!showArchivedClients)}>
            {showArchivedClients ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>Archived Clients ({archivedClients.length})</span>
          </button>
          {showArchivedClients && (
            <div className="archived-clients-list">
              {archivedClients.map((c) => (
                <div key={c.id} className="archived-client-card">
                  <div className="archived-client-info">
                    <div className="client-avatar archived">{c.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <strong>{c.name}</strong>
                      <span>{c.email}</span>
                      <small>Archived {c.archivedAt ? new Date(c.archivedAt).toLocaleDateString() : 'unknown'}</small>
                    </div>
                  </div>
                  <div className="archived-client-actions">
                    <button className="btn btn-sm btn-confirm" onClick={() => handleRestoreClient(c.id)}>
                      <RefreshCw size={14} /> Restore
                    </button>
                    {confirmPermanentDelete === c.id ? (
                      <div className="confirm-delete-inline">
                        <span>Permanently delete?</span>
                        <button className="btn btn-sm btn-delete" onClick={() => handlePermanentDelete(c.id)}>Yes</button>
                        <button className="btn btn-sm btn-outline" onClick={() => setConfirmPermanentDelete(null)}>No</button>
                      </div>
                    ) : (
                      <button className="btn btn-sm btn-delete" onClick={() => setConfirmPermanentDelete(c.id)}>
                        <Trash2 size={14} /> Delete Forever
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* Archive Confirmation Modal */}
      {confirmArchive && (
        <div className="modal-overlay" onClick={() => setConfirmArchive(null)}>
          <div className="modal-content archive-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setConfirmArchive(null)} aria-label="Close"><X size={20} /></button>
            <div className="archive-modal-icon"><AlertCircle size={48} /></div>
            <h3>Archive Client?</h3>
            <p>This client will be moved to the archive. You can restore them at any time from the Archived Clients section.</p>
            <div className="archive-modal-client">
              {(() => {
                const c = clients.find((cl) => cl.id === confirmArchive);
                return c ? (
                  <>
                    <strong>{c.name}</strong>
                    <span>{c.email}</span>
                  </>
                ) : null;
              })()}
            </div>
            <div className="archive-modal-actions">
              <button className="btn btn-warning" onClick={() => handleArchiveClient(confirmArchive)}>
                <Trash2 size={16} /> Archive Client
              </button>
              <button className="btn btn-outline" onClick={() => setConfirmArchive(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
