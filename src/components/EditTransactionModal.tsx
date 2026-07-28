import React, { useState, useEffect } from 'react';
import { Transaction, PaymentMode, OnlineReceiver } from '../types';
import { Edit, X, CheckCircle, AlertCircle, Banknote, CreditCard, Sparkles } from 'lucide-react';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onSaveUpdate: (id: string, updatedData: Partial<Transaction>) => Promise<Transaction>;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  onClose,
  onSaveUpdate,
}) => {
  if (!transaction) return null;

  const [riderName, setRiderName] = useState<string>(transaction.riderName || '');
  const [codAmount, setCodAmount] = useState<string>(String(transaction.codAmount || ''));
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(transaction.paymentMode || 'Cash');
  const [cashAmount, setCashAmount] = useState<string>(String(transaction.cashAmount || ''));
  const [onlineAmount, setOnlineAmount] = useState<string>(String(transaction.onlineAmount || ''));
  const [onlineReceivedBy, setOnlineReceivedBy] = useState<OnlineReceiver | ''>(
    transaction.onlineReceivedBy || 'Shashank'
  );
  const [date, setDate] = useState<string>(transaction.date || '');
  const [time, setTime] = useState<string>(transaction.time || '');
  const [remarks, setRemarks] = useState<string>(transaction.remarks || '');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (transaction) {
      setRiderName(transaction.riderName);
      setCodAmount(String(transaction.codAmount));
      setPaymentMode(transaction.paymentMode);
      setCashAmount(String(transaction.cashAmount));
      setOnlineAmount(String(transaction.onlineAmount));
      setOnlineReceivedBy(transaction.onlineReceivedBy || 'Shashank');
      setDate(transaction.date);
      setTime(transaction.time);
      setRemarks(transaction.remarks || '');
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderName.trim()) {
      setErrorMsg('Rider name is required.');
      return;
    }
    const codVal = parseFloat(codAmount);
    if (isNaN(codVal) || codVal <= 0) {
      setErrorMsg('COD Amount must be a positive number.');
      return;
    }

    let finalCash = 0;
    let finalOnline = 0;

    if (paymentMode === 'Cash') {
      finalCash = codVal;
      finalOnline = 0;
    } else if (paymentMode === 'Online') {
      finalCash = 0;
      finalOnline = codVal;
      if (!onlineReceivedBy) {
        setErrorMsg('Select who received the online payment.');
        return;
      }
    } else if (paymentMode === 'Cash + Online') {
      finalCash = parseFloat(cashAmount) || 0;
      finalOnline = parseFloat(onlineAmount) || 0;

      if (Math.abs(finalCash + finalOnline - codVal) > 0.01) {
        setErrorMsg(
          `Split Mismatch: Cash (₹${finalCash}) + Online (₹${finalOnline}) must equal COD Amount (₹${codVal}).`
        );
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onSaveUpdate(transaction.id, {
        riderName: riderName.trim(),
        codAmount: codVal,
        cashAmount: finalCash,
        onlineAmount: finalOnline,
        onlineReceivedBy: finalOnline > 0 ? onlineReceivedBy : '',
        paymentMode,
        remarks: remarks.trim(),
        date,
        time,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update transaction in Excel file.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base">Edit COD Transaction</h2>
            <span className="text-xs font-mono text-slate-400">({transaction.id})</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rider Name</label>
            <input
              type="text"
              value={riderName}
              onChange={(e) => setRiderName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">COD Amount (₹)</label>
              <input
                type="number"
                step="any"
                value={codAmount}
                onChange={(e) => setCodAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
              >
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
                <option value="Cash + Online">Cash + Online (Split)</option>
              </select>
            </div>
          </div>

          {paymentMode === 'Cash + Online' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cash Portion (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Online Portion (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={onlineAmount}
                  onChange={(e) => setOnlineAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded text-xs font-bold"
                />
              </div>
            </div>
          )}

          {(paymentMode === 'Online' || paymentMode === 'Cash + Online') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Online Received By</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOnlineReceivedBy('Shashank')}
                  className={`p-2 text-xs font-bold rounded-lg border ${
                    onlineReceivedBy === 'Shashank'
                      ? 'bg-blue-600 text-white border-blue-700'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Shashank
                </button>
                <button
                  type="button"
                  onClick={() => setOnlineReceivedBy('Akshay')}
                  className={`p-2 text-xs font-bold rounded-lg border ${
                    onlineReceivedBy === 'Akshay'
                      ? 'bg-purple-600 text-white border-purple-700'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Akshay
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm"
            >
              {isSubmitting ? 'Updating Excel...' : 'Save Changes'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
