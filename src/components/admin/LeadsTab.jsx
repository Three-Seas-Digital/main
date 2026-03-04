import { useState, useMemo, useCallback } from 'react';
import { fetchWithTimeout } from '../../constants';
import {
  Search, Building2, MapPin, Phone, Globe, Mail,
  Eye, X, Plus, CheckCircle, Trash2, ExternalLink,
  PhoneForwarded, MessageSquare, Users, Shield,
  PhoneCall, Briefcase, DollarSign,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { TIME_SLOTS } from './AppointmentScheduler';

const LEAD_STATUSES = [
  { value: 'new', label: 'New', color: '#3b82f6' },
  { value: 'contacted', label: 'Contacted', color: '#f59e0b' },
  { value: 'followup', label: 'Follow Up', color: '#8b5cf6' },
  { value: 'interested', label: 'Interested', color: '#10b981' },
  { value: 'not-interested', label: 'Not Interested', color: '#ef4444' },
  { value: 'converted', label: 'Converted', color: '#06b6d4' },
];

const BUSINESS_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'retail', label: 'Retail / Shop' },
  { value: 'restaurant', label: 'Restaurant / Cafe' },
  { value: 'office', label: 'Office' },
  { value: 'services', label: 'Services' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Other' },
];

function classifyBusiness(tags) {
  if (tags.shop) return 'retail';
  if (tags.amenity && /restaurant|cafe|bar|fast_food/.test(tags.amenity)) return 'restaurant';
  if (tags.office) return 'office';
  if (tags.amenity && /pharmacy|clinic|dentist|doctor|veterinary|hospital/.test(tags.amenity)) return 'medical';
  if (tags.craft || tags.amenity === 'bank') return 'services';
  if (tags.tourism) return 'services';
  return 'other';
}

function getBusinessType(tags) {
  return tags.shop || tags.office || tags.amenity || tags.craft || tags.tourism || tags.landuse || 'business';
}

export default function LeadsTab() {
  const { leads, addLead, updateLead, deleteLead, addLeadNote, deleteLeadNote, addAppointment, addProspect, saveToBusinessDb, getFromBusinessDb, deleteFromBusinessDb, addNotification, getBookedTimesForDate } = useAppContext();

  const [searchAddress, setSearchAddress] = useState('');
  const [searchRadius, setSearchRadius] = useState(1000);
  const [customRadiusOpen, setCustomRadiusOpen] = useState(false);
  const [customRadiusKm, setCustomRadiusKm] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchCenter, setSearchCenter] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nameSearch, setNameSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualForm, setManualForm] = useState({ businessName: '', address: '', phone: '', email: '', type: '', website: '', notes: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteNoteConfirm, setDeleteNoteConfirm] = useState(null);
  const [sendToFollowUpConfirm, setSendToFollowUpConfirm] = useState(null);
  const [sendToPipelineConfirm, setSendToPipelineConfirm] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  const [enrichData, setEnrichData] = useState({});

  // Open business details modal - check if already in database
  const handleViewDetails = (result) => {
    const existing = getFromBusinessDb(result.name, result.address);
    if (existing) {
      setSelectedResult({ ...result, enrichment: existing.enrichment, dbId: existing.id });
      setEnrichData(existing.enrichment || {});
    } else {
      setSelectedResult(result);
      setEnrichData(result.enrichment || {});
    }
  };

  // Save enrichment data to database
  const handleSaveEnrichment = () => {
    if (selectedResult) {
      // Save to business database
      saveToBusinessDb({
        name: selectedResult.name,
        address: selectedResult.address,
        phone: selectedResult.phone,
        website: selectedResult.website,
        type: selectedResult.type,
        coordinates: selectedResult.coordinates,
        enrichment: enrichData,
        source: 'osm',
      });
      // Also update the search result
      setSearchResults((prev) =>
        prev.map((r) => r.id === selectedResult.id ? { ...r, enrichment: enrichData } : r)
      );
      setSelectedResult({ ...selectedResult, enrichment: enrichData });
    }
  };

  // Handle lead status change - archive "not-interested" to database, send "converted" to pipeline
  const handleLeadStatusChange = (lead, newStatus) => {
    if (newStatus === 'not-interested') {
      // Save to database with all enrichment data
      saveToBusinessDb({
        name: lead.businessName,
        address: lead.address,
        phone: lead.phone,
        website: lead.website,
        type: lead.type,
        coordinates: lead.coordinates,
        enrichment: {
          ...lead.enrichment,
          archivedReason: 'not-interested',
          archivedAt: new Date().toISOString(),
          notes: lead.notes?.map((n) => n.text).join('\n') || '',
        },
        source: lead.source || 'manual',
      });
      // Remove from leads
      deleteLead(lead.id);
      setToastMsg('Lead archived to database');
      addNotification({
        type: 'info',
        title: 'Lead Archived',
        message: `${lead.businessName} archived as not interested`,
      });
      setTimeout(() => setToastMsg(''), 3000);
    } else if (newStatus === 'converted') {
      // Archive to database AND send to pipeline
      saveToBusinessDb({
        name: lead.businessName,
        address: lead.address,
        phone: lead.phone,
        website: lead.website,
        type: lead.type,
        coordinates: lead.coordinates,
        enrichment: {
          ...lead.enrichment,
          archivedReason: 'converted',
          archivedAt: new Date().toISOString(),
          notes: lead.notes?.map((n) => n.text).join('\n') || '',
        },
        source: lead.source || 'manual',
      });
      // Send to pipeline
      const leadNotesFormatted = (lead.notes || []).map((n) => ({
        id: n.id,
        text: n.text,
        author: n.author || 'From Lead',
        createdAt: n.createdAt,
      }));
      const result = addProspect({
        name: lead.businessName,
        email: lead.email || '',
        phone: lead.phone || '',
        service: lead.type || '',
        stage: 'negotiating',
        source: 'lead',
        notes: leadNotesFormatted,
      });
      if (result.success) {
        deleteLead(lead.id);
        setToastMsg('Lead converted & sent to Pipeline!');
        addNotification({
          type: 'info',
          title: 'Lead Converted',
          message: `${lead.businessName} moved to sales pipeline`,
        });
      } else {
        setToastMsg('Failed to convert lead');
      }
      setTimeout(() => setToastMsg(''), 3000);
    } else {
      updateLead(lead.id, { status: newStatus });
    }
  };

  // Lookup URLs
  const getLookupUrls = (business) => {
    const name = encodeURIComponent(business.name || '');
    const addr = encodeURIComponent(business.address || '');
    const query = encodeURIComponent(`${business.name} ${business.address}`.trim());
    return {
      google: `https://www.google.com/search?q=${query}`,
      googleMaps: `https://www.google.com/maps/search/${query}`,
      yelp: `https://www.yelp.com/search?find_desc=${name}&find_loc=${addr}`,
      linkedin: `https://www.linkedin.com/search/results/companies/?keywords=${name}`,
      facebook: `https://www.facebook.com/search/pages/?q=${name}`,
      bbb: `https://www.bbb.org/search?find_text=${name}&find_loc=${addr}`,
    };
  };

  // Send to Follow-Ups (creates appointment with follow-up)
  const handleSendToFollowUp = (lead) => {
    const allSlots = TIME_SLOTS;
    let scheduledDate = new Date().toISOString().split('T')[0];
    let scheduledTime = '';
    // Find first available slot, searching up to 7 days out
    for (let d = 0; d < 7 && !scheduledTime; d++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() + d);
      const dateStr = checkDate.toISOString().split('T')[0];
      const booked = getBookedTimesForDate(dateStr);
      const available = allSlots.find((s) => !booked.includes(s));
      if (available) {
        scheduledDate = dateStr;
        scheduledTime = available;
      }
    }
    if (!scheduledTime) scheduledTime = '9:00 AM'; // Fallback if all 63 slots full
    // Convert lead notes to follow-up notes format
    const leadNotesFormatted = (lead.notes || []).map((n) => ({
      id: n.id,
      text: n.text,
      author: n.author || 'From Lead',
      createdAt: n.createdAt,
    }));
    const newAppt = addAppointment({
      name: lead.businessName,
      email: lead.email || '',
      phone: lead.phone || '',
      date: scheduledDate,
      time: scheduledTime,
      service: lead.type || '',
      message: `Lead from prospecting: ${lead.address || ''}`,
      status: 'pending',
      leadNotes: leadNotesFormatted, // Store original lead notes
      followUp: {
        note: `Contacted lead - ${lead.notes?.length > 0 ? lead.notes[0].text : 'Needs follow-up'}`,
        priority: 'normal',
        followUpDate: scheduledDate,
        status: 'pending',
        createdAt: new Date().toISOString(),
        notes: [], // Start empty - additional notes added during follow-up
      },
    });
    if (newAppt && newAppt.id) {
      deleteLead(lead.id);
      setToastMsg('Lead sent to Follow-Ups!');
    } else {
      setToastMsg('Failed to send to Follow-Ups');
    }
    setSendToFollowUpConfirm(null);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Send to Pipeline (creates prospect)
  const handleSendToPipeline = (lead) => {
    // Convert lead notes to prospect notes format
    const leadNotesFormatted = (lead.notes || []).map((n) => ({
      id: n.id,
      text: n.text,
      author: n.author || 'From Lead',
      createdAt: n.createdAt,
    }));
    const result = addProspect({
      name: lead.businessName,
      email: lead.email || '',
      phone: lead.phone || '',
      service: lead.type || '',
      stage: lead.status === 'converted' ? 'negotiating' : 'inquiry',
      source: 'lead',
      notes: leadNotesFormatted, // Pass lead notes
    });
    if (result.success) {
      // Auto-populate business database
      saveToBusinessDb({
        name: lead.businessName,
        address: lead.address || '',
        phone: lead.phone || '',
        website: lead.website || '',
        type: lead.type || '',
        coordinates: lead.coordinates || null,
        source: 'lead',
        enrichment: {
          ...(lead.enrichment || {}),
          pipelineStatus: 'prospect',
          sentToPipelineAt: new Date().toISOString(),
          pointOfContact: lead.contactName || lead.enrichment?.decisionMaker || '',
          contactEmail: lead.email || '',
          contactPhone: lead.phone || '',
          industry: lead.category || lead.type || '',
          notes: leadNotesFormatted.map((n) => n.text).join(' | '),
        },
      });
      deleteLead(lead.id);
      setToastMsg('Lead sent to Pipeline!');
    } else {
      setToastMsg('Failed to send to Pipeline');
    }
    setSendToPipelineConfirm(null);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const statusCounts = useMemo(() => {
    const counts = {};
    LEAD_STATUSES.forEach((s) => { counts[s.value] = 0; });
    leads.forEach((l) => { counts[l.status] = (counts[l.status] || 0) + 1; });
    return counts;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const filtered = leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (nameSearch && !l.businessName.toLowerCase().includes(nameSearch.toLowerCase())) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'updated': return new Date(b.updatedAt) - new Date(a.updatedAt);
        case 'name-az': return a.businessName.localeCompare(b.businessName);
        case 'name-za': return b.businessName.localeCompare(a.businessName);
        default: return 0;
      }
    });
  }, [leads, statusFilter, nameSearch, sortBy]);

  const isAlreadySaved = useCallback((name, address) => {
    return leads.some(
      (l) => l.businessName.toLowerCase() === name.toLowerCase() && l.address.toLowerCase() === address.toLowerCase()
    );
  }, [leads]);

  const handleSearch = async () => {
    if (!searchAddress.trim()) { setSearchError('Please enter an address'); return; }
    setSearching(true);
    setSearchError('');
    setSearchResults([]);
    setSearchCenter(null);
    try {
      const geoRes = await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddress)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'ThreeSeasDigital/1.0' },
      });
      const geoData = await geoRes.json();
      if (!geoData.length) { setSearchError('Address not found. Try a more specific address.'); setSearching(false); return; }
      const { lat, lon, display_name } = geoData[0];
      setSearchCenter({ lat: parseFloat(lat), lon: parseFloat(lon), name: display_name });

      const query = `[out:json][timeout:15];(
  node["shop"](around:${searchRadius},${lat},${lon});
  node["office"](around:${searchRadius},${lat},${lon});
  node["amenity"~"restaurant|cafe|bar|fast_food|bank|pharmacy|clinic|dentist|doctor|veterinary"](around:${searchRadius},${lat},${lon});
  node["craft"](around:${searchRadius},${lat},${lon});
  node["tourism"~"hotel|motel|guest_house"](around:${searchRadius},${lat},${lon});
  way["shop"](around:${searchRadius},${lat},${lon});
  way["office"](around:${searchRadius},${lat},${lon});
);out center;`;
      const overRes = await fetchWithTimeout('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }, 30000);
      const overData = await overRes.json();

      const results = (overData.elements || [])
        .filter((el) => el.tags && el.tags.name)
        .map((el) => {
          const coords = el.type === 'way' ? { lat: el.center?.lat, lon: el.center?.lon } : { lat: el.lat, lon: el.lon };
          const tags = el.tags;
          const addr = [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']].filter(Boolean).join(', ') || '';
          return {
            id: el.id,
            name: tags.name,
            type: getBusinessType(tags),
            category: classifyBusiness(tags),
            address: addr,
            phone: tags.phone || tags['contact:phone'] || '',
            website: tags.website || tags['contact:website'] || '',
            coordinates: coords,
          };
        });

      const filtered = searchCategory === 'all' ? results : results.filter((r) => r.category === searchCategory);
      setSearchResults(filtered);
      if (!filtered.length) setSearchError('No businesses found in this area. Try a larger radius or different address.');
    } catch (err) {
      setSearchError(err.name === 'AbortError'
        ? 'Search timed out. Try a smaller radius or try again later.'
        : 'Search failed. Please check your connection and try again.');
    }
    setSearching(false);
  };

  const handleSaveResult = (result) => {
    addLead({
      businessName: result.name,
      address: result.address,
      phone: result.phone,
      website: result.website,
      type: result.type,
      source: 'osm',
      coordinates: result.coordinates,
      enrichment: result.enrichment || {},
    });
  };

  const handleManualAdd = (e) => {
    e.preventDefault();
    const result = addLead({ ...manualForm, source: 'manual' });
    if (result.success) {
      setManualForm({ businessName: '', address: '', phone: '', email: '', type: '', website: '', notes: '' });
      if (manualForm.notes.trim()) {
        addLeadNote(result.lead.id, manualForm.notes);
      }
      setShowAddForm(false);
    }
  };

  const handleGoogleMaps = () => {
    const q = searchAddress.trim() || 'businesses';
    window.open(`https://www.google.com/maps/search/businesses+near+${encodeURIComponent(q)}`, '_blank');
  };

  const handleAddNote = (leadId) => {
    if (!newNote.trim()) return;
    addLeadNote(leadId, newNote.trim());
    setNewNote('');
  };

  const handleDelete = (id) => {
    deleteLead(id);
    setDeleteConfirm(null);
    if (selectedLead?.id === id) setSelectedLead(null);
  };

  const sel = selectedLead ? leads.find((l) => l.id === selectedLead.id) : null;

  return (
    <div className="leads-tab">
      {toastMsg && <div className="convert-toast">{toastMsg}</div>}

      {/* Header with View Toggle */}
      <div className="leads-header-bar">
        <div className="leads-stats-row">
          <div className="leads-stat-chip">
            <span className="leads-stat-value">{leads.length}</span>
            <span className="leads-stat-label">Leads</span>
          </div>
          {LEAD_STATUSES.slice(0, 4).map((s) => (
            <div key={s.value} className="leads-stat-chip">
              <span className="leads-status-dot" style={{ background: s.color }} />
              <span className="leads-stat-value">{statusCounts[s.value]}</span>
              <span className="leads-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Business Details Modal */}
      {selectedResult && (
        <div className="business-modal-overlay" onClick={() => setSelectedResult(null)}>
          <div className="business-modal" onClick={(e) => e.stopPropagation()}>
            <button className="business-modal-close" onClick={() => setSelectedResult(null)} aria-label="Close"><X size={20} /></button>

            <div className="business-modal-header">
              <div className="business-modal-icon">
                <Building2 size={28} />
              </div>
              <div>
                <h2>{selectedResult.name}</h2>
                <span className="business-type-badge">{selectedResult.type}</span>
              </div>
            </div>

            <div className="business-modal-content">
              {/* Basic Info */}
              <div className="business-section">
                <h4>Business Information</h4>
                <div className="business-info-grid">
                  {selectedResult.address && (
                    <div className="business-info-item">
                      <MapPin size={14} />
                      <span>{selectedResult.address}</span>
                    </div>
                  )}
                  {selectedResult.phone && (
                    <div className="business-info-item">
                      <Phone size={14} />
                      <a href={`tel:${selectedResult.phone}`}>{selectedResult.phone}</a>
                    </div>
                  )}
                  {selectedResult.website && (
                    <div className="business-info-item">
                      <Globe size={14} />
                      <a href={selectedResult.website.startsWith('http') ? selectedResult.website : `https://${selectedResult.website}`} target="_blank" rel="noopener noreferrer">
                        {selectedResult.website}
                      </a>
                    </div>
                  )}
                  {selectedResult.coordinates && (
                    <div className="business-info-item">
                      <MapPin size={14} />
                      <span>Lat: {selectedResult.coordinates.lat?.toFixed(4)}, Lon: {selectedResult.coordinates.lon?.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Lookup Links */}
              <div className="business-section">
                <h4>Look Up Business</h4>
                <p className="business-section-desc">Research this business on external platforms:</p>
                <div className="business-lookup-grid">
                  {(() => {
                    const urls = getLookupUrls(selectedResult);
                    return (
                      <>
                        <a href={urls.google} target="_blank" rel="noopener noreferrer" className="lookup-btn google">
                          <Search size={16} /> Google Search
                        </a>
                        <a href={urls.googleMaps} target="_blank" rel="noopener noreferrer" className="lookup-btn gmaps">
                          <MapPin size={16} /> Google Maps
                        </a>
                        <a href={urls.yelp} target="_blank" rel="noopener noreferrer" className="lookup-btn yelp">
                          <MessageSquare size={16} /> Yelp Reviews
                        </a>
                        <a href={urls.linkedin} target="_blank" rel="noopener noreferrer" className="lookup-btn linkedin">
                          <Users size={16} /> LinkedIn
                        </a>
                        <a href={urls.facebook} target="_blank" rel="noopener noreferrer" className="lookup-btn facebook">
                          <Users size={16} /> Facebook
                        </a>
                        <a href={urls.bbb} target="_blank" rel="noopener noreferrer" className="lookup-btn bbb">
                          <Shield size={16} /> BBB
                        </a>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Manual Enrichment */}
              <div className="business-section">
                <h4>Business Intel (Manual Entry)</h4>
                <p className="business-section-desc">Add data you find from research:</p>
                <div className="enrich-form">
                  <div className="enrich-row">
                    <div className="enrich-field">
                      <label>Est. Revenue</label>
                      <select value={enrichData.revenue || ''} onChange={(e) => setEnrichData({ ...enrichData, revenue: e.target.value })}>
                        <option value="">Unknown</option>
                        <option value="<100k">Under $100K</option>
                        <option value="100k-500k">$100K - $500K</option>
                        <option value="500k-1m">$500K - $1M</option>
                        <option value="1m-5m">$1M - $5M</option>
                        <option value="5m-10m">$5M - $10M</option>
                        <option value="10m+">$10M+</option>
                      </select>
                    </div>
                    <div className="enrich-field">
                      <label>Employees</label>
                      <select value={enrichData.employees || ''} onChange={(e) => setEnrichData({ ...enrichData, employees: e.target.value })}>
                        <option value="">Unknown</option>
                        <option value="1-5">1-5</option>
                        <option value="6-10">6-10</option>
                        <option value="11-25">11-25</option>
                        <option value="26-50">26-50</option>
                        <option value="51-100">51-100</option>
                        <option value="100+">100+</option>
                      </select>
                    </div>
                    <div className="enrich-field">
                      <label>Years in Business</label>
                      <input type="text" placeholder="e.g. 5" value={enrichData.yearsInBusiness || ''} onChange={(e) => setEnrichData({ ...enrichData, yearsInBusiness: e.target.value })} />
                    </div>
                  </div>
                  <div className="enrich-row">
                    <div className="enrich-field">
                      <label>Google Rating</label>
                      <input type="text" placeholder="e.g. 4.5" value={enrichData.googleRating || ''} onChange={(e) => setEnrichData({ ...enrichData, googleRating: e.target.value })} />
                    </div>
                    <div className="enrich-field">
                      <label>Google Reviews</label>
                      <input type="text" placeholder="e.g. 127" value={enrichData.googleReviews || ''} onChange={(e) => setEnrichData({ ...enrichData, googleReviews: e.target.value })} />
                    </div>
                    <div className="enrich-field">
                      <label>Yelp Rating</label>
                      <input type="text" placeholder="e.g. 4.0" value={enrichData.yelpRating || ''} onChange={(e) => setEnrichData({ ...enrichData, yelpRating: e.target.value })} />
                    </div>
                  </div>
                  <div className="enrich-row">
                    <div className="enrich-field wide">
                      <label>Owner/Decision Maker</label>
                      <input type="text" placeholder="Name and title" value={enrichData.decisionMaker || ''} onChange={(e) => setEnrichData({ ...enrichData, decisionMaker: e.target.value })} />
                    </div>
                    <div className="enrich-field">
                      <label>Direct Email</label>
                      <input type="email" placeholder="owner@business.com" value={enrichData.directEmail || ''} onChange={(e) => setEnrichData({ ...enrichData, directEmail: e.target.value })} />
                    </div>
                  </div>
                  <div className="enrich-row">
                    <div className="enrich-field full">
                      <label>Notes / Research Findings</label>
                      <textarea placeholder="Website quality, current marketing, pain points observed..." value={enrichData.notes || ''} onChange={(e) => setEnrichData({ ...enrichData, notes: e.target.value })} rows={3} />
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={handleSaveEnrichment}>
                    <CheckCircle size={14} /> Save Intel
                  </button>
                </div>
              </div>
            </div>

            <div className="business-modal-footer">
              {(() => {
                const saved = isAlreadySaved(selectedResult.name, selectedResult.address);
                return (
                  <button
                    className={`btn ${saved ? 'btn-outline' : 'btn-primary'}`}
                    onClick={() => { if (!saved) handleSaveResult({ ...selectedResult, enrichment: enrichData }); }}
                    disabled={saved}
                  >
                    {saved ? <><CheckCircle size={14} /> Already Saved</> : <><Plus size={14} /> Save as Lead</>}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="leads-search-card">
        <h3><Search size={18} /> Business Search</h3>
        <div className="leads-search-row">
          <input
            type="text"
            placeholder="Enter address (e.g. 123 Main St, City)"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="leads-search-input"
          />
          <select value={searchRadius} onChange={(e) => {
            const v = e.target.value;
            if (v === 'custom') { setCustomRadiusOpen(true); return; }
            setSearchRadius(Number(v));
            setCustomRadiusOpen(false);
          }} className="leads-select">
            <option value={500}>0.5 km</option>
            <option value={1000}>1 km</option>
            <option value={2000}>2 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
            <option value={25000}>25 km</option>
            <option value={50000}>50 km</option>
            <option value={100000}>100 km</option>
            <option value={200000}>200 km</option>
            <option value={300000}>300 km</option>
            <option value="custom">Custom...</option>
          </select>
          {customRadiusOpen && (
            <div className="leads-custom-radius">
              <input type="number" min={1} max={300} placeholder="km" value={customRadiusKm}
                onChange={(e) => setCustomRadiusKm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customRadiusKm) {
                    setSearchRadius(Math.min(300, Math.max(1, Number(customRadiusKm))) * 1000);
                    setCustomRadiusOpen(false);
                  }
                }}
                className="leads-custom-radius-input" />
              <span className="leads-custom-radius-label">km</span>
              <button className="btn btn-sm btn-primary" onClick={() => {
                if (customRadiusKm) {
                  setSearchRadius(Math.min(300, Math.max(1, Number(customRadiusKm))) * 1000);
                  setCustomRadiusOpen(false);
                }
              }}>Set</button>
            </div>
          )}
          <select value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)} className="leads-select">
            {BUSINESS_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="leads-search-actions">
          <button className="btn btn-primary" onClick={handleSearch} disabled={searching}>
            {searching ? <><span className="leads-spinner" /> Searching...</> : <><Search size={14} /> Search</>}
          </button>
          <button className="btn btn-outline" onClick={handleGoogleMaps}>
            <ExternalLink size={14} /> Search on Google Maps
          </button>
        </div>
        {searchError && <p className="leads-error">{searchError}</p>}

        {searchCenter && (
          <div className="leads-map-section">
            <div className="leads-map-header">
              <MapPin size={16} />
              <span>Search Area: {searchCenter.name?.split(',').slice(0, 3).join(',')}</span>
              <span className="leads-map-radius">Radius: {searchRadius >= 1000 ? `${(searchRadius / 1000).toLocaleString()} km` : `${searchRadius} m`}</span>
            </div>
            <div className="leads-map-container">
              <iframe
                title="Search Location Map"
                width="100%"
                height="300"
                frameBorder="0"
                scrolling="no"
                src={(() => { const deg = Math.max(0.01, (searchRadius / 1000) * 0.012); return `https://www.openstreetmap.org/export/embed.html?bbox=${searchCenter.lon - deg},${searchCenter.lat - deg * 0.75},${searchCenter.lon + deg},${searchCenter.lat + deg * 0.75}&layer=mapnik&marker=${searchCenter.lat},${searchCenter.lon}`; })()}
              />
              <div className="leads-map-links">
                <a href={`https://www.openstreetmap.org/?mlat=${searchCenter.lat}&mlon=${searchCenter.lon}#map=15/${searchCenter.lat}/${searchCenter.lon}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={12} /> View larger map
                </a>
                <a href={`https://www.google.com/maps/search/?api=1&query=${searchCenter.lat},${searchCenter.lon}`} target="_blank" rel="noopener noreferrer">
                  <Globe size={12} /> Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="leads-results-list">
            <p className="leads-results-count">{searchResults.length} businesses found</p>
            {searchResults.map((r) => {
              const saved = isAlreadySaved(r.name, r.address);
              return (
                <div key={r.id} className="leads-result-item">
                  <div className="leads-result-info">
                    <strong>{r.name}</strong>
                    <span className="leads-type-badge">{r.type}</span>
                    {r.address && <span className="leads-result-addr"><MapPin size={12} /> {r.address}</span>}
                    {r.phone && <span className="leads-result-phone"><Phone size={12} /> {r.phone}</span>}
                  </div>
                  <div className="leads-result-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => handleViewDetails(r)}>
                      <Eye size={14} /> Details
                    </button>
                    <button
                      className={`btn btn-sm ${saved ? 'leads-result-saved' : 'btn-primary'}`}
                      onClick={() => handleSaveResult(r)}
                      disabled={saved}
                    >
                      {saved ? <><CheckCircle size={14} /> Saved</> : <><Plus size={14} /> Save</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Add */}
      <div className="leads-add-section">
        <button className="btn btn-outline" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={14} /> {showAddForm ? 'Cancel' : 'Add Lead Manually'}
        </button>
        {showAddForm && (
          <form className="leads-add-form" onSubmit={handleManualAdd}>
            <div className="leads-form-row">
              <div className="leads-form-group">
                <label>Business Name *</label>
                <input type="text" value={manualForm.businessName} onChange={(e) => setManualForm((p) => ({ ...p, businessName: e.target.value }))} required />
              </div>
              <div className="leads-form-group">
                <label>Type</label>
                <input type="text" value={manualForm.type} onChange={(e) => setManualForm((p) => ({ ...p, type: e.target.value }))} placeholder="e.g. Restaurant, Retail" />
              </div>
            </div>
            <div className="leads-form-row">
              <div className="leads-form-group">
                <label>Address</label>
                <input type="text" value={manualForm.address} onChange={(e) => setManualForm((p) => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="leads-form-group">
                <label>Phone</label>
                <input type="text" value={manualForm.phone} onChange={(e) => setManualForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div className="leads-form-row">
              <div className="leads-form-group">
                <label>Email</label>
                <input type="email" value={manualForm.email} onChange={(e) => setManualForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="leads-form-group">
                <label>Website</label>
                <input type="text" value={manualForm.website} onChange={(e) => setManualForm((p) => ({ ...p, website: e.target.value }))} />
              </div>
            </div>
            <div className="leads-form-group full-width">
              <label>Initial Notes</label>
              <textarea value={manualForm.notes} onChange={(e) => setManualForm((p) => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
            <div className="leads-form-actions">
              <button type="submit" className="btn btn-primary"><Plus size={14} /> Add Lead</button>
            </div>
          </form>
        )}
      </div>

      {/* Saved Leads */}
      <div className="leads-list-section">
        <div className="leads-list-header">
          <h3><Building2 size={18} /> Saved Leads ({filteredLeads.length})</h3>
          <div className="leads-filter-bar">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="leads-select">
              <option value="all">All Statuses</option>
              {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="leads-select">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="updated">Recently Updated</option>
              <option value="name-az">Name A-Z</option>
              <option value="name-za">Name Z-A</option>
            </select>
            <input
              type="text"
              placeholder="Search by name..."
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className="leads-name-search"
            />
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="empty-state"><Building2 size={48} /><p>No leads found</p></div>
        ) : (
          <div className="leads-cards">
            {filteredLeads.map((lead) => {
              const isSelected = sel?.id === lead.id;
              const statusInfo = LEAD_STATUSES.find((s) => s.value === lead.status) || LEAD_STATUSES[0];
              return (
                <div key={lead.id} className={`leads-card ${isSelected ? 'leads-card-selected' : ''}`}>
                  <div className="leads-card-header" onClick={() => setSelectedLead(isSelected ? null : lead)}>
                    <div className="leads-card-title">
                      <span className="leads-status-dot" style={{ background: statusInfo.color }} />
                      <strong>{lead.businessName}</strong>
                      {lead.type && <span className="leads-type-badge">{lead.type}</span>}
                      {lead.source === 'osm' && <span className="leads-source-badge"><Globe size={10} /> OSM</span>}
                    </div>
                    <select
                      value={lead.status}
                      onChange={(e) => { e.stopPropagation(); handleLeadStatusChange(lead, e.target.value); }}
                      className="leads-status-select"
                      onClick={(e) => e.stopPropagation()}
                      style={{ borderColor: statusInfo.color }}
                    >
                      {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>

                  <div className="leads-card-meta">
                    {lead.address && <span><MapPin size={12} /> {lead.address}</span>}
                    {lead.phone && <span><Phone size={12} /> {lead.phone}</span>}
                    {lead.email && <span><Mail size={12} /> {lead.email}</span>}
                    {lead.website && <span><Globe size={12} /> {lead.website}</span>}
                  </div>

                  {/* Action buttons based on status */}
                  {(lead.status === 'contacted' || lead.status === 'followup') && (
                    <div className="leads-action-buttons">
                      {sendToFollowUpConfirm === lead.id ? (
                        <div className="leads-confirm-action">
                          <span>Send to Follow-Ups?</span>
                          <button className="btn btn-sm btn-primary" onClick={() => handleSendToFollowUp(lead)}><CheckCircle size={14} /> Yes</button>
                          <button className="btn btn-sm btn-outline" onClick={() => setSendToFollowUpConfirm(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button className="btn btn-sm btn-followup" onClick={() => setSendToFollowUpConfirm(lead.id)}>
                          <PhoneForwarded size={14} /> Send to Follow-Ups
                        </button>
                      )}
                    </div>
                  )}

                  {(lead.status === 'interested' || lead.status === 'converted') && (
                    <div className="leads-action-buttons">
                      {sendToPipelineConfirm === lead.id ? (
                        <div className="leads-confirm-action">
                          <span>Send to Pipeline?</span>
                          <button className="btn btn-sm btn-primary" onClick={() => handleSendToPipeline(lead)}><CheckCircle size={14} /> Yes</button>
                          <button className="btn btn-sm btn-outline" onClick={() => setSendToPipelineConfirm(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button className="btn btn-sm btn-pipeline" onClick={() => setSendToPipelineConfirm(lead.id)}>
                          <Briefcase size={14} /> Send to Pipeline
                        </button>
                      )}
                    </div>
                  )}

                  <div className="leads-card-footer">
                    <span className="leads-card-date">{new Date(lead.createdAt).toLocaleDateString()}</span>
                    <span className="leads-card-notes-count"><MessageSquare size={12} /> {lead.notes.length} notes</span>
                    {deleteConfirm === lead.id ? (
                      <div className="leads-delete-confirm">
                        <span>Delete?</span>
                        <button className="btn btn-sm btn-delete" onClick={() => handleDelete(lead.id)}>Yes</button>
                        <button className="btn btn-sm btn-outline" onClick={() => setDeleteConfirm(null)}>No</button>
                      </div>
                    ) : (
                      <button className="btn btn-sm btn-ghost" onClick={() => setDeleteConfirm(lead.id)}><Trash2 size={13} /></button>
                    )}
                  </div>

                  {isSelected && (
                    <div className="leads-detail">
                      <div className="leads-notes-section">
                        <h4><PhoneCall size={14} /> Call Log / Notes</h4>
                        <div className="leads-note-input">
                          <input
                            type="text"
                            placeholder="Point of contact, phone number, needs, or other relevant info..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddNote(lead.id)}
                          />
                          <button className="btn btn-sm btn-primary" onClick={() => handleAddNote(lead.id)}><Plus size={14} /> Add</button>
                        </div>
                        {lead.notes.length > 0 ? (
                          <div className="leads-notes-list">
                            {[...lead.notes].reverse().map((note) => (
                              <div key={note.id} className="leads-note-item">
                                <div className="leads-note-header">
                                  <strong>{note.author}</strong>
                                  <span>{new Date(note.createdAt).toLocaleString()}</span>
                                  {deleteNoteConfirm === note.id ? (
                                    <div className="delete-confirm-inline">
                                      <span>Delete?</span>
                                      <button className="btn btn-xs btn-delete" onClick={() => { deleteLeadNote(lead.id, note.id); setDeleteNoteConfirm(null); }}>Yes</button>
                                      <button className="btn btn-xs btn-outline" onClick={() => setDeleteNoteConfirm(null)}>No</button>
                                    </div>
                                  ) : (
                                    <button className="leads-note-delete" onClick={() => setDeleteNoteConfirm(note.id)}><X size={12} /></button>
                                  )}
                                </div>
                                <p>{note.text}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="leads-no-notes">No notes yet</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
