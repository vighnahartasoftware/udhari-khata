import type { Customer, Transaction } from '@/types/domain';
import { calculateCustomerTotals } from './balance';
import { format } from 'date-fns';

/**
 * Sanitizes cell content to prevent CSV Formula Injection in spreadsheet software (Excel, Google Sheets).
 * Prepends a single quote if the value starts with dangerous formula characters: '=', '+', '-', '@', '\t', '\r'.
 */
export function sanitizeCSVCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (!str.trim()) return '""';

  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  const needsQuoteEscape = dangerousChars.some((char) => str.startsWith(char));

  const safeStr = needsQuoteEscape ? `'${str}` : str;
  return `"${safeStr.replace(/"/g, '""')}"`;
}

function downloadCSVFile(csvContent: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportCustomersToCSV(customers: Customer[], transactions: Transaction[]) {
  const headers = [
    sanitizeCSVCell('ग्राहक क्र.'),
    sanitizeCSVCell('नाव'),
    sanitizeCSVCell('दुसरे नाव'),
    sanitizeCSVCell('मोबाईल नंबर'),
    sanitizeCSVCell('पत्ता'),
    sanitizeCSVCell('एकूण उधारी ₹'),
    sanitizeCSVCell('एकूण भरणा ₹'),
    sanitizeCSVCell('सध्याची बाकी ₹'),
  ];

  const rows = customers.map((c, idx) => {
    const totals = calculateCustomerTotals(c, transactions);
    return [
      sanitizeCSVCell(idx + 1),
      sanitizeCSVCell(c.name),
      sanitizeCSVCell(c.alternateName),
      sanitizeCSVCell(c.mobile),
      sanitizeCSVCell(c.address),
      sanitizeCSVCell(totals.totalCredit),
      sanitizeCSVCell(totals.totalPayment),
      sanitizeCSVCell(totals.balance),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const filename = `udhari_khata_customers_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadCSVFile(csvContent, filename);
}

export function exportCustomerLedgerToCSV(customer: Customer, transactions: Transaction[]) {
  const customerTxns = transactions
    .filter((t) => t.customerId === customer.id && t.deletedAt === null)
    .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());

  const headers = [
    sanitizeCSVCell('तारीख'),
    sanitizeCSVCell('प्रकार'),
    sanitizeCSVCell('रक्कम ₹'),
    sanitizeCSVCell('पेमेंट पद्धत'),
    sanitizeCSVCell('विवरण / टीप'),
  ];

  let runningBalance = Number(customer.openingBalance || 0);

  const initialRow = [
    sanitizeCSVCell(format(new Date(customer.createdAt), 'dd-MM-yyyy')),
    sanitizeCSVCell('प्रारंभिक बाकी (Opening)'),
    sanitizeCSVCell(customer.openingBalance),
    sanitizeCSVCell('-'),
    sanitizeCSVCell('प्रारंभिक बाकी'),
  ].join(',');

  const rows = customerTxns.map((t) => {
    if (t.type === 'credit') {
      runningBalance = Math.round((runningBalance + Number(t.amount)) * 100) / 100;
    } else {
      runningBalance = Math.round((runningBalance - Number(t.amount)) * 100) / 100;
    }

    const modeText =
      t.paymentMode === 'cash'
        ? 'रोख (Cash)'
        : t.paymentMode === 'upi'
          ? 'UPI'
          : t.paymentMode === 'bank_transfer'
            ? 'बँक ट्रान्सफर'
            : t.paymentMode === 'other'
              ? 'इतर'
              : '-';

    return [
      sanitizeCSVCell(format(new Date(t.transactionDate), 'dd-MM-yyyy HH:mm')),
      sanitizeCSVCell(t.type === 'credit' ? 'उधारी (Credit)' : 'पेमेंट (Payment)'),
      sanitizeCSVCell(t.amount),
      sanitizeCSVCell(modeText),
      sanitizeCSVCell(t.description),
    ].join(',');
  });

  const summaryRow = [
    sanitizeCSVCell(''),
    sanitizeCSVCell('सध्याची एकूण बाकी (Current Net Balance)'),
    sanitizeCSVCell(runningBalance),
    sanitizeCSVCell(''),
    sanitizeCSVCell(''),
  ].join(',');

  const csvContent = [
    `${sanitizeCSVCell(`ग्राहक ledger: ${customer.name}`)}`,
    `${sanitizeCSVCell(`मोबाईल: ${customer.mobile || '-'}`)}`,
    headers.join(','),
    initialRow,
    ...rows,
    summaryRow,
  ].join('\n');

  const filename = `ledger_${customer.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadCSVFile(csvContent, filename);
}
