import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const EXCEL_DIR = path.join(DATA_DIR, 'excel');
const RIDERS_FILE = path.join(DATA_DIR, 'riders.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(EXCEL_DIR)) {
  fs.mkdirSync(EXCEL_DIR, { recursive: true });
}

// Initial Riders Seed Data if not present
const INITIAL_RIDERS: any[] = [];

if (!fs.existsSync(RIDERS_FILE)) {
  fs.writeFileSync(RIDERS_FILE, JSON.stringify(INITIAL_RIDERS, null, 2));
}

// Helper: Get Today's Date String YYYY-MM-DD
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Get Excel Path for Date
function getExcelFilePathForDate(dateStr: string): string {
  // Normalize dateStr format YYYY-MM-DD
  const cleanDate = dateStr.trim();
  return path.join(EXCEL_DIR, `COD_${cleanDate}.xlsx`);
}

// Helper: Ensure Daily Excel file exists with formatted header row
async function ensureDailyExcelFile(dateStr: string): Promise<string> {
  const filePath = getExcelFilePathForDate(dateStr);
  if (fs.existsSync(filePath)) {
    return filePath;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Delhivery COD Management System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('COD Transactions', {
    views: [{ showGridLines: true }],
  });

  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Time', key: 'time', width: 12 },
    { header: 'Rider Name', key: 'riderName', width: 22 },
    { header: 'Total COD Amount', key: 'codAmount', width: 18 },
    { header: 'Cash Amount', key: 'cashAmount', width: 16 },
    { header: 'Online Amount', key: 'onlineAmount', width: 16 },
    { header: 'Online Received By', key: 'onlineReceivedBy', width: 20 },
    { header: 'Payment Mode', key: 'paymentMode', width: 16 },
    { header: 'Remarks', key: 'remarks', width: 28 },
    { header: 'Transaction ID', key: 'id', width: 22 },
  ];

  // Style Header Row
  const headerRow = sheet.getRow(1);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E3A8A' }, // Navy Blue
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'medium', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: 'CBD5E1' } },
      right: { style: 'thin', color: { argb: 'CBD5E1' } },
    };
  });

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

// Helper: Read Transactions from specific Excel file
async function readTransactionsFromExcelFile(filePath: string): Promise<any[]> {
  if (!fs.existsSync(filePath)) return [];

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet('COD Transactions') || workbook.worksheets[0];
  if (!sheet) return [];

  const transactions: any[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip Header

    const dateVal = row.getCell(1).text || '';
    const timeVal = row.getCell(2).text || '';
    const riderName = row.getCell(3).text || '';
    const codAmount = Number(row.getCell(4).value) || 0;
    const cashAmount = Number(row.getCell(5).value) || 0;
    const onlineAmount = Number(row.getCell(6).value) || 0;
    const onlineReceivedBy = row.getCell(7).text || '';
    const paymentMode = row.getCell(8).text || 'Cash';
    const remarks = row.getCell(9).text || '';
    const id = row.getCell(10).text || `TXN-${Date.now()}-${rowNumber}`;

    if (riderName || codAmount > 0) {
      transactions.push({
        id,
        date: dateVal,
        time: timeVal,
        riderName,
        codAmount,
        cashAmount,
        onlineAmount,
        onlineReceivedBy,
        paymentMode,
        remarks,
        createdAt: new Date().toISOString(),
      });
    }
  });

  return transactions;
}

// Helper: Read ALL transactions from all COD_*.xlsx files
async function readAllTransactions(): Promise<any[]> {
  const files = fs.readdirSync(EXCEL_DIR).filter((f) => f.startsWith('COD_') && f.endsWith('.xlsx'));
  let all: any[] = [];

  for (const file of files) {
    const fullPath = path.join(EXCEL_DIR, file);
    const txs = await readTransactionsFromExcelFile(fullPath);
    all = all.concat(txs);
  }

  // Sort by date & time descending
  all.sort((a, b) => {
    const dateComp = (b.date || '').localeCompare(a.date || '');
    if (dateComp !== 0) return dateComp;
    return (b.time || '').localeCompare(a.time || '');
  });

  return all;
}

// Helper: Append Transaction to Excel file
async function appendTransactionToExcel(tx: any): Promise<void> {
  const dateStr = tx.date || getTodayDateString();
  const filePath = await ensureDailyExcelFile(dateStr);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet('COD Transactions') || workbook.worksheets[0];

  const newRow = sheet.addRow({
    date: tx.date,
    time: tx.time,
    riderName: tx.riderName,
    codAmount: Number(tx.codAmount),
    cashAmount: Number(tx.cashAmount),
    onlineAmount: Number(tx.onlineAmount),
    onlineReceivedBy: tx.onlineReceivedBy || '',
    paymentMode: tx.paymentMode,
    remarks: tx.remarks || '',
    id: tx.id,
  });

  newRow.height = 22;

  // Format row style
  newRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Segoe UI', size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: colNumber >= 4 && colNumber <= 6 ? 'right' : 'left' };

    // Format numbers
    if (colNumber >= 4 && colNumber <= 6) {
      cell.numFmt = '₹#,##0.00';
    }

    cell.border = {
      bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
      left: { style: 'thin', color: { argb: 'F1F5F9' } },
      right: { style: 'thin', color: { argb: 'F1F5F9' } },
    };
  });

  await workbook.xlsx.writeFile(filePath);
}

// Helper: Update Transaction in Excel file
async function updateTransactionInExcel(id: string, updatedTx: any): Promise<boolean> {
  const files = fs.readdirSync(EXCEL_DIR).filter((f) => f.startsWith('COD_') && f.endsWith('.xlsx'));
  let found = false;

  for (const file of files) {
    const filePath = path.join(EXCEL_DIR, file);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.getWorksheet('COD Transactions') || workbook.worksheets[0];

    let rowIndexToUpdate = -1;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const cellId = row.getCell(10).text;
      if (cellId === id) {
        rowIndexToUpdate = rowNumber;
      }
    });

    if (rowIndexToUpdate > 1) {
      // If date changed to another day, remove from current file and append to new date file
      const currentDateInFile = sheet.getRow(rowIndexToUpdate).getCell(1).text;
      if (updatedTx.date && updatedTx.date !== currentDateInFile) {
        sheet.spliceRows(rowIndexToUpdate, 1);
        await workbook.xlsx.writeFile(filePath);
        await appendTransactionToExcel(updatedTx);
      } else {
        const row = sheet.getRow(rowIndexToUpdate);
        row.getCell(1).value = updatedTx.date;
        row.getCell(2).value = updatedTx.time;
        row.getCell(3).value = updatedTx.riderName;
        row.getCell(4).value = Number(updatedTx.codAmount);
        row.getCell(5).value = Number(updatedTx.cashAmount);
        row.getCell(6).value = Number(updatedTx.onlineAmount);
        row.getCell(7).value = updatedTx.onlineReceivedBy || '';
        row.getCell(8).value = updatedTx.paymentMode;
        row.getCell(9).value = updatedTx.remarks || '';
        row.commit();
        await workbook.xlsx.writeFile(filePath);
      }
      found = true;
      break;
    }
  }

  return found;
}

// Helper: Delete Transaction from Excel file
async function deleteTransactionFromExcel(id: string): Promise<boolean> {
  const files = fs.readdirSync(EXCEL_DIR).filter((f) => f.startsWith('COD_') && f.endsWith('.xlsx'));
  let deleted = false;

  for (const file of files) {
    const filePath = path.join(EXCEL_DIR, file);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.getWorksheet('COD Transactions') || workbook.worksheets[0];

    let rowIndexToDelete = -1;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const cellId = row.getCell(10).text;
      if (cellId === id) {
        rowIndexToDelete = rowNumber;
      }
    });

    if (rowIndexToDelete > 1) {
      sheet.spliceRows(rowIndexToDelete, 1);
      await workbook.xlsx.writeFile(filePath);
      deleted = true;
      break;
    }
  }

  return deleted;
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// GET Dashboard Stats directly calculated from today's Excel file
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const targetDate = (req.query.date as string) || getTodayDateString();
    const filePath = getExcelFilePathForDate(targetDate);

    // Make sure today's excel file is initialized
    await ensureDailyExcelFile(targetDate);

    const txs = await readTransactionsFromExcelFile(filePath);

    let totalCodCollected = 0;
    let cashCollection = 0;
    let onlineCollection = 0;
    let onlineShashank = 0;
    let onlineAkshay = 0;
    const uniqueRiders = new Set<string>();

    for (const t of txs) {
      totalCodCollected += Number(t.codAmount) || 0;
      cashCollection += Number(t.cashAmount) || 0;
      onlineCollection += Number(t.onlineAmount) || 0;

      if (t.onlineReceivedBy === 'Shashank') {
        onlineShashank += Number(t.onlineAmount) || 0;
      } else if (t.onlineReceivedBy === 'Akshay') {
        onlineAkshay += Number(t.onlineAmount) || 0;
      }

      if (t.riderName && t.riderName.trim()) {
        uniqueRiders.add(t.riderName.trim().toLowerCase());
      }
    }

    res.json({
      totalTransactions: txs.length,
      totalCodCollected,
      cashCollection,
      onlineCollection,
      onlineShashank,
      onlineAkshay,
      totalRidersPaid: uniqueRiders.size,
      todayDate: targetDate,
      excelFileName: `COD_${targetDate}.xlsx`,
    });
  } catch (error: any) {
    console.error('Error computing dashboard stats:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard stats' });
  }
});

// GET Transactions (Filterable)
app.get('/api/transactions', async (req, res) => {
  try {
    const { date, startDate, endDate, searchRider, paymentMode, onlineReceiver } = req.query;

    let all: any[] = [];

    if (date) {
      const filePath = getExcelFilePathForDate(date as string);
      all = await readTransactionsFromExcelFile(filePath);
    } else {
      all = await readAllTransactions();
    }

    // Filter by start/end date range
    if (startDate && endDate) {
      all = all.filter((t) => t.date >= (startDate as string) && t.date <= (endDate as string));
    } else if (startDate) {
      all = all.filter((t) => t.date >= (startDate as string));
    } else if (endDate) {
      all = all.filter((t) => t.date <= (endDate as string));
    }

    // Filter by rider search
    if (searchRider) {
      const query = (searchRider as string).toLowerCase().trim();
      all = all.filter((t) => (t.riderName || '').toLowerCase().includes(query));
    }

    // Filter by payment mode
    if (paymentMode && paymentMode !== 'All') {
      all = all.filter((t) => t.paymentMode === paymentMode);
    }

    // Filter by online receiver
    if (onlineReceiver && onlineReceiver !== 'All') {
      all = all.filter((t) => t.onlineReceivedBy === onlineReceiver);
    }

    res.json(all);
  } catch (error: any) {
    console.error('Error reading transactions:', error);
    res.status(500).json({ error: error.message || 'Failed to read transactions' });
  }
});

// POST New Transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const { riderName, codAmount, cashAmount, onlineAmount, onlineReceivedBy, paymentMode, remarks, date, time } = req.body;

    // Validation Rules
    if (!riderName || !riderName.trim()) {
      return res.status(400).json({ error: 'Rider Name is required.' });
    }
    const codVal = Number(codAmount);
    if (isNaN(codVal) || codVal <= 0) {
      return res.status(400).json({ error: 'COD Amount must be a positive number.' });
    }
    if (!paymentMode) {
      return res.status(400).json({ error: 'Payment Mode is required.' });
    }

    let cashVal = Number(cashAmount) || 0;
    let onlineVal = Number(onlineAmount) || 0;

    if (paymentMode === 'Cash') {
      cashVal = codVal;
      onlineVal = 0;
    } else if (paymentMode === 'Online') {
      cashVal = 0;
      onlineVal = codVal;
      if (!onlineReceivedBy) {
        return res.status(400).json({ error: 'Please select who received the online payment (Shashank or Akshay).' });
      }
    } else if (paymentMode === 'Cash + Online') {
      if (Math.abs(cashVal + onlineVal - codVal) > 0.01) {
        return res.status(400).json({
          error: `Split Validation Failed: Cash (₹${cashVal}) + Online (₹${onlineVal}) = ₹${cashVal + onlineVal}, which does not equal COD Amount (₹${codVal}).`,
        });
      }
      if (!onlineReceivedBy && onlineVal > 0) {
        return res.status(400).json({ error: 'Please select who received the online portion (Shashank or Akshay).' });
      }
    }

    const txDate = date || getTodayDateString();
    const txTime = time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newTx = {
      id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: txDate,
      time: txTime,
      riderName: riderName.trim(),
      codAmount: codVal,
      cashAmount: cashVal,
      onlineAmount: onlineVal,
      onlineReceivedBy: onlineVal > 0 ? onlineReceivedBy || '' : '',
      paymentMode,
      remarks: remarks ? remarks.trim() : '',
      createdAt: new Date().toISOString(),
    };

    // Write to Excel immediately!
    await appendTransactionToExcel(newTx);

    res.status(201).json(newTx);
  } catch (error: any) {
    console.error('Error saving transaction to Excel:', error);
    res.status(500).json({ error: error.message || 'Failed to save transaction to Excel' });
  }
});

// PUT Update Transaction
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { riderName, codAmount, cashAmount, onlineAmount, onlineReceivedBy, paymentMode, remarks, date, time } = req.body;

    if (!riderName || !riderName.trim()) {
      return res.status(400).json({ error: 'Rider Name is required.' });
    }
    const codVal = Number(codAmount);
    if (isNaN(codVal) || codVal <= 0) {
      return res.status(400).json({ error: 'COD Amount must be a positive number.' });
    }

    let cashVal = Number(cashAmount) || 0;
    let onlineVal = Number(onlineAmount) || 0;

    if (paymentMode === 'Cash') {
      cashVal = codVal;
      onlineVal = 0;
    } else if (paymentMode === 'Online') {
      cashVal = 0;
      onlineVal = codVal;
    } else if (paymentMode === 'Cash + Online') {
      if (Math.abs(cashVal + onlineVal - codVal) > 0.01) {
        return res.status(400).json({
          error: `Split Validation Failed: Cash (₹${cashVal}) + Online (₹${onlineVal}) must equal COD Amount (₹${codVal}).`,
        });
      }
    }

    const updatedTx = {
      id,
      date: date || getTodayDateString(),
      time: time || '12:00 PM',
      riderName: riderName.trim(),
      codAmount: codVal,
      cashAmount: cashVal,
      onlineAmount: onlineVal,
      onlineReceivedBy: onlineVal > 0 ? onlineReceivedBy || '' : '',
      paymentMode,
      remarks: remarks ? remarks.trim() : '',
    };

    const success = await updateTransactionInExcel(id, updatedTx);

    if (!success) {
      return res.status(404).json({ error: 'Transaction not found in Excel records.' });
    }

    res.json(updatedTx);
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: error.message || 'Failed to update transaction' });
  }
});

// DELETE Transaction
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteTransactionFromExcel(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Transaction not found or already deleted.' });
    }

    res.json({ message: 'Transaction deleted successfully', id });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: error.message || 'Failed to delete transaction' });
  }
});

// GET Daily Excel Files
app.get('/api/excel/files', async (req, res) => {
  try {
    // Ensure today's file is present in list
    const todayStr = getTodayDateString();
    await ensureDailyExcelFile(todayStr);

    const files = fs.readdirSync(EXCEL_DIR).filter((f) => f.startsWith('COD_') && f.endsWith('.xlsx'));

    const fileList: any[] = [];

    for (const fileName of files) {
      const fullPath = path.join(EXCEL_DIR, fileName);
      const stats = fs.statSync(fullPath);
      const datePart = fileName.replace('COD_', '').replace('.xlsx', '');

      const txs = await readTransactionsFromExcelFile(fullPath);

      let totalCod = 0;
      let cashCod = 0;
      let onlineCod = 0;

      txs.forEach((t) => {
        totalCod += Number(t.codAmount) || 0;
        cashCod += Number(t.cashAmount) || 0;
        onlineCod += Number(t.onlineAmount) || 0;
      });

      fileList.push({
        fileName,
        date: datePart,
        filePath: `/api/excel/download/${fileName}`,
        sizeBytes: stats.size,
        transactionCount: txs.length,
        totalCod,
        cashCod,
        onlineCod,
        updatedAt: stats.mtime.toISOString(),
      });
    }

    fileList.sort((a, b) => b.date.localeCompare(a.date));

    res.json(fileList);
  } catch (error: any) {
    console.error('Error reading Excel files:', error);
    res.status(500).json({ error: error.message || 'Failed to list Excel files' });
  }
});

// GET Download Excel File
app.get('/api/excel/download/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    if (!filename.startsWith('COD_') || !filename.endsWith('.xlsx')) {
      return res.status(400).json({ error: 'Invalid file name' });
    }

    const filePath = path.join(EXCEL_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Requested Excel file does not exist.' });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(filePath);
  } catch (error: any) {
    console.error('Error downloading Excel file:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// GET Riders List
app.get('/api/riders', (req, res) => {
  try {
    if (fs.existsSync(RIDERS_FILE)) {
      const data = fs.readFileSync(RIDERS_FILE, 'utf-8');
      return res.json(JSON.parse(data));
    }
    res.json(INITIAL_RIDERS);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to read riders list' });
  }
});

// POST Add New Rider
app.post('/api/riders', (req, res) => {
  try {
    const { name, phone, vehicleNo } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Rider Name is required' });
    }

    let riders = [];
    if (fs.existsSync(RIDERS_FILE)) {
      riders = JSON.parse(fs.readFileSync(RIDERS_FILE, 'utf-8'));
    }

    // Check duplicate
    const existing = riders.find((r: any) => r.name.toLowerCase().trim() === name.toLowerCase().trim());
    if (existing) {
      return res.json(existing);
    }

    const newRider = {
      id: `r-${Date.now()}`,
      name: name.trim(),
      phone: phone || '',
      vehicleNo: vehicleNo || '',
      addedAt: new Date().toISOString(),
    };

    riders.push(newRider);
    fs.writeFileSync(RIDERS_FILE, JSON.stringify(riders, null, 2));

    res.status(201).json(newRider);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add rider' });
  }
});

// POST Bulk Import Riders
app.post('/api/riders/import', (req, res) => {
  try {
    const { names } = req.body; // Array of strings or object array
    if (!Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ error: 'Provide a valid array of rider names' });
    }

    let riders = [];
    if (fs.existsSync(RIDERS_FILE)) {
      riders = JSON.parse(fs.readFileSync(RIDERS_FILE, 'utf-8'));
    }

    let addedCount = 0;
    for (const item of names) {
      const name = typeof item === 'string' ? item.trim() : (item.name || '').trim();
      if (name) {
        const exists = riders.some((r: any) => r.name.toLowerCase() === name.toLowerCase());
        if (!exists) {
          riders.push({
            id: `r-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name,
            phone: typeof item === 'object' ? item.phone || '' : '',
            vehicleNo: typeof item === 'object' ? item.vehicleNo || '' : '',
            addedAt: new Date().toISOString(),
          });
          addedCount++;
        }
      }
    }

    fs.writeFileSync(RIDERS_FILE, JSON.stringify(riders, null, 2));

    res.json({ message: `Successfully imported ${addedCount} new riders`, totalRiders: riders.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to import riders' });
  }
});

// Vite Middleware Integration for Development & Express Serve for Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Delhivery COD Management System server running on http://localhost:${PORT}`);
  });
}

startServer();
