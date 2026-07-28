import React, { useState, useEffect, useRef } from 'react';
import { PaymentMode, OnlineReceiver, Rider, Transaction } from '../types';
import {
  PlusCircle,
  Search,
  User,
  IndianRupee,
  CreditCard,
  Banknote,
  AlertCircle,
  CheckCircle,
  Calendar,
  Clock,
  MessageSquare,
  Sparkles,
  Printer,
  Share2,
  X,
  UserPlus
} from 'lucide-react';

interface CodEntryFormProps {
  riders: Rider[];
  onSaveTransaction: (data: Partial<Transaction>) => Promise<Transaction>;
  onAddRider: (data: { name: string; phone?: string; vehicleNo?: string }) => Promise<Rider>;
  onShowReceipt: (transaction: Transaction) => void;
}

export const CodEntryForm: React.FC<CodEntryFormProps> = ({
  riders,
  onSaveTransaction,
  onAddRider,
  onShowReceipt,
}) => {
  // Form State
  const [riderName, setRiderName] = useState<string>('');
  const [codAmount, setCodAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [onlineAmount, setOnlineAmount] = useState<string>('');
  const [onlineReceivedBy, setOnlineReceivedBy] = useState<OnlineReceiver | ''>('Shashank');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [lastSavedTx, setLastSavedTx] = useState<Transaction | null>(null);

  // Rider Dropdown Search
  const [riderSearch, setRiderSearch] = useState<string>('');
  const [isRiderDropdownOpen, setIsRiderDropdownOpen] = useState<boolean>(false);
  const [showAddRiderModal, setShowAddRiderModal] = useState<boolean>(false);
  const [newRiderPhone, setNewRiderPhone] = useState<string>('');
  const [newRiderVehicle, setNewRiderVehicle] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto fill today's date and time on mount
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setDate(`${year}-${month}-${day}`);

    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = String(hours % 12 || 12).padStart(2, '0');
    setTime(`${formattedHours}:${minutes} ${ampm}`);
  }, []);

  // Close rider dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRiderDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Payment Mode changes & auto syncing amounts
  useEffect(() => {
    const total = parseFloat(codAmount) || 0;
    if (paymentMode === 'Cash') {
      setCashAmount(total > 0 ? String(total) : '');
      setOnlineAmount('0');
    } else if (paymentMode === 'Online') {
      setCashAmount('0');
      setOnlineAmount(total > 0 ? String(total) : '');
    } else if (paymentMode === 'Cash + Online') {
      // Initialize half split or leave open for user input
      if (total > 0 && (!cashAmount || !onlineAmount)) {
        const half = Math.floor(total / 2);
        setCashAmount(String(half));
        setOnlineAmount(String(total - half));
      }
    }
  }, [paymentMode, codAmount]);

  // Handle Cash input change in Split mode -> auto calculate online amount
  const handleCashAmountChange = (val: string) => {
    setCashAmount(val);
    const total = parseFloat(codAmount) || 0;
    const cash = parseFloat(val) || 0;
    if (paymentMode === 'Cash + Online' && total >= 0) {
      const remaining = Math.max(0, total - cash);
      setOnlineAmount(String(remaining));
    }
  };

  // Handle Online input change in Split mode -> auto calculate cash amount
  const handleOnlineAmountChange = (val: string) => {
    setOnlineAmount(val);
    const total = parseFloat(codAmount) || 0;
    const online = parseFloat(val) || 0;
    if (paymentMode === 'Cash + Online' && total >= 0) {
      const remaining = Math.max(0, total - online);
      setCashAmount(String(remaining));
    }
  };

  // Validation Check
  const validateForm = (): boolean => {
    setErrorMsg('');

    if (!riderName.trim()) {
      setErrorMsg('Please select or enter a valid Rider Name.');
      return false;
    }

    const codVal = parseFloat(codAmount);
    if (isNaN(codVal) || codVal <= 0) {
      setErrorMsg('COD Amount is required and must be a positive number.');
      return false;
    }

    const cashVal = parseFloat(cashAmount) || 0;
    const onlineVal = parseFloat(onlineAmount) || 0;

    if (cashVal < 0 || onlineVal < 0) {
      setErrorMsg('Negative values are not allowed for payment amounts.');
      return false;
    }

    if (paymentMode === 'Cash') {
      if (cashVal !== codVal) {
        setCashAmount(String(codVal));
      }
    } else if (paymentMode === 'Online') {
      if (!onlineReceivedBy) {
        setErrorMsg('Please select who received the online payment (Shashank or Akshay).');
        return false;
      }
    } else if (paymentMode === 'Cash + Online') {
      if (Math.abs(cashVal + onlineVal - codVal) > 0.01) {
        setErrorMsg(
          `Split Payment Mismatch: Cash (₹${cashVal}) + Online (₹${onlineVal}) = ₹${
            cashVal + onlineVal
          }. Must equal total COD Amount (₹${codVal}).`
        );
        return false;
      }
      if (onlineVal > 0 && !onlineReceivedBy) {
        setErrorMsg('Please select who received the online portion (Shashank or Akshay).');
        return false;
      }
    }

    return true;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const codVal = parseFloat(codAmount);
      let finalCash = 0;
      let finalOnline = 0;

      if (paymentMode === 'Cash') {
        finalCash = codVal;
      } else if (paymentMode === 'Online') {
        finalOnline = codVal;
      } else {
        finalCash = parseFloat(cashAmount) || 0;
        finalOnline = parseFloat(onlineAmount) || 0;
      }

      const payload = {
        riderName: riderName.trim(),
        codAmount: codVal,
        cashAmount: finalCash,
        onlineAmount: finalOnline,
        onlineReceivedBy: finalOnline > 0 ? onlineReceivedBy : '',
        paymentMode,
        remarks: remarks.trim(),
        date,
        time,
      };

      const savedTx = await onSaveTransaction(payload);

      setLastSavedTx(savedTx);
      setSuccessMsg(`✓ Saved to Excel (COD_${date}.xlsx) for rider ${savedTx.riderName}!`);

      // Reset fields for next fast entry
      setRiderName('');
      setRiderSearch('');
      setCodAmount('');
      setCashAmount('');
      setOnlineAmount('');
      setRemarks('');

      // Refresh current time for next entry
      const now = new Date();
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = String(hours % 12 || 12).padStart(2, '0');
      setTime(`${formattedHours}:${minutes} ${ampm}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save entry. Please check server logs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add New Rider
  const handleQuickAddRider = async () => {
    if (!riderSearch.trim()) return;
    try {
      const newR = await onAddRider({
        name: riderSearch.trim(),
        phone: newRiderPhone.trim(),
        vehicleNo: newRiderVehicle.trim(),
      });
      setRiderName(newR.name);
      setRiderSearch(newR.name);
      setShowAddRiderModal(false);
      setIsRiderDropdownOpen(false);
      setNewRiderPhone('');
      setNewRiderVehicle('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not add rider');
    }
  };

  // Filter riders list
  const filteredRiders = riders.filter((r) =>
    r.name.toLowerCase().includes(riderSearch.toLowerCase().trim())
  );

  const totalCodNum = parseFloat(codAmount) || 0;
  const cashNum = parseFloat(cashAmount) || 0;
  const onlineNum = parseFloat(onlineAmount) || 0;
  const isSplitMatch = paymentMode === 'Cash + Online' && Math.abs(cashNum + onlineNum - totalCodNum) < 0.01 && totalCodNum > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      
      {/* Header Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">New COD Entry Form</h2>
            <p className="text-xs text-slate-500">Record rider cash or online collection directly into today's Excel sheet</p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200/80">
          Fast Data Entry
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">

        {/* Top Alerts */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            {lastSavedTx && (
              <button
                type="button"
                onClick={() => onShowReceipt(lastSavedTx)}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-700 text-white text-xs font-bold rounded-lg hover:bg-emerald-800 transition-colors shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>View Receipt</span>
              </button>
            )}
          </div>
        )}

        {/* Primary Row: Rider Name & COD Amount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Rider Name Searchable Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Rider Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={riderSearch}
                onChange={(e) => {
                  setRiderSearch(e.target.value);
                  setRiderName(e.target.value);
                  setIsRiderDropdownOpen(true);
                }}
                onFocus={() => setIsRiderDropdownOpen(true)}
                placeholder="Type or select rider name..."
                className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              {riderSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setRiderSearch('');
                    setRiderName('');
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown Options */}
            {isRiderDropdownOpen && (
              <div className="absolute z-30 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-xl max-h-56 overflow-y-auto">
                {filteredRiders.length > 0 ? (
                  filteredRiders.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => {
                        setRiderName(r.name);
                        setRiderSearch(r.name);
                        setIsRiderDropdownOpen(false);
                      }}
                      className="px-3.5 py-2.5 text-sm hover:bg-blue-50 cursor-pointer flex items-center justify-between border-b border-slate-100 last:border-0"
                    >
                      <span className="font-medium text-slate-800">{r.name}</span>
                      {r.vehicleNo && <span className="text-xs text-slate-400 font-mono">{r.vehicleNo}</span>}
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center">
                    <p className="text-xs text-slate-500 mb-2">No existing rider found with "{riderSearch}"</p>
                    <button
                      type="button"
                      onClick={() => setShowAddRiderModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add "{riderSearch}" as new rider
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* COD Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              COD Amount (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-bold">
                ₹
              </div>
              <input
                type="number"
                step="any"
                min="0"
                value={codAmount}
                onChange={(e) => setCodAmount(e.target.value)}
                placeholder="Enter total COD collected (e.g. 1250)"
                className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-base font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

        </div>

        {/* Payment Mode Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Payment Mode <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            
            {/* Cash Button */}
            <button
              type="button"
              onClick={() => setPaymentMode('Cash')}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-bold transition-all ${
                paymentMode === 'Cash'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/30 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Banknote className={`w-4 h-4 ${paymentMode === 'Cash' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Cash</span>
            </button>

            {/* Online Button */}
            <button
              type="button"
              onClick={() => setPaymentMode('Online')}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-bold transition-all ${
                paymentMode === 'Online'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-800 ring-2 ring-indigo-500/30 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CreditCard className={`w-4 h-4 ${paymentMode === 'Online' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Online</span>
            </button>

            {/* Split Payment Button */}
            <button
              type="button"
              onClick={() => setPaymentMode('Cash + Online')}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-bold transition-all ${
                paymentMode === 'Cash + Online'
                  ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/30 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${paymentMode === 'Cash + Online' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>Cash + Online</span>
            </button>

          </div>
        </div>

        {/* Dynamic Mode Fields */}
        
        {/* Mode = Cash */}
        {paymentMode === 'Cash' && (
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-semibold text-emerald-900">Cash Collection Amount</p>
                <p className="text-xs text-emerald-700">Full amount collected in Physical Cash</p>
              </div>
            </div>
            <div className="text-lg font-black text-emerald-800">
              ₹{(totalCodNum || 0).toLocaleString('en-IN')}
            </div>
          </div>
        )}

        {/* Mode = Online */}
        {paymentMode === 'Online' && (
          <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-900 uppercase">Online Payment Received By</span>
              </div>
              <div className="text-lg font-black text-indigo-800">
                ₹{(totalCodNum || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <label
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                  onlineReceivedBy === 'Shashank'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="onlineReceiver"
                  value="Shashank"
                  checked={onlineReceivedBy === 'Shashank'}
                  onChange={() => setOnlineReceivedBy('Shashank')}
                  className="sr-only"
                />
                <span>Shashank</span>
              </label>

              <label
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                  onlineReceivedBy === 'Akshay'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="onlineReceiver"
                  value="Akshay"
                  checked={onlineReceivedBy === 'Akshay'}
                  onChange={() => setOnlineReceivedBy('Akshay')}
                  className="sr-only"
                />
                <span>Akshay</span>
              </label>
            </div>
          </div>
        )}

        {/* Mode = Cash + Online Split */}
        {paymentMode === 'Cash + Online' && (
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Split Payment Calculator
              </span>
              <span className="text-xs font-semibold text-amber-700">
                Target Total: ₹{totalCodNum.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Cash Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cash Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={cashAmount}
                  onChange={(e) => handleCashAmountChange(e.target.value)}
                  placeholder="Cash portion"
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Online Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Online Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={onlineAmount}
                  onChange={(e) => handleOnlineAmountChange(e.target.value)}
                  placeholder="Online portion"
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

            </div>

            {/* Online Received By for Split */}
            {onlineNum > 0 && (
              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1.5">
                  Online Portion Received By:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOnlineReceivedBy('Shashank')}
                    className={`p-2 text-xs font-bold rounded-lg border transition-all ${
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
                    className={`p-2 text-xs font-bold rounded-lg border transition-all ${
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

            {/* Split Validation Check Banner */}
            <div className="pt-2 border-t border-amber-200/80">
              {totalCodNum > 0 && isSplitMatch ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-100/70 p-2 rounded-lg border border-emerald-300">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Verified! Cash (₹{cashNum}) + Online (₹{onlineNum}) = Total COD (₹{totalCodNum})</span>
                </div>
              ) : totalCodNum > 0 ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-red-700 bg-red-100/70 p-2 rounded-lg border border-red-300">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>
                    Mismatch! Sum is ₹{(cashNum + onlineNum).toLocaleString('en-IN')} (Difference:{' '}
                    ₹{(totalCodNum - (cashNum + onlineNum)).toLocaleString('en-IN')})
                  </span>
                </div>
              ) : null}
            </div>

          </div>
        )}

        {/* Date, Time & Remarks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date (Auto)</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Time (Auto)</span>
            </label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g. 09:45 AM"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>Remarks (Optional)</span>
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Packet count, notes, etc."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Saving to Excel...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Save COD Transaction</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* Quick Add Rider Modal */}
      {showAddRiderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>Add New Rider</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRiderModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rider Full Name</label>
                <input
                  type="text"
                  value={riderSearch}
                  onChange={(e) => setRiderSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={newRiderPhone}
                  onChange={(e) => setNewRiderPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle / Route No (Optional)</label>
                <input
                  type="text"
                  value={newRiderVehicle}
                  onChange={(e) => setNewRiderVehicle(e.target.value)}
                  placeholder="e.g. DL-01-AB-1234"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddRiderModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickAddRider}
                className="px-4 py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Save Rider
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
