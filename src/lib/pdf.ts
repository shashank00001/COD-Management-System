import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';

export function generatePdfReport(transactions: Transaction[], title = 'COD Daily Collection Report', subtitle = '') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header Banner
  doc.setFillColor(30, 58, 138); // Dark Navy Blue #1E3A8A
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DELHIVERY | LOGISTICS OPERATIONS HUB', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('COD MANAGEMENT & RECONCILIATION REPORT', 14, 18);

  const generatedAt = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  doc.text(`Generated: ${generatedAt}`, 283, 15, { align: 'right' });

  // Title section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 32);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 38);
  }

  // Summary Metrics
  let totalCod = 0;
  let totalCash = 0;
  let totalOnline = 0;
  let shashankAmt = 0;
  let akshayAmt = 0;

  transactions.forEach((t) => {
    totalCod += Number(t.codAmount) || 0;
    totalCash += Number(t.cashAmount) || 0;
    totalOnline += Number(t.onlineAmount) || 0;
    if (t.onlineReceivedBy === 'Shashank') shashankAmt += Number(t.onlineAmount) || 0;
    if (t.onlineReceivedBy === 'Akshay') akshayAmt += Number(t.onlineAmount) || 0;
  });

  const startY = subtitle ? 44 : 38;

  // Summary Cards Bar
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, startY, 269, 16, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);

  const formatRs = (num: number) => `Rs.${num.toLocaleString('en-IN')}`;

  doc.text(`Total Entries: ${transactions.length}`, 20, startY + 10);
  doc.text(`Total COD: ${formatRs(totalCod)}`, 65, startY + 10);
  doc.text(`Cash: ${formatRs(totalCash)}`, 120, startY + 10);
  doc.text(`Online: ${formatRs(totalOnline)}`, 160, startY + 10);
  doc.text(`(Shashank: ${formatRs(shashankAmt)} | Akshay: ${formatRs(akshayAmt)})`, 205, startY + 10);

  // Table Data
  const tableData = transactions.map((t, idx) => [
    idx + 1,
    t.date,
    t.time,
    t.riderName,
    `Rs.${(t.codAmount || 0).toLocaleString('en-IN')}`,
    `Rs.${(t.cashAmount || 0).toLocaleString('en-IN')}`,
    `Rs.${(t.onlineAmount || 0).toLocaleString('en-IN')}`,
    t.onlineReceivedBy || '-',
    t.paymentMode,
    t.remarks || '-',
  ]);

  autoTable(doc, {
    startY: startY + 22,
    head: [['#', 'Date', 'Time', 'Rider Name', 'Total COD', 'Cash Amt', 'Online Amt', 'Online Receiver', 'Mode', 'Remarks']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 42, fontStyle: 'bold' },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 26, halign: 'right' },
      7: { cellWidth: 28, halign: 'center' },
      8: { cellWidth: 26, halign: 'center' },
      9: { cellWidth: 41 },
    },
    didDrawPage: (data) => {
      // Footer page number
      const str = `Page ${doc.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, 283, 202, { align: 'right' });
      doc.text('Delhivery Store Operations System • Internal Confidential', 14, 202);
    },
  });

  const fileName = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.pdf`;
  doc.save(fileName);
}
