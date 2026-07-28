import React, { useState } from 'react';
import { Rider } from '../types';
import { Users, UserPlus, Upload, X, Search, Check, FileSpreadsheet, Phone, Truck } from 'lucide-react';

interface RiderManagerProps {
  isOpen: boolean;
  onClose: () => void;
  riders: Rider[];
  onAddRider: (rider: { name: string; phone?: string; vehicleNo?: string }) => Promise<Rider>;
  onImportRiders: (names: string[]) => Promise<any>;
}

export const RiderManager: React.FC<RiderManagerProps> = ({
  isOpen,
  onClose,
  riders,
  onAddRider,
  onImportRiders,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'import'>('list');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Single Add State
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [vehicleNo, setVehicleNo] = useState<string>('');

  // Bulk Import Text State
  const [bulkText, setBulkText] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setMsg('');
    try {
      await onAddRider({ name: name.trim(), phone: phone.trim(), vehicleNo: vehicleNo.trim() });
      setMsg(`✓ Added rider "${name}" successfully`);
      setName('');
      setPhone('');
      setVehicleNo('');
      setActiveTab('list');
    } catch (err: any) {
      setMsg(err.message || 'Error adding rider');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    const lines = bulkText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    setLoading(true);
    setMsg('');
    try {
      const res = await onImportRiders(lines);
      setMsg(res.message || `✓ Imported ${lines.length} riders!`);
      setBulkText('');
      setActiveTab('list');
    } catch (err: any) {
      setMsg(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredRiders = riders.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-base">Rider Operations Directory</h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {riders.length} registered
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-t-lg border-b-2 transition-all ${
              activeTab === 'list'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Riders Directory ({riders.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 rounded-t-lg border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Single Rider</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-t-lg border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Import Names</span>
          </button>
        </div>

        {msg && (
          <div className="mx-5 mt-3 p-2.5 bg-blue-50 text-blue-800 text-xs font-bold rounded-lg border border-blue-200">
            {msg}
          </div>
        )}

        {/* Tab 1: Rider Directory */}
        {activeTab === 'list' && (
          <div className="p-5 flex-1 overflow-y-auto space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registered riders..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              {filteredRiders.length > 0 ? (
                filteredRiders.map((r, i) => (
                  <div key={r.id || i} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{r.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          {r.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{r.phone}</span>}
                          {r.vehicleNo && <span className="flex items-center gap-1 font-mono"><Truck className="w-3 h-3 text-slate-400" />{r.vehicleNo}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">No riders found.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Add Single Rider */}
        {activeTab === 'add' && (
          <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rider Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vikramaditya Sharma"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle / Delivery Route No</label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  placeholder="DL-01-AB-1234"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
            >
              {loading ? 'Adding...' : 'Save Rider to Directory'}
            </button>
          </form>
        )}

        {/* Tab 3: Bulk Import */}
        {activeTab === 'import' && (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Paste Rider Names (One per line)
              </label>
              <textarea
                rows={6}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`Enter rider names, one per line...`}
                className="w-full p-3 border border-slate-300 rounded-lg text-xs font-mono"
              ></textarea>
              <p className="text-[11px] text-slate-500 mt-1">
                Tip: You can copy a column of rider names directly from Excel or CSV and paste here.
              </p>
            </div>

            <button
              onClick={handleBulkImport}
              disabled={loading || !bulkText.trim()}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import Rider Names'}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
