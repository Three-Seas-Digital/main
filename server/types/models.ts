export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  industry?: string;
  website?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'prospect';
  created_at?: Date;
  updated_at?: Date;
}

export interface Lead {
  id: number;
  client_id: number;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  value?: number;
  probability?: number;
  expected_close_date?: Date;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Appointment {
  id: number;
  client_id: number;
  title: string;
  description?: string;
  start_time: Date;
  end_time: Date;
  status: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
  meeting_link?: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Invoice {
  id: number;
  client_id: number;
  invoice_number: string;
  issue_date: Date;
  due_date: Date;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  description?: string;
  items?: InvoiceItem[];
  created_at?: Date;
  updated_at?: Date;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: Date;
  receipt_url?: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Project {
  id: number;
  client_id: number;
  name: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  start_date?: Date;
  end_date?: Date;
  budget?: number;
  actual_cost?: number;
  progress?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface TimeEntry {
  id: number;
  project_id: number;
  user_id: number;
  description: string;
  hours: number;
  date: Date;
  billable: boolean;
  hourly_rate?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at?: Date;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  details?: string;
  created_at?: Date;
}

export interface RefreshToken {
  id: string;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at?: Date;
}