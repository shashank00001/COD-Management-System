import React, { useState, useEffect } from 'react';
import { DailyExcelFileInfo, Transaction } from '../types';
import { fetchExcelFiles, fetchTransactions } from '../lib/api';
import { exportToCsv } from '../lib/excelExport';
import { generatePdfReport } from '../lib/pdf';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  FileText,
  FileCheck,
  HardDrive,
  RefreshCw,
  Search,
  CheckCircle2,
  Table,
  BarChart3
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [excelFiles, setExcelFiles] = useState<DailyExcelFileInfo[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(true);

  // Filter State
  const [presetRange, setPresetRange] = useState<'today' | 'yesterday' | 'custom' | 'all'>('today');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [riderFilter, setRiderFilter] = useState<string>('');

  // Report Transactions Result
  const [reportData, setReportData] = useState<Transaction[]>([]);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);

  // Load daily excel files list on mount
  const loadFiles = async () => {
    setLoadingFiles(true);
    try {
      const files = await fetchExcelFiles();
      setExcelFiles(files);
    } catch (err) {
      console.error('Failed to load Excel files', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // Update dates when preset changes
  useEffect(() => {
    const today = new Date();
    const getFormattedDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (presetRange === 'today') {
      const tStr = getFormattedDate(today);
      setStartDate(tStr);
      setEndDate(tStr);
    } else if (presetRange === 'yesterday') {
      const yDate = new Date(today);
      yDate.setDate(yDate.getDate() - 1);
      const yStr = getFormattedDate(yDate);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (presetRange === 'all') {
      setStartDate('');
      setEndDate('');
    }
  }, [presetRange]);

  // Run report query
  const handleRunReport = async () => {
    setLoadingReport(true);
    try {
      const txs = await fetchTransactions({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        searchRider: riderFilter || undefined,
      });
      setReportData(txs);
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    handleRunReport();
  }, [startDate, endDate, riderFilter]);

  // Aggregated Report Totals
  const totalCod = reportData.reduce((a, b) => a + (b.codAmount || 0), 0);
  const totalCash = reportData.reduce((a, b) => a + (b.cashAmount || 0), 0);
  const totalOnline = reportData.reduce((a, b) => a + (b.onlineAmount || 0), 0);
  const shashankOnline = reportData.reduce((a, b) => a + (b.onlineReceivedBy === 'Shashank' ? b.onlineAmount || 0 : 0), 0);
  const akshayOnline = reportData.reduce((a, b) => a + (b.onlineReceivedBy === 'Akshay' ? b.onlineAmount || 0 : 0), 0);

  const formatRs = (num: number) => `₹${(num || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-8 mb-10">
      
      {/* SECTION 1: Daily Excel Workbooks Storage Browser */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Daily Excel Storage Repository (.xlsx)</h2>
              <p className="text-xs text-slate-500">
                Automated daily workbook files stored directly on hub backend filesystem (`COD_YYYY-MM-DD.xlsx`)
              </p>
            </div>
          </div>

          <button
            onClick={loadFiles}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingFiles ? 'animate-spin' : ''}`} />
            <span>Refresh Excel Files</span>
          </button>
        </div>

        {/* Files Grid */}
        {loadingFiles ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : excelFiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {excelFiles.map((file) => (
              <div
                key={file.fileName}
                className="p-3.5 border border-slate-200 rounded-xl hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold font-mono text-slate-900 flex items-center gap-1.5">
                      <span>{file.fileName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      <span>{file.transactionCount} entries</span> • <strong className="text-slate-700">{formatRs(file.totalCod)}</strong>
                    </div>
                  </div>
                </div>

                <a
                  href={file.filePath}
                  download
                  className="p-2 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                  title="Download Excel (.xlsx) file"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-xs">
            No daily Excel files generated yet.
          </div>
        )}
      </div>

      {/* SECTION 2: Custom Reports & Analytics */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-6">
        
        {/* Header & Filter Controls */}
        <div className="border-b border-slate-100 pb-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-800">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Custom Reports & Exports</h2>
                <p className="text-xs text-slate-500">Filter collection records by date range and export formatted reports</p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setPresetRange('today')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  presetRange === 'today' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setPresetRange('yesterday')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  presetRange === 'yesterday' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yesterday
              </button>
              <button
                onClick={() => setPresetRange('custom')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  presetRange === 'custom' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom Range
              </button>
              <button
                onClick={() => setPresetRange('all')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  presetRange === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All History
              </button>
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPresetRange('custom');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPresetRange('custom');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Search Rider</label>
              <input
                type="text"
                value={riderFilter}
                onChange={(e) => setRiderFilter(e.target.value)}
                placeholder="All riders..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Report Aggregation Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Filtered Total COD</span>
            <div className="text-2xl font-black mt-1 text-white">{formatRs(totalCod)}</div>
            <p className="text-[10px] text-slate-400 mt-1">{reportData.length} records in date range</p>
          </div>

          <div className="p-4 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200">
            <span className="text-[11px] text-emerald-700 uppercase font-bold tracking-wider">Cash Collection</span>
            <div className="text-2xl font-bold mt-1 text-emerald-900">{formatRs(totalCash)}</div>
            <p className="text-[10px] text-emerald-700 mt-1">
              {totalCod ? Math.round((totalCash / totalCod) * 100) : 0}% of total
            </p>
          </div>

          <div className="p-4 bg-indigo-50 text-indigo-900 rounded-xl border border-indigo-200">
            <span className="text-[11px] text-indigo-700 uppercase font-bold tracking-wider">Online Collection</span>
            <div className="text-2xl font-bold mt-1 text-indigo-900">{formatRs(totalOnline)}</div>
            <p className="text-[10px] text-indigo-700 mt-1">
              {totalCod ? Math.round((totalOnline / totalCod) * 100) : 0}% of total
            </p>
          </div>

          <div className="p-4 bg-purple-50 text-purple-900 rounded-xl border border-purple-200">
            <span className="text-[11px] text-purple-700 uppercase font-bold tracking-wider">Online Receivers</span>
            <div className="text-xs font-bold mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Shashank:</span>
                <span className="text-blue-700">{formatRs(shashankOnline)}</span>
              </div>
              <div className="flex justify-between">
                <span>Akshay:</span>
                <span className="text-purple-700">{formatRs(akshayOnline)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 font-medium">
            Export format options for selected date range:
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportToCsv(reportData, `COD_Report_${startDate || 'all'}_to_${endDate || 'all'}.csv`)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() =>
                generatePdfReport(
                  reportData,
                  'Delhivery COD Periodical Audit Report',
                  `Range: ${startDate || 'All'} to ${endDate || 'All'} | Total: ${formatRs(totalCod)}`
                )
              }
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Generate PDF Report</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
