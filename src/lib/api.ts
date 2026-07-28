import { DashboardStats, Transaction, TransactionFilter, Rider, DailyExcelFileInfo } from '../types';

export async function fetchDashboardStats(date?: string): Promise<DashboardStats> {
  const url = date ? `/api/dashboard/stats?date=${encodeURIComponent(date)}` : '/api/dashboard/stats';
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load dashboard statistics');
  }
  return res.json();
}

export async function fetchTransactions(filters?: TransactionFilter): Promise<Transaction[]> {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.searchDate) params.append('date', filters.searchDate);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.searchRider) params.append('searchRider', filters.searchRider);
    if (filters.paymentMode && filters.paymentMode !== 'All') params.append('paymentMode', filters.paymentMode);
    if (filters.onlineReceiver && filters.onlineReceiver !== 'All') params.append('onlineReceiver', filters.onlineReceiver);
  }

  const res = await fetch(`/api/transactions?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch transactions');
  }
  return res.json();
}

export async function createTransaction(payload: Partial<Transaction>): Promise<Transaction> {
  const res = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save transaction');
  }

  return res.json();
}

export async function updateTransaction(id: string, payload: Partial<Transaction>): Promise<Transaction> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update transaction');
  }

  return res.json();
}

export async function deleteTransaction(id: string): Promise<{ message: string; id: string }> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete transaction');
  }

  return res.json();
}

export async function fetchExcelFiles(): Promise<DailyExcelFileInfo[]> {
  const res = await fetch('/api/excel/files');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load Excel file list');
  }
  return res.json();
}

export async function fetchRiders(): Promise<Rider[]> {
  const res = await fetch('/api/riders');
  if (!res.ok) {
    throw new Error('Failed to load riders list');
  }
  return res.json();
}

export async function addRider(data: { name: string; phone?: string; vehicleNo?: string }): Promise<Rider> {
  const res = await fetch('/api/riders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add rider');
  }

  return res.json();
}

export async function importRiders(names: (string | { name: string; phone?: string; vehicleNo?: string })[]): Promise<{ message: string; totalRiders: number }> {
  const res = await fetch('/api/riders/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ names }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to import riders');
  }

  return res.json();
}
