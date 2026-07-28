export type PaymentMode = 'Cash' | 'Online' | 'Cash + Online';

export type OnlineReceiver = 'Shashank' | 'Akshay';

export interface Transaction {
  id: string;
  date: string; // Format: YYYY-MM-DD or DD-MM-YYYY
  time: string; // Format: hh:mm AM/PM
  riderName: string;
  codAmount: number;
  cashAmount: number;
  onlineAmount: number;
  onlineReceivedBy: OnlineReceiver | '';
  paymentMode: PaymentMode;
  remarks: string;
  createdAt: string;
}

export interface DashboardStats {
  totalTransactions: number;
  totalCodCollected: number;
  cashCollection: number;
  onlineCollection: number;
  onlineShashank: number;
  onlineAkshay: number;
  totalRidersPaid: number;
  todayDate: string;
  excelFileName: string;
}

export interface Rider {
  id: string;
  name: string;
  phone?: string;
  vehicleNo?: string;
  addedAt?: string;
}

export interface DailyExcelFileInfo {
  fileName: string;
  date: string;
  filePath: string;
  sizeBytes: number;
  transactionCount: number;
  totalCod: number;
  cashCod: number;
  onlineCod: number;
  updatedAt: string;
}

export interface TransactionFilter {
  searchRider?: string;
  searchDate?: string;
  startDate?: string;
  endDate?: string;
  paymentMode?: string;
  onlineReceiver?: string;
  presetRange?: 'today' | 'yesterday' | 'custom' | 'all';
}
