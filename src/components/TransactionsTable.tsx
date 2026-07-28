import React, { useState } from 'react';
import { Transaction, PaymentMode, OnlineReceiver } from '../types';
import {
  Search,
  Filter,
  Calendar,
  Edit,
  Trash2,
  FileText,
  Printer,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertTriangle,
  X,
  CreditCard,
  Banknote,
  Sparkles
} from 'lucide-react';
import { exportToCsv } from '../lib/excelExport';
import { generatePdfReport } from '../lib/pdf';

interface TransactionsTableProps {
  transactions: Transaction[];
  loading?: boolean;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  onShowReceipt: (tx: Transaction) => void;
  onRefreshData: () => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  loading,
  onEditTransaction,
  onDeleteTransaction,
  onShowReceipt,
  onRefreshData,
}) => {
  // Filters State
  const [searchDate, setSearchDate] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('All');
  const [filterReceiver, setFilterReceiver] = useState<string>('All');

  // Deletion Confirmation Modal
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Filter Logic
  const filtered = transactions.filter((t) => {
    if (searchDate && t.date !== searchDate) {
      return false;
    }
    if (filterMode !== 'All' && t.paymentMode !== filterMode) {
      return false;
    }
    if (filterReceiver !== 'All' && t.onlineReceivedBy !== filterReceiver) {
      return false;
    }
    return true;
  });

  // Calculate totals for filtered subset
  const totalCodFiltered = filtered.reduce((acc, curr) => acc + (curr.codAmount || 0), 0);
  const totalCashFiltered = filtered.reduce((acc, curr) => acc + (curr.cashAmount || 0), 0);
  const totalOnlineFiltered = filtered.reduce((acc, curr) => acc + (curr.onlineAmount || 0), 0);

  // Pagination Slicing
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDeleteConfirm = async () => {
    if (!deleteTxId) return;
    setIsDeleting(true);
    try {
      await onDeleteTransaction(deleteTxId);
      setDeleteTxId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = () => {
    exportToCsv(filtered, `COD_Filtered_${Date.now()}.csv`);
  };

  const handleExportPdf = () => {
    generatePdfReport(filtered, 'Delhivery COD Transactions Report', `Filtered Total: ₹${totalCodFiltered.toLocaleString('en-IN')} (${filtered.length} entries)`);
  };

  const formatRs = (val: number) => `₹${(val || 0).toLocaleString('en-IN')}`;

  const targetTxToDelete = transactions.find((t) => t.id === deleteTxId);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      
      {/* Table Header & Controls */}
      <div className="p-5 bg-slate-50 border-b border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Saved Transactions Ledger</span>
              <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                {filtered.length} entries
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live records fetched directly from daily Excel workbooks
            </p>
          </div>

          {/* Export & Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export PDF Report</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          
          {/* Search by Date */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => {
                setSearchDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchDate && (
              <button
                onClick={() => setSearchDate('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Payment Mode Filter */}
          <div className="relative">
            <select
              value={filterMode}
              onChange={(e) => {
                setFilterMode(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">Payment Mode: All</option>
              <option value="Cash">Cash Only</option>
              <option value="Online">Online Only</option>
              <option value="Cash + Online">Cash + Online (Split)</option>
            </select>
          </div>

          {/* Online Receiver Filter */}
          <div className="relative">
            <select
              value={filterReceiver}
              onChange={(e) => {
                setFilterReceiver(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">Online Receiver: All</option>
              <option value="Shashank">Shashank</option>
              <option value="Akshay">Akshay</option>
            </select>
          </div>

        </div>

      </div>

      {/* Main Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Rider Name</th>
              <th className="py-3 px-4 text-right">Total COD</th>
              <th className="py-3 px-4 text-right">Cash</th>
              <th className="py-3 px-4 text-right">Online</th>
              <th className="py-3 px-4 text-center">Online Received By</th>
              <th className="py-3 px-4 text-center">Payment Mode</th>
              <th className="py-3 px-4">Remarks</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs text-slate-800 font-medium">
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={9} className="py-4 px-4">
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                  </td>
                </tr>
              ))
            ) : paginated.length > 0 ? (
              paginated.map((tx) => (
                <tr key={tx.id} className="hover:bg-blue-50/40 transition-colors">
                  
                  {/* Date & Time */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{tx.date}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{tx.time}</div>
                  </td>

                  {/* Rider Name */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{tx.riderName}</div>
                  </td>

                  {/* Total COD */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className="font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {formatRs(tx.codAmount)}
                    </span>
                  </td>

                  {/* Cash Amount */}
                  <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-emerald-700">
                    {tx.cashAmount > 0 ? formatRs(tx.cashAmount) : '-'}
                  </td>

                  {/* Online Amount */}
                  <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-indigo-700">
                    {tx.onlineAmount > 0 ? formatRs(tx.onlineAmount) : '-'}
                  </td>

                  {/* Online Received By */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {tx.onlineReceivedBy ? (
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          tx.onlineReceivedBy === 'Shashank'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {tx.onlineReceivedBy}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Payment Mode */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {tx.paymentMode === 'Cash' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        <Banknote className="w-3 h-3 text-emerald-600" />
                        Cash
                      </span>
                    )}
                    {tx.paymentMode === 'Online' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                        <CreditCard className="w-3 h-3 text-indigo-600" />
                        Online
                      </span>
                    )}
                    {tx.paymentMode === 'Cash + Online' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px] font-bold">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        Split
                      </span>
                    )}
                  </td>

                  {/* Remarks */}
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={tx.remarks}>
                    {tx.remarks || '-'}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      
                      {/* Print Receipt */}
                      <button
                        onClick={() => onShowReceipt(tx)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View / Print Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        title="Edit Transaction"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteTxId(tx.id)}
                        className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="w-10 h-10 text-slate-300" />
                    <p className="font-bold text-slate-700">No matching COD transactions found</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters or enter a new entry above.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Totals Bar */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Subset Totals */}
        <div className="flex flex-wrap items-center gap-4 text-slate-700 font-semibold">
          <span>
            Total COD: <strong className="text-blue-900">{formatRs(totalCodFiltered)}</strong>
          </span>
          <span>
            Cash: <strong className="text-emerald-700">{formatRs(totalCashFiltered)}</strong>
          </span>
          <span>
            Online: <strong className="text-indigo-700">{formatRs(totalOnlineFiltered)}</strong>
          </span>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {deleteTxId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-scaleUp">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2.5 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Confirm Deletion</h3>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete this COD entry for{' '}
              <strong className="text-slate-900">{targetTxToDelete?.riderName}</strong> (₹
              {targetTxToDelete?.codAmount})? This row will be permanently removed from today's Excel workbook file.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTxId(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
              >
                {isDeleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
