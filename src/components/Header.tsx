import React, { useState, useEffect } from 'react';
import { Package, FileSpreadsheet, Users, Download, Clock, ShieldCheck, RefreshCw, Calculator } from 'lucide-react';

interface HeaderProps {
  todayExcelFileName: string;
  onOpenRiderManager: () => void;
  onOpenDailyClosing: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  todayExcelFileName,
  onOpenRiderManager,
  onOpenDailyClosing,
  onRefreshData,
  isRefreshing,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setDateStr(now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDownloadTodayExcel = () => {
    if (todayExcelFileName) {
      window.open(`/api/excel/download/${todayExcelFileName}`, '_blank');
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3.5 gap-4">
          
          {/* Brand & Store Details */}
          <div className="flex items-center space-x-3.5">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white font-black px-1.5 py-0.5 rounded text-xs tracking-wider">
                  DELHIVERY
                </span>
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                  COD Management System
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Storage
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Hub DEL-042 (West Delhi Ops Center)</span>
                <span>•</span>
                <span className="text-slate-300 font-medium">{dateStr}</span>
              </p>
            </div>
          </div>

          {/* Right Side: File Status & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            
            {/* Clock Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 text-xs border border-slate-700/60">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono font-medium text-slate-200">{timeStr}</span>
            </div>

            {/* Current Active Excel File Badge */}
            <div 
              onClick={handleDownloadTodayExcel}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 text-xs cursor-pointer hover:bg-emerald-900/60 transition-colors shadow-sm group"
              title="Click to download today's live Excel sheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-emerald-400/80 leading-none">Auto-Sync Excel</span>
                <span className="font-mono font-semibold text-emerald-200">{todayExcelFileName || 'COD_Today.xlsx'}</span>
              </div>
              <Download className="w-3.5 h-3.5 ml-1 text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefreshData}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            {/* Riders Manager Button */}
            <button
              onClick={onOpenRiderManager}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <Users className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Riders</span>
            </button>

            {/* Daily Closing Report Button */}
            <button
              onClick={onOpenDailyClosing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Calculator className="w-4 h-4" />
              <span>Shift Reconciliation</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
