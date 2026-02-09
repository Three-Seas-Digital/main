import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { generateId } from '../constants';

const FinanceContext = createContext();

const PAYMENTS_KEY = 'threeseas_payments';
const EXPENSES_KEY = 'threeseas_expenses';

const EXPENSE_CATEGORIES = [
  { value: 'wages', label: 'Wages', color: '#3b82f6' },
  { value: 'fuel', label: 'Fuel', color: '#f59e0b' },
  { value: 'food', label: 'Food', color: '#10b981' },
  { value: 'meetings', label: 'Meetings', color: '#8b5cf6' },
  { value: 'trips', label: 'Trips', color: '#ec4899' },
  { value: 'receipts', label: 'Receipts / Other', color: '#6b7280' },
];

const SUBSCRIPTION_TIERS = {
  free: { label: 'Free', color: '#9ca3af', description: 'Basic access with limited features' },
  basic: { label: 'Basic', color: '#3b82f6', description: 'Essential tools for small businesses' },
  premium: { label: 'Premium', color: '#8b5cf6', description: 'Advanced features for growing teams' },
  enterprise: { label: 'Enterprise', color: '#f59e0b', description: 'Full suite with priority support' },
};

const RECURRING_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly', days: 7 },
  { value: 'biweekly', label: 'Bi-Weekly', days: 14 },
  { value: 'monthly', label: 'Monthly', days: 30 },
  { value: 'quarterly', label: 'Quarterly', days: 90 },
  { value: 'yearly', label: 'Yearly', days: 365 },
];

export function FinanceProvider({ children }) {
  const { currentUser } = useAuth();

  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem(PAYMENTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem(EXPENSES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  }, [expenses]);

  // Expenses
  const addExpense = (data) => {
    if (!data.category || !data.amount || !data.date) {
      return { success: false, error: 'Category, amount, and date are required' };
    }
    const expense = {
      id: generateId(),
      category: data.category,
      amount: parseFloat(data.amount),
      description: data.description || '',
      date: data.date,
      receipt: data.receipt || null,
      receiptName: data.receiptName || '',
      vendor: data.vendor || '',
      createdBy: currentUser?.name || 'Unknown',
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [...prev, expense]);
    return { success: true, expense };
  };

  const updateExpense = (id, updates) => {
    const exists = expenses.find((e) => e.id === id);
    if (!exists) return { success: false, error: 'Expense not found' };
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    return { success: true };
  };

  const deleteExpense = (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    return { success: true };
  };

  // Payments
  const recordPayment = (clientId, paymentData) => {
    const payment = {
      id: generateId(),
      clientId,
      service: paymentData.service,
      serviceTier: paymentData.serviceTier,
      amount: paymentData.amount,
      method: paymentData.method,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    setPayments((prev) => [...prev, payment]);
    return payment;
  };

  // Used by markInvoicePaid in AppContext
  const addPaymentRecord = (payment) => {
    setPayments((prev) => [...prev, payment]);
  };

  // Used by unmarkInvoicePaid in AppContext
  const removePaymentByInvoice = (invoiceId) => {
    setPayments((prev) => prev.filter((p) => p.invoiceId !== invoiceId));
  };

  return (
    <FinanceContext.Provider
      value={{
        payments,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        recordPayment,
        addPaymentRecord,
        removePaymentByInvoice,
        EXPENSE_CATEGORIES,
        SUBSCRIPTION_TIERS,
        RECURRING_FREQUENCIES,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFinance = () => useContext(FinanceContext);
