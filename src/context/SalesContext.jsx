import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

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

  const [leads, setLeads] = useState(() => {
    const saved = localStorage.getItem(LEADS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [prospects, setProspects] = useState(() => {
    const saved = localStorage.getItem(PROSPECTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [businessDatabase, setBusinessDatabase] = useState(() => {
    const saved = localStorage.getItem(BUSINESS_DB_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [marketResearch, setMarketResearch] = useState(() => {
    const saved = localStorage.getItem(RESEARCH_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(PROSPECTS_KEY, JSON.stringify(prospects));
  }, [prospects]);

  useEffect(() => {
    localStorage.setItem(BUSINESS_DB_KEY, JSON.stringify(businessDatabase));
  }, [businessDatabase]);

  useEffect(() => {
    localStorage.setItem(RESEARCH_KEY, JSON.stringify(marketResearch));
  }, [marketResearch]);

  // Leads
  const addLead = (data) => {
    if (!data.businessName?.trim()) return { success: false, error: 'Business name is required' };
    const lead = {
      id: Date.now().toString(),
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLeads((prev) => [...prev, lead]);
    return { success: true, lead };
  };

  const updateLead = (id, updates) => {
    const exists = leads.find((l) => l.id === id);
    if (!exists) return { success: false, error: 'Lead not found' };
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l))
    );
    return { success: true };
  };

  const deleteLead = (id) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
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
                  id: Date.now().toString(),
                  text,
                  author: currentUser?.name || 'System',
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : l
      )
    );
  };

  const deleteLeadNote = (leadId, noteId) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, notes: l.notes.filter((n) => n.id !== noteId) }
          : l
      )
    );
  };

  // Business Database
  const saveToBusinessDb = (data) => {
    const key = `${(data.name || '').toLowerCase().trim()}_${(data.address || '').toLowerCase().trim()}`;
    const existing = businessDatabase.find((b) => b.key === key);

    if (existing) {
      setBusinessDatabase((prev) =>
        prev.map((b) => b.key === key ? {
          ...b,
          ...data,
          enrichment: { ...b.enrichment, ...data.enrichment },
          updatedAt: new Date().toISOString(),
        } : b)
      );
      return { success: true, updated: true };
    }

    const entry = {
      id: Date.now().toString(),
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
    setBusinessDatabase((prev) => [...prev, entry]);
    return { success: true, entry };
  };

  const getFromBusinessDb = (name, address) => {
    const key = `${(name || '').toLowerCase().trim()}_${(address || '').toLowerCase().trim()}`;
    return businessDatabase.find((b) => b.key === key) || null;
  };

  const updateBusinessDb = (id, updates) => {
    setBusinessDatabase((prev) =>
      prev.map((b) => b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b)
    );
  };

  const deleteFromBusinessDb = (id) => {
    setBusinessDatabase((prev) => prev.filter((b) => b.id !== id));
  };

  // Market Research
  const saveResearch = (data) => {
    const key = `${(data.location || '').toLowerCase().trim()}`;
    const existing = marketResearch.find((r) => r.key === key);
    if (existing) {
      setMarketResearch((prev) =>
        prev.map((r) => r.key === key ? { ...r, ...data, updatedAt: new Date().toISOString() } : r)
      );
      return { success: true, updated: true };
    }
    const entry = {
      id: Date.now().toString(),
      key,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMarketResearch((prev) => [...prev, entry]);
    return { success: true, entry };
  };

  const updateResearch = (id, updates) => {
    setMarketResearch((prev) =>
      prev.map((r) => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)
    );
  };

  const deleteResearch = (id) => {
    setMarketResearch((prev) => prev.filter((r) => r.id !== id));
  };

  // Prospects / Pipeline
  const addProspect = (data) => {
    if (!data.name?.trim()) return { success: false, error: 'Name is required' };
    const newProspect = {
      id: Date.now().toString(),
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
  };

  const deleteProspect = (id) => {
    setProspects((prev) => prev.filter((p) => p.id !== id));
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
              id: Date.now().toString(),
              text: noteText.trim(),
              author: currentUser?.name || 'System',
              createdAt: new Date().toISOString(),
            },
          ],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const deleteProspectNote = (prospectId, noteId) => {
    setProspects((prev) =>
      prev.map((p) =>
        p.id === prospectId
          ? { ...p, notes: (p.notes || []).filter((n) => n.id !== noteId), updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const addProspectDocument = (prospectId, document) => {
    const newDoc = {
      id: Date.now().toString(),
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
  };

  const reopenProspect = (id, stage = 'negotiating') => {
    setProspects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, stage, outcome: null, lossReason: '', closedAt: null, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  return (
    <SalesContext.Provider
      value={{
        // Leads
        leads,
        addLead,
        updateLead,
        deleteLead,
        addLeadNote,
        deleteLeadNote,
        // Business Database
        businessDatabase,
        saveToBusinessDb,
        getFromBusinessDb,
        updateBusinessDb,
        deleteFromBusinessDb,
        // Market Research
        marketResearch,
        saveResearch,
        updateResearch,
        deleteResearch,
        // Pipeline / Prospects
        prospects,
        addProspect,
        updateProspect,
        deleteProspect,
        addProspectNote,
        deleteProspectNote,
        addProspectDocument,
        deleteProspectDocument,
        closeProspect,
        reopenProspect,
        PROSPECT_STAGES,
        LOSS_REASONS,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSales = () => useContext(SalesContext);
