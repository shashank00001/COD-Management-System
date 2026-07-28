import React, { useState, useEffect } from 'react';
import { DashboardStats, Transaction, Rider } from './types';
import {
  fetchDashboardStats,
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  fetchRiders,
  addRider,
  importRiders,
} from './lib/api';
import { Header } from './components/Header';
import { DashboardCards } from './components/DashboardCards';
import { CodEntryForm } from './components/CodEntryForm';
import { TransactionsTable } from './components/TransactionsTable';
import { ReportsView } from './components/ReportsView';
import { RiderManager } from './components/RiderManager';
import { ReceiptModal } from './components/ReceiptModal';
import { DailyClosingModal } from './components/DailyClosingModal';
import { EditTransactionModal } from './components/EditTransactionModal';
import { LayoutDashboard, FileSpreadsheet, History, Layers } from 'lucide-react';

export default function App() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTransactions: 0,
    totalCodCollected: 0,
    cashCollection: 0,
    onlineCollection: 0,
    onlineShashank: 0,
    onlineAkshay: 0,
    totalRidersPaid: 0,
    todayDate: new Date().toISOString().split('T')[0],
    excelFileName: 'COD_Today.xlsx',
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);

  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [loadingTx, setLoadingTx] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'ledger'>('dashboard');

  // Modals
  const [isRiderManagerOpen, setIsRiderManagerOpen] = useState<boolean>(false);
  const [isDailyClosingOpen, setIsDailyClosingOpen] = useState<boolean>(false);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Initial Data Load
  const loadInitialData = async () => {
    setIsRefreshing(true);
    try {
      const [sData, txData, rData] = await Promise.all([
        fetchDashboardStats(),
        fetchTransactions(),
        fetchRiders(),
      ]);
      setStats(sData);
      setTransactions(txData);
      setRiders(rData);
    } catch (err) {
      console.error('Failed to load initial COD system data:', err);
    } finally {
      setLoadingStats(false);
      setLoadingTx(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Save Transaction Handler
  const handleSaveTransaction = async (data: Partial<Transaction>): Promise<Transaction> => {
    const saved = await createTransaction(data);
    // Refresh stats & list
    const [sData, txData] = await Promise.all([fetchDashboardStats(), fetchTransactions()]);
    setStats(sData);
    setTransactions(txData);
    return saved;
  };

  // Edit Transaction Handler
  const handleUpdateTransaction = async (id: string, data: Partial<Transaction>): Promise<Transaction> => {
    const updated = await updateTransaction(id, data);
    const [sData, txData] = await Promise.all([fetchDashboardStats(), fetchTransactions()]);
    setStats(sData);
    setTransactions(txData);
    return updated;
  };

  // Delete Transaction Handler
  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
    const [sData, txData] = await Promise.all([fetchDashboardStats(), fetchTransactions()]);
    setStats(sData);
    setTransactions(txData);
  };

  // Add Rider Handler
  const handleAddRider = async (riderData: { name: string; phone?: string; vehicleNo?: string }) => {
    const newR = await addRider(riderData);
    const updatedRiders = await fetchRiders();
    setRiders(updatedRiders);
    return newR;
  };

  // Import Riders Handler
  const handleImportRiders = async (names: string[]) => {
    const res = await importRiders(names);
    const updatedRiders = await fetchRiders();
    setRiders(updatedRiders);
    return res;
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white flex flex-col">
      
      {/* Top Operations Header */}
      <Header
        todayExcelFileName={stats.excelFileName}
        onOpenRiderManager={() => setIsRiderManagerOpen(true)}
        onOpenDailyClosing={() => setIsDailyClosingOpen(true)}
        onRefreshData={loadInitialData}
        isRefreshing={isRefreshing}
      />

      {/* Primary Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1 sm:gap-2">
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Operations Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                activeTab === 'ledger'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Transactions Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Storage & Reports</span>
            </button>

          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Direct Excel Persistence Engine Active</span>
          </div>
        </div>

        {/* Tab Content 1: Main Operations Dashboard & Entry */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Top Summary Metrics */}
            <DashboardCards stats={stats} loading={loadingStats} />

            {/* Entry Form */}
            <CodEntryForm
              riders={riders}
              onSaveTransaction={handleSaveTransaction}
              onAddRider={handleAddRider}
              onShowReceipt={(tx) => setReceiptTx(tx)}
            />

            {/* Recent Transactions Table */}
            <TransactionsTable
              transactions={transactions}
              loading={loadingTx}
              onEditTransaction={(tx) => setEditingTx(tx)}
              onDeleteTransaction={handleDeleteTransaction}
              onShowReceipt={(tx) => setReceiptTx(tx)}
              onRefreshData={loadInitialData}
            />

          </div>
        )}

        {/* Tab Content 2: Transactions Ledger */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <TransactionsTable
              transactions={transactions}
              loading={loadingTx}
              onEditTransaction={(tx) => setEditingTx(tx)}
              onDeleteTransaction={handleDeleteTransaction}
              onShowReceipt={(tx) => setReceiptTx(tx)}
              onRefreshData={loadInitialData}
            />
          </div>
        )}

        {/* Tab Content 3: Reports & Excel Files Browser */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <ReportsView />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-4 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium text-slate-300">
            <span className="bg-red-600 text-white font-black px-1 rounded text-[10px]">DELHIVERY</span>
            <span>COD Management Portal v2.5</span>
          </div>
          <div className="text-[11px] text-slate-500">
            ExcelJS Storage Engine • Delhivery Logistics Internal Hub Operations
          </div>
        </div>
      </footer>

      {/* Modals */}
      <RiderManager
        isOpen={isRiderManagerOpen}
        onClose={() => setIsRiderManagerOpen(false)}
        riders={riders}
        onAddRider={handleAddRider}
        onImportRiders={handleImportRiders}
      />

      <ReceiptModal
        transaction={receiptTx}
        onClose={() => setReceiptTx(null)}
      />

      <DailyClosingModal
        isOpen={isDailyClosingOpen}
        onClose={() => setIsDailyClosingOpen(false)}
        stats={stats}
      />

      <EditTransactionModal
        transaction={editingTx}
        onClose={() => setEditingTx(null)}
        onSaveUpdate={handleUpdateTransaction}
      />

    </div>
  );
}
