import { useState, useMemo, useRef } from 'react';
import {
  Plus, Trash2, Edit3, Eye, X, Check, Upload, DollarSign,
  Search, Image, ExternalLink, ChevronDown, AlertCircle, RotateCcw
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { ALL_TEMPLATES, TEMPLATE_TIERS } from '../../data/templates';

const TIER_OPTIONS = [
  { value: 'Starter', color: '#6b7280' },
  { value: 'Business', color: '#22d3ee' },
  { value: 'Premium', color: '#c084fc' },
  { value: 'Enterprise', color: '#c8a43e' },
];

const CATEGORY_OPTIONS = [
  'Landing Pages', 'Business', 'Booking', 'Dashboard', 'Healthcare',
  'Events', 'Mobile', 'Venture', 'Launch', 'Education', 'Services',
  'Real Estate', 'Analytics', 'Management', 'PM', 'Gallery', 'Agency',
  'Developer', 'E-Commerce', 'Portfolio', 'Blog', 'SaaS', 'Other',
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: '#34d399' },
  { value: 'draft', label: 'Draft', color: '#fbbf24' },
  { value: 'archived', label: 'Archived', color: '#6b7280' },
];

const EMPTY_FORM = {
  name: '',
  tier: 'Starter',
  category: 'Landing Pages',
  description: '',
  longDesc: '',
  price: '',
  tags: '',
  previewUrl: '',
  status: 'active',
  image: null,
  imageName: '',
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

export default function TemplatesManagerTab() {
  const {
    adminTemplates, addAdminTemplate, updateAdminTemplate, deleteAdminTemplate,
    builtInOverrides, setBuiltInOverride, clearBuiltInOverride,
    hasPermission,
  } = useAppContext();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editPriceId, setEditPriceId] = useState(null);
  const [editPriceValue, setEditPriceValue] = useState('');
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef(null);

  // Merge built-in + admin templates for display (apply overrides to built-ins)
  const builtInTemplates = useMemo(() =>
    ALL_TEMPLATES.map((t) => {
      const override = builtInOverrides[t.id];
      return override
        ? { ...t, ...override, source: 'built-in', _modified: true }
        : { ...t, source: 'built-in' };
    }),
  [builtInOverrides]);

  const customTemplates = useMemo(() =>
    adminTemplates.map((t) => ({ ...t, source: 'custom' })),
  [adminTemplates]);

  const allTemplates = useMemo(() => {
    const combined = [...builtInTemplates, ...customTemplates];
    return combined.filter((t) => {
      if (filterTier !== 'all' && t.tier !== filterTier) return false;
      if (filterStatus !== 'all') {
        const effectiveStatus = t.status || 'active';
        if (effectiveStatus !== filterStatus) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [builtInTemplates, customTemplates, filterTier, filterStatus, searchQuery]);

  const stats = useMemo(() => ({
    total: builtInTemplates.length + customTemplates.length,
    builtIn: builtInTemplates.length,
    custom: customTemplates.length,
    active: customTemplates.filter((t) => t.status === 'active').length,
    draft: customTemplates.filter((t) => t.status === 'draft').length,
  }), [builtInTemplates, customTemplates]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError('');

    if (!file.type.startsWith('image/')) {
      setImageError('Please upload an image file (JPG, PNG, WebP)');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Image must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      // Compress via canvas
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = (h / w) * maxDim; w = maxDim; }
          else { w = (w / h) * maxDim; h = maxDim; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        setForm((prev) => ({ ...prev, image: compressed, imageName: file.name }));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setShowForm(false);
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) return;

    const templateData = {
      name: form.name.trim(),
      tier: form.tier,
      category: form.category,
      description: form.description.trim(),
      longDesc: form.longDesc.trim(),
      price: form.tier === 'Enterprise' ? null : (parseFloat(form.price) || 0),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      previewUrl: form.previewUrl.trim(),
      status: form.status,
      image: form.image,
      imageName: form.imageName,
    };

    if (editId) {
      updateAdminTemplate(editId, templateData);
    } else {
      addAdminTemplate(templateData);
    }
    resetForm();
  };

  const handleEdit = (template) => {
    setForm({
      name: template.name,
      tier: template.tier,
      category: template.category || 'Other',
      description: template.description || '',
      longDesc: template.longDesc || '',
      price: template.price != null ? String(template.price) : '',
      tags: (template.tags || []).join(', '),
      previewUrl: template.previewUrl || '',
      status: template.status || 'active',
      image: template.image || null,
      imageName: template.imageName || '',
    });
    setEditId(template.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    deleteAdminTemplate(id);
    setDeleteConfirm(null);
  };

  const handleInlinePrice = (template) => {
    setEditPriceId(template.id);
    setEditPriceValue(template.price != null ? String(template.price) : '');
  };

  const saveInlinePrice = (id, source) => {
    const price = editPriceValue === '' ? null : parseFloat(editPriceValue);
    const finalPrice = isNaN(price) ? null : price;
    if (source === 'built-in') {
      setBuiltInOverride(id, { price: finalPrice });
    } else {
      updateAdminTemplate(id, { price: finalPrice });
    }
    setEditPriceId(null);
  };

  const handleBuiltInStatusToggle = (template) => {
    const currentStatus = template.status || 'active';
    const newStatus = currentStatus === 'active' ? 'archived' : 'active';
    setBuiltInOverride(template.id, { status: newStatus });
  };

  const handleResetBuiltIn = (templateId) => {
    clearBuiltInOverride(templateId);
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'Custom';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
  };

  const tierColor = (tier) => TIER_OPTIONS.find((t) => t.value === tier)?.color || '#6b7280';

  return (
    <div className="templates-mgr-tab">
      {/* Header */}
      <div className="tab-header">
        <div>
          <h2>Templates Manager</h2>
          <p>Manage template library, pricing, and custom uploads</p>
        </div>
        <button className="btn-add-template" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} />
          Upload Template
        </button>
      </div>

      {/* Stats Row */}
      <div className="tmgr-stats">
        <div className="tmgr-stat">
          <span className="tmgr-stat-num">{stats.total}</span>
          <span className="tmgr-stat-label">Total</span>
        </div>
        <div className="tmgr-stat">
          <span className="tmgr-stat-num">{stats.builtIn}</span>
          <span className="tmgr-stat-label">Built-in</span>
        </div>
        <div className="tmgr-stat">
          <span className="tmgr-stat-num">{stats.custom}</span>
          <span className="tmgr-stat-label">Custom</span>
        </div>
        <div className="tmgr-stat">
          <span className="tmgr-stat-num" style={{ color: '#34d399' }}>{stats.active}</span>
          <span className="tmgr-stat-label">Active</span>
        </div>
        <div className="tmgr-stat">
          <span className="tmgr-stat-num" style={{ color: '#fbbf24' }}>{stats.draft}</span>
          <span className="tmgr-stat-label">Drafts</span>
        </div>
      </div>

      {/* Filters */}
      <div className="tmgr-filters">
        <div className="tmgr-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)}>
          <option value="all">All Tiers</option>
          {TIER_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.value}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Upload / Edit Form Modal */}
      {showForm && (
        <div className="tmgr-modal-overlay" onClick={resetForm}>
          <div className="tmgr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tmgr-modal-header">
              <h3>{editId ? 'Edit Template' : 'Upload New Template'}</h3>
              <button onClick={resetForm} className="tmgr-modal-close"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="tmgr-form">
              <div className="tmgr-form-row">
                <div className="tmgr-form-group">
                  <label>Template Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Oceanview Restaurant"
                    required
                  />
                </div>
                <div className="tmgr-form-group">
                  <label>Status</label>
                  <select name="status" value={form.status} onChange={handleChange}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="tmgr-form-row tmgr-form-row-3">
                <div className="tmgr-form-group">
                  <label>Tier</label>
                  <select name="tier" value={form.tier} onChange={handleChange}>
                    {TIER_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.value}</option>
                    ))}
                  </select>
                </div>
                <div className="tmgr-form-group">
                  <label>Category</label>
                  <select name="category" value={form.category} onChange={handleChange}>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="tmgr-form-group">
                  <label>Price ($) {form.tier === 'Enterprise' && <span style={{ color: '#c8a43e', fontSize: '0.75rem' }}> — Custom</span>}</label>
                  <input
                    type="number"
                    name="price"
                    value={form.tier === 'Enterprise' ? '' : form.price}
                    onChange={handleChange}
                    placeholder={form.tier === 'Enterprise' ? 'N/A' : '1999'}
                    disabled={form.tier === 'Enterprise'}
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              <div className="tmgr-form-group">
                <label>Short Description *</label>
                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="One-line summary"
                  required
                  maxLength={120}
                />
              </div>

              <div className="tmgr-form-group">
                <label>Full Description</label>
                <textarea
                  name="longDesc"
                  value={form.longDesc}
                  onChange={handleChange}
                  placeholder="Detailed description of features and capabilities..."
                  rows={3}
                />
              </div>

              <div className="tmgr-form-group">
                <label>Tags <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(comma-separated)</span></label>
                <input
                  type="text"
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="e.g. Responsive, Booking, Payments"
                />
              </div>

              <div className="tmgr-form-group">
                <label>Live Preview URL</label>
                <input
                  type="url"
                  name="previewUrl"
                  value={form.previewUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/demo"
                />
              </div>

              {/* Image Upload */}
              <div className="tmgr-form-group">
                <label>Template Design Image</label>
                <div className="tmgr-image-upload">
                  {form.image ? (
                    <div className="tmgr-image-preview">
                      <img src={form.image} alt="Preview" />
                      <button
                        type="button"
                        className="tmgr-image-remove"
                        onClick={() => setForm((prev) => ({ ...prev, image: null, imageName: '' }))}
                      >
                        <X size={14} />
                      </button>
                      <span className="tmgr-image-name">{form.imageName}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="tmgr-image-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={20} />
                      <span>Upload Design</span>
                      <span className="tmgr-image-hint">JPG, PNG, WebP — Max 2MB</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  {imageError && (
                    <div className="tmgr-image-error">
                      <AlertCircle size={14} />
                      {imageError}
                    </div>
                  )}
                </div>
              </div>

              <div className="tmgr-form-actions">
                <button type="button" className="tmgr-btn-cancel" onClick={resetForm}>Cancel</button>
                <button type="submit" className="tmgr-btn-save">
                  <Check size={16} />
                  {editId ? 'Save Changes' : 'Add Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Templates Table */}
      <div className="tmgr-table-wrap">
        <table className="tmgr-table">
          <thead>
            <tr>
              <th style={{ width: 52 }}>Image</th>
              <th>Name</th>
              <th>Tier</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Source</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allTemplates.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  No templates match your filters.
                </td>
              </tr>
            )}
            {allTemplates.map((t) => (
              <tr key={`${t.source}-${t.id}`} className={t.source === 'custom' && t.status === 'draft' ? 'tmgr-row-draft' : ''}>
                <td>
                  <div
                    className="tmgr-thumb"
                    onClick={() => t.image && setPreviewImage(t.image)}
                    style={t.image ? { cursor: 'pointer' } : { background: `linear-gradient(135deg, ${t.color || '#333'}40, ${t.color || '#333'}15)` }}
                  >
                    {t.image ? <img src={t.image} alt={t.name} /> : <Image size={16} />}
                  </div>
                </td>
                <td>
                  <span className="tmgr-name">{t.name}</span>
                  {t.tags && t.tags.length > 0 && (
                    <div className="tmgr-tags">
                      {t.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="tmgr-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td>
                  <span className="tmgr-tier" style={{ color: tierColor(t.tier) }}>
                    {t.tier}
                  </span>
                </td>
                <td>{t.category}</td>
                <td>
                  {editPriceId === t.id ? (
                    <div className="tmgr-inline-edit">
                      <input
                        type="number"
                        value={editPriceValue}
                        onChange={(e) => setEditPriceValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveInlinePrice(t.id, t.source); if (e.key === 'Escape') setEditPriceId(null); }}
                        autoFocus
                        min="0"
                        step="1"
                      />
                      <button onClick={() => saveInlinePrice(t.id, t.source)}><Check size={12} /></button>
                    </div>
                  ) : (
                    <span
                      className="tmgr-price tmgr-price--editable"
                      onClick={() => handleInlinePrice(t)}
                      title="Click to edit price"
                    >
                      {formatPrice(t.price)}
                      {t._modified && <span className="tmgr-modified-dot" title="Modified from default" />}
                    </span>
                  )}
                </td>
                <td>
                  {t.source === 'built-in' ? (
                    <span
                      className={`tmgr-status tmgr-status--${t.status || 'active'} tmgr-status--clickable`}
                      onClick={() => handleBuiltInStatusToggle(t)}
                      title="Click to toggle active/archived"
                    >
                      {(t.status || 'active') === 'active' ? 'Active' : 'Archived'}
                    </span>
                  ) : (
                    <span className={`tmgr-status tmgr-status--${t.status}`}>
                      {STATUS_OPTIONS.find((s) => s.value === t.status)?.label || t.status}
                    </span>
                  )}
                </td>
                <td>
                  <span className={`tmgr-source tmgr-source--${t.source}`}>
                    {t.source === 'built-in' ? 'Built-in' : 'Custom'}
                  </span>
                  {t._modified && <span className="tmgr-badge-modified">Modified</span>}
                </td>
                <td>
                  <div className="tmgr-actions">
                    {(t.path || t.previewUrl) && (
                      <a
                        href={t.previewUrl || t.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tmgr-action-btn"
                        title="Preview"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    {t.source === 'built-in' && t._modified && (
                      <button
                        className="tmgr-action-btn tmgr-action-btn--reset"
                        onClick={() => handleResetBuiltIn(t.id)}
                        title="Reset to Default"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                    {t.source === 'custom' && (
                      <>
                        <button
                          className="tmgr-action-btn"
                          onClick={() => handleEdit(t)}
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="tmgr-action-btn tmgr-action-btn--danger"
                          onClick={() => setDeleteConfirm(t.id)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="tmgr-modal-overlay" onClick={() => setPreviewImage(null)}>
          <div className="tmgr-image-modal" onClick={(e) => e.stopPropagation()}>
            <button className="tmgr-modal-close" onClick={() => setPreviewImage(null)}><X size={18} /></button>
            <img src={previewImage} alt="Template preview" />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="tmgr-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="tmgr-confirm" onClick={(e) => e.stopPropagation()}>
            <h4>Delete Template?</h4>
            <p>This will permanently remove this custom template. This cannot be undone.</p>
            <div className="tmgr-confirm-actions">
              <button onClick={() => setDeleteConfirm(null)} className="tmgr-btn-cancel">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="tmgr-btn-delete">
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
