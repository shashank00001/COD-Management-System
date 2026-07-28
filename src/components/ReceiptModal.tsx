import React from 'react';
import { Transaction } from '../types';
import { Printer, Share2, X, CheckCircle2, Package, Calendar, Clock, User, Banknote, CreditCard, Sparkles } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const generateWhatsAppText = () => {
    const text = `*DELHIVERY COD RECEIPT*\n-------------------------\n*Txn ID:* ${transaction.id}\n*Date & Time:* ${transaction.date} ${transaction.time}\n*Rider:* ${transaction.riderName}\n-------------------------\n*Total COD Amount:* ₹${transaction.codAmount.toLocaleString('en-IN')}\n*Cash Paid:* ₹${transaction.cashAmount.toLocaleString('en-IN')}\n*Online Paid:* ₹${transaction.onlineAmount.toLocaleString('en-IN')}${
      transaction.onlineReceivedBy ? ` (Recv by ${transaction.onlineReceivedBy})` : ''
    }\n*Payment Mode:* ${transaction.paymentMode}\n-------------------------\nHub: West Delhi Ops DEL-042\nStatus: VERIFIED & SYNCED TO EXCEL`;

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const formatRs = (val: number) => `₹${(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-scaleUp">
        
        {/* Printable Receipt Frame */}
        <div id="printable-receipt" className="p-6 space-y-5 bg-white">
          
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-4">
            <div className="inline-flex items-center gap-1.5 bg-red-600 text-white font-black px-2 py-0.5 rounded text-xs tracking-wider mb-2">
              DELHIVERY LOGISTICS
            </div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">COD Cash Receipt</h2>
            <p className="text-xs text-slate-500">Hub DEL-042 • West Delhi Operations Center</p>
            <div className="mt-2 text-[11px] font-mono font-bold text-slate-600 bg-slate-100 py-1 px-2 rounded inline-block">
              {transaction.id}
            </div>
          </div>

          {/* Timestamp & Rider Details */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Date & Time:</span>
              <span className="font-bold text-slate-900">{transaction.date} | {transaction.time}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> Rider Name:</span>
              <span className="font-bold text-slate-900 text-sm">{transaction.riderName}</span>
            </div>
          </div>

          {/* Amount Breakdown Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-700">Total COD Collected:</span>
              <span className="text-xl font-black text-blue-900">{formatRs(transaction.codAmount)}</span>
            </div>

            <div className="pt-2 border-t border-slate-200/80 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Cash Portion:</span>
                <span className="font-bold text-emerald-700">{formatRs(transaction.cashAmount)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Online Portion:</span>
                <span className="font-bold text-indigo-700">{formatRs(transaction.onlineAmount)}</span>
              </div>

              {transaction.onlineReceivedBy && (
                <div className="flex justify-between text-slate-600">
                  <span>Online Received By:</span>
                  <span className="font-bold text-purple-800">{transaction.onlineReceivedBy}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 pt-1">
                <span>Payment Mode:</span>
                <span className="font-bold text-slate-800">{transaction.paymentMode}</span>
              </div>
            </div>
          </div>

          {transaction.remarks && (
            <div className="text-xs bg-amber-50 text-amber-900 p-2.5 rounded-lg border border-amber-200">
              <strong className="block text-[10px] uppercase text-amber-700">Remarks:</strong>
              {transaction.remarks}
            </div>
          )}

          {/* Stamp / Verification */}
          <div className="pt-2 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1 border-t border-dashed border-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Verified & Stored in Daily Excel Workbook</span>
          </div>

        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <a
              href={generateWhatsAppText()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share WhatsApp</span>
            </a>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
