import React, { useState } from 'react';
import { DashboardStats } from '../types';
import { Calculator, CheckCircle2, AlertTriangle, Download, X, IndianRupee, ShieldCheck, Banknote, CreditCard } from 'lucide-react';
import { generatePdfReport } from '../lib/pdf';

interface DailyClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DashboardStats;
}

export const DailyClosingModal: React.FC<DailyClosingModalProps> = ({ isOpen, onClose, stats }) => {
  const [physicalCashInput, setPhysicalCashInput] = useState<string>('');

  if (!isOpen) return null;

  const expectedCash = stats.cashCollection || 0;
  const actualCash = parseFloat(physicalCashInput) || 0;
  const cashVariance = actualCash - expectedCash;

  const formatRs = (val: number) => `₹${(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base">End of Shift COD Reconciliation</h2>
              <p className="text-xs text-slate-400">Hub DEL-042 Daily Shift Closing Report</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-600">
              <span>Shift Date:</span>
              <span className="font-mono text-slate-900">{stats.todayDate}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-600">
              <span>Total Transactions:</span>
              <span className="text-slate-900">{stats.totalTransactions} entries</span>
            </div>
            <div className="flex justify-between items-center text-sm font-black text-blue-900 pt-2 border-t border-slate-200">
              <span>Total COD Collected:</span>
              <span>{formatRs(stats.totalCodCollected)}</span>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Cash */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Cash Collection</span>
              </div>
              <div className="text-lg font-black text-emerald-900">{formatRs(stats.cashCollection)}</div>
            </div>

            {/* Online */}
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 mb-1">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Online Collection</span>
              </div>
              <div className="text-lg font-black text-indigo-900">{formatRs(stats.onlineCollection)}</div>
            </div>

          </div>

          {/* Online Receiver Details */}
          <div className="p-3.5 bg-slate-100 rounded-xl text-xs space-y-2 border border-slate-200">
            <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Online Receiver Breakup:
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Shashank's Account:</span>
              <span className="font-bold text-blue-800">{formatRs(stats.onlineShashank)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Akshay's Account:</span>
              <span className="font-bold text-purple-800">{formatRs(stats.onlineAkshay)}</span>
            </div>
          </div>

          {/* Physical Cash Verification Input */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3">
            <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
              Counted Physical Cash in Hand (₹)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={physicalCashInput}
              onChange={(e) => setPhysicalCashInput(e.target.value)}
              placeholder={`Enter counted cash (Expected: ₹${expectedCash})`}
              className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            {physicalCashInput !== '' && (
              <div className="pt-2 border-t border-amber-200">
                {Math.abs(cashVariance) < 0.01 ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-100 p-2 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Exact Match! Physical cash matches system record.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-bold text-red-800 bg-red-100 p-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>
                      Variance Detected! {cashVariance > 0 ? 'Surplus' : 'Shortage'} of {formatRs(Math.abs(cashVariance))}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg"
          >
            Close
          </button>

          <a
            href={`/api/excel/download/${stats.excelFileName}`}
            download
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Daily Excel (.xlsx)</span>
          </a>
        </div>

      </div>
    </div>
  );
};
