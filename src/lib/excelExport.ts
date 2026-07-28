import { Transaction } from '../types';

export function exportToCsv(transactions: Transaction[], filename = 'COD_Report.csv') {
  const headers = [
    'Date',
    'Time',
    'Rider Name',
    'Total COD Amount',
    'Cash Amount',
    'Online Amount',
    'Online Received By',
    'Payment Mode',
    'Remarks',
    'Transaction ID',
  ];

  const rows = transactions.map((t) => [
    `"${t.date || ''}"`,
    `"${t.time || ''}"`,
    `"${(t.riderName || '').replace(/"/g, '""')}"`,
    t.codAmount || 0,
    t.cashAmount || 0,
    t.onlineAmount || 0,
    `"${t.onlineReceivedBy || ''}"`,
    `"${t.paymentMode || ''}"`,
    `"${(t.remarks || '').replace(/"/g, '""')}"`,
    `"${t.id || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
