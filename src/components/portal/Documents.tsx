import { useState, useMemo, useCallback } from 'react';
import {
  FileText, Download, Eye, X, Search, Inbox, Calendar, User, Loader,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { downloadDocumentFromR2 } from '../../utils/documentStorage';

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '\u2014';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

interface NormalizedDoc {
  id: string;
  name: string;
  type: string;
  description: string;
  fileData: string | null;
  filePath: string | null;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

/** Normalize server-side snake_case doc to camelCase */
function normalizeDoc(doc: any): NormalizedDoc {
  return {
    id: doc.id,
    name: doc.name,
    type: doc.type || 'other',
    description: doc.description || '',
    fileData: doc.fileData || doc.file_data || null,
    filePath: doc.filePath || doc.file_path || null,
    fileType: doc.fileType || doc.mime_type || 'application/pdf',
    fileSize: doc.fileSize || doc.file_size || 0,
    uploadedBy: doc.uploadedBy || doc.uploaded_by || 'System',
    uploadedAt: doc.uploadedAt || doc.created_at || new Date().toISOString(),
  };
}

/** Get viewable URL for a document — base64 data URI or R2 URL */
function getDocViewUrl(doc: NormalizedDoc): string | null {
  if (doc.fileData) return doc.fileData;
  if (doc.filePath) return doc.filePath;
  return null;
}

interface DocumentsProps {
  client: any;
}

export default function Documents({ client }: DocumentsProps) {
  const { DOCUMENT_TYPES } = useAppContext();

  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingDocument, setViewingDocument] = useState<NormalizedDoc | null>(null);
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);

  const allDocs = useMemo(() =>
    (client?.documents || []).map(normalizeDoc),
    [client?.documents]
  );

  const availableTypes = useMemo((): string[] => {
    const types = new Set<string>(allDocs.map((d) => d.type));
    return [...types].sort();
  }, [allDocs]);

  const typeCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    allDocs.forEach((d) => {
      map[d.type] = (map[d.type] || 0) + 1;
    });
    return map;
  }, [allDocs]);

  const documents = useMemo(() => {
    let filtered = [...allDocs];
    if (filterType !== 'all') {
      filtered = filtered.filter((d) => d.type === filterType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name?.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q)
      );
    }
    filtered.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    return filtered;
  }, [allDocs, filterType, searchQuery]);

  const handleView = useCallback(async (doc: NormalizedDoc) => {
    // If we already have inline base64 data, show it directly
    if (doc.fileData) {
      setViewingDocument(doc);
      return;
    }
    // Fetch from R2 (works for both filePath R2 URLs and docs with just an ID)
    setLoadingDoc(doc.id);
    try {
      const dataUri = await downloadDocumentFromR2(doc.id);
      if (dataUri) {
        setViewingDocument({ ...doc, fileData: dataUri });
      } else {
        setViewingDocument(doc); // Show "no preview" state
      }
    } catch {
      setViewingDocument(doc);
    } finally {
      setLoadingDoc(null);
    }
  }, []);

  const handleDownload = useCallback(async (doc: NormalizedDoc) => {
    let href = doc.fileData;
    if (!href) {
      // Fetch from R2
      setLoadingDoc(doc.id);
      try {
        href = await downloadDocumentFromR2(doc.id);
      } catch { /* ignore */ }
      setLoadingDoc(null);
    }
    if (!href) return;

    const link = document.createElement('a');
    link.href = href;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const viewUrl = viewingDocument ? getDocViewUrl(viewingDocument) : null;

  return (
    <div className="portal-documents">
      <div className="portal-docs-header">
        <h2><FileText size={20} /> Documents</h2>
        <p className="portal-docs-subtitle">
          View and download your proposals, contracts, and other documents.
        </p>
      </div>

      {allDocs.length > 0 && (
        <>
          <div className="portal-docs-toolbar">
            <div className="portal-docs-search">
              <Search size={16} className="portal-docs-search-icon" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="portal-docs-search-input"
              />
            </div>
            <select
              className="portal-docs-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types ({allDocs.length})</option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {DOCUMENT_TYPES[type]?.label || type} ({typeCountMap[type]})
                </option>
              ))}
            </select>
          </div>

          <div className="portal-docs-stats-row">
            {availableTypes.map((type) => {
              const dt = DOCUMENT_TYPES[type];
              return (
                <span
                  key={type}
                  className="portal-docs-stat-chip"
                  style={{ background: `${dt?.color || '#6b7280'}15`, color: dt?.color || '#6b7280', borderColor: `${dt?.color || '#6b7280'}30` }}
                >
                  {dt?.label || type}: {typeCountMap[type]}
                </span>
              );
            })}
          </div>
        </>
      )}

      {documents.length === 0 ? (
        <div className="portal-docs-empty">
          <Inbox size={48} />
          <h3>{allDocs.length === 0 ? 'No Documents Yet' : 'No Matching Documents'}</h3>
          <p>
            {allDocs.length === 0
              ? 'Documents like proposals, contracts, and reports will appear here once they are generated.'
              : 'Try adjusting your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="portal-docs-list">
          {documents.map((doc) => {
            const dt = DOCUMENT_TYPES[doc.type];
            const isLoading = loadingDoc === doc.id;
            return (
              <div key={doc.id} className="portal-doc-card">
                <div
                  className="portal-doc-icon"
                  style={{ background: `${dt?.color || '#6b7280'}18` }}
                >
                  <FileText size={22} color={dt?.color || '#6b7280'} />
                </div>
                <div className="portal-doc-info">
                  <div className="portal-doc-name-row">
                    <strong>{doc.name}</strong>
                    <span
                      className="portal-doc-type-badge"
                      style={{ background: `${dt?.color || '#6b7280'}18`, color: dt?.color || '#6b7280' }}
                    >
                      {dt?.label || doc.type}
                    </span>
                  </div>
                  {doc.description && <p className="portal-doc-desc">{doc.description}</p>}
                  <div className="portal-doc-meta">
                    <span><FileText size={12} /> {formatFileSize(doc.fileSize)}</span>
                    {doc.uploadedBy && <><span className="portal-doc-meta-dot">&middot;</span><span><User size={12} /> {doc.uploadedBy}</span></>}
                    <span className="portal-doc-meta-dot">&middot;</span>
                    <span><Calendar size={12} /> {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="portal-doc-actions">
                  <button
                    className="portal-doc-btn"
                    onClick={() => handleView(doc)}
                    title="Preview"
                    aria-label={`Preview ${doc.name}`}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader size={16} className="spin" /> : <Eye size={16} />}
                  </button>
                  <button
                    className="portal-doc-btn portal-doc-btn-primary"
                    onClick={() => handleDownload(doc)}
                    title="Download"
                    aria-label={`Download ${doc.name}`}
                    disabled={isLoading}
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewingDocument && (
        <div className="portal-doc-modal-overlay" onClick={() => setViewingDocument(null)}>
          <div className="portal-doc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="portal-doc-modal-header">
              <div className="portal-doc-modal-title">
                <h3>{viewingDocument.name}</h3>
                <span
                  className="portal-doc-type-badge"
                  style={{ background: `${DOCUMENT_TYPES[viewingDocument.type]?.color || '#6b7280'}18`, color: DOCUMENT_TYPES[viewingDocument.type]?.color || '#6b7280' }}
                >
                  {DOCUMENT_TYPES[viewingDocument.type]?.label || viewingDocument.type}
                </span>
              </div>
              <button className="portal-doc-modal-close" onClick={() => setViewingDocument(null)} aria-label="Close preview">
                <X size={20} />
              </button>
            </div>
            {viewingDocument.description && <p className="portal-doc-modal-desc">{viewingDocument.description}</p>}
            <div className="portal-doc-modal-meta">
              <span><FileText size={14} /> {formatFileSize(viewingDocument.fileSize)}</span>
              {viewingDocument.uploadedBy && <span><User size={14} /> {viewingDocument.uploadedBy}</span>}
              <span><Calendar size={14} /> {new Date(viewingDocument.uploadedAt).toLocaleString()}</span>
            </div>
            <div className="portal-doc-modal-content">
              {viewUrl ? (
                viewingDocument.fileType?.startsWith('image/') ? (
                  <img src={viewUrl} alt={viewingDocument.name} />
                ) : viewingDocument.fileType === 'application/pdf' ? (
                  <iframe src={viewUrl} title={viewingDocument.name} />
                ) : (
                  <div className="portal-doc-no-preview">
                    <FileText size={48} />
                    <p>Preview not available for this file type</p>
                    <button className="portal-doc-btn portal-doc-btn-primary" onClick={() => handleDownload(viewingDocument)}>
                      <Download size={16} /> Download to View
                    </button>
                  </div>
                )
              ) : (
                <div className="portal-doc-no-preview">
                  <FileText size={48} />
                  <p>Document stored remotely. Download to view.</p>
                  <button className="portal-doc-btn portal-doc-btn-primary" onClick={() => handleDownload(viewingDocument)}>
                    <Download size={16} /> Download to View
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
