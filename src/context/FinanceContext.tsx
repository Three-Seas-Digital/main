import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { generateId, safeSetItem, safeGetItem } from '../constants';
import { syncToApi } from '../api/apiSync';
import { expensesApi } from '../api/expenses';
import { paymentsApi } from '../api/payments';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FinanceContext = createContext<any>(null);

const PAYMENTS_KEY = 'threeseas_payments';
const EXPENSES_KEY = 'threeseas_expenses';

export const EXPENSE_CATEGORIES: { value: string; label: string; color: string }[] = [
  { value: 'wages', label: 'Wages', color: '#3b82f6' },
  { value: 'fuel', label: 'Fuel', color: '#f59e0b' },
  { value: 'food', label: 'Food', color: '#10b981' },
  { value: 'meetings', label: 'Meetings', color: '#8b5cf6' },
  { value: 'trips', label: 'Trips', color: '#ec4899' },
  { value: 'receipts', label: 'Receipts / Other', color: '#6b7280' },
];

export const SUBSCRIPTION_TIERS: Record<string, { label: string; color: string; description: string }> = {
  free: { label: 'Free', color: '#9ca3af', description: 'Basic access with limited features' },
  basic: { label: 'Basic', color: '#3b82f6', description: 'Essential tools for small businesses' },
  premium: { label: 'Premium', color: '#8b5cf6', description: 'Advanced features for growing teams' },
  enterprise: { label: 'Enterprise', color: '#f59e0b', description: 'Full suite with priority support' },
};

export const RECURRING_FREQUENCIES: { value: string; label: string; days: number }[] = [
  { value: 'weekly', label: 'Weekly', days: 7 },
  { value: 'biweekly', label: 'Bi-Weekly', days: 14 },
  { value: 'monthly', label: 'Monthly', days: 30 },
  { value: 'quarterly', label: 'Quarterly', days: 90 },
  { value: 'yearly', label: 'Yearly', days: 365 },
];

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [payments, setPayments] = useState<any[]>(() => safeGetItem(PAYMENTS_KEY, []));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [expenses, setExpenses] = useState<any[]>(() => safeGetItem(EXPENSES_KEY, []));

  useEffect(() => {
    safeSetItem(PAYMENTS_KEY, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    safeSetItem(EXPENSES_KEY, JSON.stringify(expenses));
  }, [expenses]);

  // Expenses
  const addExpense = (data: Record<string, any>) => {
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
    syncToApi(() => expensesApi.create(expense), 'addExpense');
    return { success: true, expense };
  };

  const updateExpense = (id: string, updates: Record<string, any>) => {
    const exists = expenses.find((e: any) => e.id === id);
    if (!exists) return { success: false, error: 'Expense not found' };
    setExpenses((prev) => prev.map((e: any) => (e.id === id ? { ...e, ...updates } : e)));
    syncToApi(() => expensesApi.update(id, updates), 'updateExpense');
    return { success: true };
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e: any) => e.id !== id));
    syncToApi(() => expensesApi.delete(id), 'deleteExpense');
    return { success: true };
  };

  // Payments
  const recordPayment = (clientId: string, paymentData: Record<string, any>) => {
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
    syncToApi(() => paymentsApi.create(payment), 'recordPayment');
    return payment;
  };

  // Used by markInvoicePaid in AppContext
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addPaymentRecord = (payment: any) => {
    setPayments((prev) => [...prev, payment]);
    syncToApi(() => paymentsApi.create(payment), 'addPaymentRecord');
  };

  // Used by unmarkInvoicePaid in AppContext
  const removePaymentByInvoice = (invoiceId: string) => {
    const payment = payments.find((p: any) => p.invoiceId === invoiceId);
    setPayments((prev) => prev.filter((p: any) => p.invoiceId !== invoiceId));
    if (payment) {
      syncToApi(() => paymentsApi.delete(payment.id), 'removePaymentByInvoice');
    }
  };

  const value = useMemo(() => ({
    payments, expenses, addExpense, updateExpense, deleteExpense,
    recordPayment, addPaymentRecord, removePaymentByInvoice,
    EXPENSE_CATEGORIES, SUBSCRIPTION_TIERS, RECURRING_FREQUENCIES,
  }), [payments, expenses]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFinance = () => useContext(FinanceContext);
