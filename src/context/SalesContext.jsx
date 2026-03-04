import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { generateId, safeSetItem, safeGetItem } from '../constants';
import { syncToApi } from '../api/apiSync';
import { leadsApi } from '../api/leads';
import { prospectsApi } from '../api/prospects';
import { businessDbApi } from '../api/businessDb';
import { researchApi } from '../api/research';

const SalesContext = createContext();

const LEADS_KEY = 'threeseas_leads';
const PROSPECTS_KEY = 'threeseas_prospects';
const BUSINESS_DB_KEY = 'threeseas_business_database';
const RESEARCH_KEY = 'threeseas_market_research';

const PROSPECT_STAGES = [
  { value: 'inquiry', label: 'Inquiry', color: '#6b7280' },
  { value: 'booked', label: 'Booked', color: '#3b82f6' },
  { value: 'confirmed', label: 'Confirmed', color: '#8b5cf6' },
  { value: 'negotiating', label: 'Negotiating', color: '#f59e0b' },
  { value: 'closed', label: 'Closed', color: '#10b981' },
];

const LOSS_REASONS = [
  { value: 'budget', label: 'Budget constraints' },
  { value: 'timing', label: 'Bad timing' },
  { value: 'competitor', label: 'Chose competitor' },
  { value: 'no-response', label: 'No response' },
  { value: 'scope', label: 'Scope mismatch' },
  { value: 'other', label: 'Other' },
];

export function SalesProvider({ children }) {
  const { currentUser } = useAuth();

  const [leads, setLeads] = useState(() => safeGetItem(LEADS_KEY, []));
  const [prospects, setProspects] = useState(() => safeGetItem(PROSPECTS_KEY, []));
  const [businessDatabase, setBusinessDatabase] = useState(() => {
    const raw = safeGetItem(BUSINESS_DB_KEY, []);
    // Dedup on load — merge entries with the same normalized name
    const seen = new Map();
    const deduped = [];
    raw.forEach((entry) => {
      const nameKey = (entry.name || '').toLowerCase().trim();
      if (!nameKey) { deduped.push(entry); return; }
      const existing = seen.get(nameKey);
      if (existing) {
        // Merge into the existing entry — keep richer data
        existing.address = existing.address || entry.address || '';
        existing.phone = existing.phone || entry.phone || '';
        existing.website = existing.website || entry.website || '';
        existing.coordinates = existing.coordinates || entry.coordinates || null;
        existing.enrichment = { ...(entry.enrichment || {}), ...(existing.enrichment || {}) };
        existing.key = `${nameKey}_${(existing.address || '').toLowerCase().trim()}`;
        existing.updatedAt = new Date().toISOString();
      } else {
        const clone = { ...entry, key: `${nameKey}_${(entry.address || '').toLowerCase().trim()}` };
        seen.set(nameKey, clone);
        deduped.push(clone);
      }
    });
    if (deduped.length < raw.length) {
      safeSetItem(BUSINESS_DB_KEY, JSON.stringify(deduped));
    }
    return deduped;
  });
  const [marketResearch, setMarketResearch] = useState(() => safeGetItem(RESEARCH_KEY, []));

  useEffect(() => {
    safeSetItem(LEADS_KEY, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    safeSetItem(PROSPECTS_KEY, JSON.stringify(prospects));
  }, [prospects]);

  useEffect(() => {
    safeSetItem(BUSINESS_DB_KEY, JSON.stringify(businessDatabase));
  }, [businessDatabase]);

  useEffect(() => {
    safeSetItem(RESEARCH_KEY, JSON.stringify(marketResearch));
  }, [marketResearch]);

  // Leads
  const addLead = (data) => {
    if (!data.businessName?.trim()) return { success: false, error: 'Business name is required' };
    const lead = {
      id: generateId(),
      businessName: data.businessName.trim(),
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      type: data.type || '',
      website: data.website || '',
      status: 'new',
      notes: [],
      source: data.source || 'manual',
      coordinates: data.coordinates || null,
      enrichment: data.enrichment || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLeads((prev) => [...prev, lead]);
    syncToApi(() => leadsApi.create(lead), 'addLead');
    return { success: true, lead };
  };

  const updateLead = (id, updates) => {
    const exists = leads.find((l) => l.id === id);
    if (!exists) return { success: false, error: 'Lead not found' };
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l))
    );
    syncToApi(() => leadsApi.update(id, updates), 'updateLead');
    return { success: true };
  };

  const deleteLead = (id) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    syncToApi(() => leadsApi.delete(id), 'deleteLead');
    return { success: true };
  };

  const addLeadNote = (id, text) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              updatedAt: new Date().toISOString(),
              notes: [
                ...l.notes,
                {
                  id: generateId(),
                  text,
                  author: currentUser?.name || 'System',
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : l
      )
    );
    syncToApi(() => leadsApi.addNote(id, { text, author: currentUser?.name || 'System' }), 'addLeadNote');
  };

  const deleteLeadNote = (leadId, noteId) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, notes: l.notes.filter((n) => n.id !== noteId) }
          : l
      )
    );
    syncToApi(() => leadsApi.deleteNote(leadId, noteId), 'deleteLeadNote');
  };

  // Business Database
  const saveToBusinessDb = (data) => {
    const nameNorm = (data.name || '').toLowerCase().trim();
    const addrNorm = (data.address || '').toLowerCase().trim();
    const key = `${nameNorm}_${addrNorm}`;

    // Use functional updater to read the freshest state (avoids stale-closure duplicates)
    let result = null;
    setBusinessDatabase((prev) => {
      // 1) Exact key match (name + address)
      let match = prev.find((b) => b.key === key);
      // 2) Fallback: match by name alone when either side has no address
      if (!match && nameNorm) {
        match = prev.find((b) => {
          const bName = (b.name || '').toLowerCase().trim();
          const bAddr = (b.address || '').toLowerCase().trim();
          return bName === nameNorm && (!addrNorm || !bAddr);
        });
      }

      if (match) {
        // Update existing — merge enrichment, keep the richer address
        const mergedAddr = addrNorm || (match.address || '');
        const mergedKey = `${nameNorm}_${(mergedAddr).toLowerCase().trim()}`;
        const updated = prev.map((b) => b.id === match.id ? {
          ...b,
          ...data,
          address: mergedAddr,
          key: mergedKey,
          enrichment: { ...b.enrichment, ...data.enrichment },
          updatedAt: new Date().toISOString(),
        } : b);
        syncToApi(() => businessDbApi.update(match.id, { ...data, address: mergedAddr }), 'updateBusinessDb');
        result = { success: true, updated: true };
        return updated;
      }

      // No match — create new entry
      const entry = {
        id: generateId(),
        key,
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        website: data.website || '',
        type: data.type || '',
        coordinates: data.coordinates || null,
        enrichment: data.enrichment || {},
        source: data.source || 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      syncToApi(() => businessDbApi.create(entry), 'saveToBusinessDb');
      result = { success: true, entry };
      return [...prev, entry];
    });
    return result;
  };

  const getFromBusinessDb = (name, address) => {
    const key = `${(name || '').toLowerCase().trim()}_${(address || '').toLowerCase().trim()}`;
    return businessDatabase.find((b) => b.key === key) || null;
  };

  const updateBusinessDb = (id, updates) => {
    setBusinessDatabase((prev) =>
      prev.map((b) => b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b)
    );
    syncToApi(() => businessDbApi.update(id, updates), 'updateBusinessDb');
  };

  const deleteFromBusinessDb = (id) => {
    setBusinessDatabase((prev) => prev.filter((b) => b.id !== id));
    syncToApi(() => businessDbApi.delete(id), 'deleteFromBusinessDb');
  };

  // Market Research
  const saveResearch = (data) => {
    const key = `${(data.location || '').toLowerCase().trim()}`;
    const existing = marketResearch.find((r) => r.key === key);
    if (existing) {
      setMarketResearch((prev) =>
        prev.map((r) => r.key === key ? { ...r, ...data, updatedAt: new Date().toISOString() } : r)
      );
      syncToApi(() => researchApi.update(existing.id, data), 'updateResearch');
      return { success: true, updated: true };
    }
    const entry = {
      id: generateId(),
      key,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMarketResearch((prev) => [...prev, entry]);
    syncToApi(() => researchApi.create(entry), 'saveResearch');
    return { success: true, entry };
  };

  const updateResearch = (id, updates) => {
    setMarketResearch((prev) =>
      prev.map((r) => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)
    );
    syncToApi(() => researchApi.update(id, updates), 'updateResearch');
  };

  const deleteResearch = (id) => {
    setMarketResearch((prev) => prev.filter((r) => r.id !== id));
    syncToApi(() => researchApi.delete(id), 'deleteResearch');
  };

  // Prospects / Pipeline
  const addProspect = (data) => {
    if (!data.name?.trim()) return { success: false, error: 'Name is required' };
    const newProspect = {
      id: generateId(),
      name: data.name.trim(),
      email: data.email?.trim() || '',
      phone: data.phone?.trim() || '',
      service: data.service || '',
      stage: data.stage || 'inquiry',
      dealValue: data.dealValue || 0,
      probability: data.probability || 25,
      expectedCloseDate: data.expectedCloseDate || '',
      notes: data.notes || [],
      documents: data.documents || [],
      outcome: null,
      lossReason: '',
      revisitDate: '',
      source: data.source || 'manual',
      appointmentId: data.appointmentId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProspects((prev) => [newProspect, ...prev]);
    syncToApi(() => prospectsApi.create(newProspect), 'addProspect');
    return { success: true, prospect: newProspect };
  };

  const updateProspect = (id, updates) => {
    setProspects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      )
    );
    syncToApi(() => prospectsApi.update(id, updates), 'updateProspect');
  };

  const deleteProspect = (id) => {
    setProspects((prev) => prev.filter((p) => p.id !== id));
    syncToApi(() => prospectsApi.delete(id), 'deleteProspect');
  };

  const addProspectNote = (prospectId, noteText) => {
    if (!noteText?.trim()) return;
    setProspects((prev) =>
      prev.map((p) => {
        if (p.id !== prospectId) return p;
        return {
          ...p,
          notes: [
            ...p.notes,
            {
              id: generateId(),
              text: noteText.trim(),
              author: currentUser?.name || 'System',
              createdAt: new Date().toISOString(),
            },
          ],
          updatedAt: new Date().toISOString(),
        };
      })
    );
    syncToApi(() => prospectsApi.addNote(prospectId, { text: noteText.trim(), author: currentUser?.name || 'System' }), 'addProspectNote');
  };

  const deleteProspectNote = (prospectId, noteId) => {
    setProspects((prev) =>
      prev.map((p) =>
        p.id === prospectId
          ? { ...p, notes: (p.notes || []).filter((n) => n.id !== noteId), updatedAt: new Date().toISOString() }
          : p
      )
    );
    syncToApi(() => prospectsApi.deleteNote(prospectId, noteId), 'deleteProspectNote');
  };

  const addProspectDocument = (prospectId, document) => {
    const newDoc = {
      id: generateId(),
      name: document.name,
      type: document.type || 'other',
      description: document.description || '',
      fileData: document.fileData,
      fileType: document.fileType,
      fileSize: document.fileSize,
      uploadedBy: currentUser?.name || 'System',
      uploadedAt: new Date().toISOString(),
    };
    setProspects((prev) =>
      prev.map((p) =>
        p.id === prospectId
          ? { ...p, documents: [...(p.documents || []), newDoc], updatedAt: new Date().toISOString() }
          : p
      )
    );
    syncToApi(() => prospectsApi.uploadDocument(prospectId, document), 'addProspectDocument');
    return { success: true, document: newDoc };
  };

  const deleteProspectDocument = (prospectId, docId) => {
    setProspects((prev) =>
      prev.map((p) =>
        p.id === prospectId
          ? { ...p, documents: (p.documents || []).filter((d) => d.id !== docId), updatedAt: new Date().toISOString() }
          : p
      )
    );
    syncToApi(() => prospectsApi.deleteDocument(prospectId, docId), 'deleteProspectDocument');
  };

  const closeProspect = (id, outcome, details = {}) => {
    setProspects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          stage: 'closed',
          outcome,
          lossReason: details.lossReason || '',
          revisitDate: details.revisitDate || '',
          closedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      })
    );
    syncToApi(() => prospectsApi.update(id, { stage: 'closed', outcome, lossReason: details.lossReason || '', revisitDate: details.revisitDate || '' }), 'closeProspect');
  };

  const reopenProspect = (id, stage = 'negotiating') => {
    setProspects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, stage, outcome: null, lossReason: '', closedAt: null, updatedAt: new Date().toISOString() }
          : p
      )
    );
    syncToApi(() => prospectsApi.update(id, { stage, outcome: null, lossReason: '' }), 'reopenProspect');
  };

  const value = useMemo(() => ({
    leads, addLead, updateLead, deleteLead, addLeadNote, deleteLeadNote,
    businessDatabase, saveToBusinessDb, getFromBusinessDb, updateBusinessDb, deleteFromBusinessDb,
    marketResearch, saveResearch, updateResearch, deleteResearch,
    prospects, addProspect, updateProspect, deleteProspect, addProspectNote, deleteProspectNote,
    addProspectDocument, deleteProspectDocument, closeProspect, reopenProspect,
    PROSPECT_STAGES, LOSS_REASONS,
  }), [leads, businessDatabase, marketResearch, prospects]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SalesContext.Provider value={value}>
      {children}
    </SalesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSales = () => useContext(SalesContext);
