import React from 'react';
import { DashboardStats } from '../types';
import { IndianRupee, CreditCard, Banknote, Users, ArrowUpRight, CheckCircle2, UserCheck } from 'lucide-react';

interface DashboardCardsProps {
  stats: DashboardStats;
  loading?: boolean;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({ stats, loading }) => {
  const formatAmount = (val: number) => {
    return `₹${(val || 0).toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm animate-pulse h-28 flex flex-col justify-between">
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-7 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-100 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total COD Collected */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-xl p-4 border border-blue-800/80 shadow-sm relative overflow-hidden">
          <div className="absolute -right-3 -bottom-3 opacity-10">
            <IndianRupee className="w-24 h-24" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-blue-200 uppercase tracking-wider">Total COD Collected</span>
            <div className="bg-blue-600/40 p-1.5 rounded-lg border border-blue-400/30">
              <IndianRupee className="w-4 h-4 text-blue-300" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-white mb-1">
            {formatAmount(stats.totalCodCollected)}
          </div>
          <p className="text-[11px] text-blue-300/80 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Synced to Excel today</span>
          </p>
        </div>

        {/* Cash Collection */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cash Collection</span>
            <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
              <Banknote className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            {formatAmount(stats.cashCollection)}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{
                width: `${stats.totalCodCollected ? Math.min(100, (stats.cashCollection / stats.totalCodCollected) * 100) : 0}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Online Collection */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Online Collection</span>
            <div className="bg-indigo-50 p-1.5 rounded-lg border border-indigo-100">
              <CreditCard className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            {formatAmount(stats.onlineCollection)}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full"
              style={{
                width: `${stats.totalCodCollected ? Math.min(100, (stats.onlineCollection / stats.totalCodCollected) * 100) : 0}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transactions Today</span>
            <div className="bg-slate-100 p-1.5 rounded-lg">
              <ArrowUpRight className="w-4 h-4 text-slate-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            {stats.totalTransactions} <span className="text-xs font-normal text-slate-500">entries</span>
          </div>
          <p className="text-[11px] text-slate-500">Recorded in Excel sheet</p>
        </div>

        {/* Total Riders Paid Today */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Riders Paid Today</span>
            <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-100">
              <Users className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            {stats.totalRidersPaid} <span className="text-xs font-normal text-slate-500">unique riders</span>
          </div>
          <p className="text-[11px] text-slate-500">Active on hub floor</p>
        </div>

      </div>

      {/* Online Breakdown Bar */}
      <div className="bg-slate-800 text-white rounded-xl p-3.5 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-700">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <UserCheck className="w-4 h-4 text-blue-400" />
          <span>Online Receiver Breakdown:</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span className="text-slate-300">Shashank:</span>
            <span className="font-bold text-white">{formatAmount(stats.onlineShashank)}</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span className="text-slate-300">Akshay:</span>
            <span className="font-bold text-white">{formatAmount(stats.onlineAkshay)}</span>
          </div>

          <div className="text-slate-400 text-[11px] hidden lg:block border-l border-slate-700 pl-4">
            Total Online Received: <strong className="text-indigo-300">{formatAmount(stats.onlineCollection)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
